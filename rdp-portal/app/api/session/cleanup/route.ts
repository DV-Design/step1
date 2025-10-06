import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// This endpoint cleans up stale sessions older than timeoutMs without heartbeat
// It should be called by a cron or manually via GET
const TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || "180000", 10); // default 3 minutes

export async function POST() {
  const cutoff = new Date(Date.now() - TIMEOUT_MS);

  const stale = await prisma.session.findMany({
    where: {
      status: "started",
      OR: [
        { lastHeartbeatAt: { lt: cutoff } },
        { lastHeartbeatAt: null, startedAt: { lt: cutoff } },
      ],
    },
  });

  for (const s of stale) {
    await prisma.$transaction(async (tx) => {
      await tx.session.update({ where: { id: s.id }, data: { status: "ended", endedAt: new Date() } });
      const uds = await tx.uds.findUnique({ where: { id: s.udsId } });
      if (uds && uds.status === "in_use") {
        await tx.uds.update({ where: { id: uds.id }, data: { status: "available", usedByUserId: null } });
      }
    });
  }

  return NextResponse.json({ ok: true, released: stale.length });
}

export async function GET() {
  return POST();
}
