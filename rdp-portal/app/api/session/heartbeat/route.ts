import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sessionToken } = await req.json().catch(() => ({ sessionToken: null }));
  if (!sessionToken) return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });

  const session = await prisma.session.findUnique({ where: { oneTimeKey: sessionToken } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "ended") return NextResponse.json({ ok: true });

  await prisma.session.update({ where: { id: session.id }, data: { lastHeartbeatAt: new Date() } });
  return NextResponse.json({ ok: true });
}
