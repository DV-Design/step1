import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyConnectToken } from "@/lib/rdpTokens";
import crypto from "crypto";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  let data: any;
  try { data = verifyConnectToken(token); } catch { return NextResponse.json({ error: "Invalid token" }, { status: 400 }); }

  const uds = await prisma.uds.findUnique({ where: { id: data.udsId } });
  if (!uds) return NextResponse.json({ error: "UDS not found" }, { status: 404 });

  if (uds.status !== "available")
    return NextResponse.json({ error: "UDS not available" }, { status: 409 });

  const oneTimeKey = crypto.randomBytes(24).toString("hex");
  await prisma.$transaction(async (tx) => {
    await tx.uds.update({
      where: { id: uds.id },
      data: { status: "in_use", usedByUserId: data.userId },
    });
    await tx.session.create({
      data: {
        udsId: uds.id,
        userId: data.userId,
        status: "started",
        oneTimeKey,
        lastHeartbeatAt: new Date(),
      },
    });
  });

  const rdpContent = [
    `full address:s:${uds.ipAddress}`,
    `enablecredsspsupport:i:0`,
    `prompt for credentials on client:i:1`,
  ].join("\n");

  return NextResponse.json({ sessionToken: oneTimeKey, rdpContent });
}
