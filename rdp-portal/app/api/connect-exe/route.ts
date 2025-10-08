import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createConnectToken } from "@/lib/rdpTokens";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams, origin } = new URL(req.url);
  const udsId = searchParams.get("udsId");
  if (!udsId) return NextResponse.json({ error: "Missing udsId" }, { status: 400 });
  const uds = await prisma.uds.findUnique({ where: { id: udsId } });
  if (!uds) return NextResponse.json({ error: "UDS not found" }, { status: 404 });

  const token = createConnectToken({ udsId, userId: (session.user as { id?: string } | undefined)?.id ?? "" });
  const base = process.env.PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || origin;

  const instructions = `RdpConnector.exe --token ${token} --base ${base}`;
  return new NextResponse(instructions, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="connect.txt"`,
    },
  });
}
