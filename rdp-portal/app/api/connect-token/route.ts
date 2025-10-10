import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createConnectToken } from "@/lib/rdpTokens";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const udsId = url.searchParams.get("udsId");
  if (!udsId) return NextResponse.json({ error: "Missing udsId" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uds = await prisma.uds.findUnique({ where: { id: udsId } });
  if (!uds) return NextResponse.json({ error: "UDS not found" }, { status: 404 });

  const token = createConnectToken({ udsId, userId: (session.user as { id?: string } | undefined)?.id ?? "" });
  const baseCandidate = process.env.PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  const base = baseCandidate && baseCandidate.length > 0 ? baseCandidate : url.origin;

  return NextResponse.json({ token, base });
}
