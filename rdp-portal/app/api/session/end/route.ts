import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let sessionToken: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    sessionToken = body.sessionToken ?? null;
  } else {
    const body = await req.text();
    const params = new URLSearchParams(body);
    sessionToken = params.get("sessionToken");
  }

  if (!sessionToken) return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });

  const session = await prisma.session.findUnique({ where: { oneTimeKey: sessionToken } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { status: "ended", endedAt: new Date(), lastHeartbeatAt: new Date() },
    });
    const uds = await tx.uds.findUnique({ where: { id: session.udsId } });
    if (uds && uds.status === "in_use") {
      await tx.uds.update({
        where: { id: uds.id },
        data: { status: "available", usedByUserId: null },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
