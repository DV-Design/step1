import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

function ensureAdmin(session: { user?: { role?: string } } | null) {
  if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
    throw new Error("unauthorized");
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const uds = await prisma.uds.findMany({ orderBy: { displayName: "asc" } });
  return NextResponse.json(uds);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json();
  const item = await prisma.uds.create({
    data: {
      displayName: body.displayName,
      ipAddress: body.ipAddress,
      status: body.status ?? "available",
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json();
  const item = await prisma.uds.update({
    where: { id: body.id },
    data: {
      displayName: body.displayName,
      ipAddress: body.ipAddress,
      status: body.status,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.uds.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
