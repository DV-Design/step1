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
  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json();
  const user = await prisma.user.update({ where: { id: body.id }, data: { role: body.role } });
  return NextResponse.json(user);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  try { ensureAdmin(session); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
