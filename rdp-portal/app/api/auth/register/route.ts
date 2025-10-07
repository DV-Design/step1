import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { firstName, lastName, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const count = await prisma.user.count();
  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        firstName, lastName, email, passwordHash,
        role: count === 0 ? "admin" : "user",
      },
    });
  } catch (e: any) {
    // Handle race condition for parallel registrations on same email
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
