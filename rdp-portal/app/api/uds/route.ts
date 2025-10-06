import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uds = await prisma.uds.findMany({
    select: {
      id: true,
      displayName: true,
      status: true,
      usedBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json(uds);
}
