/**
 * Dev-only: ensure the seeded admin has a confirmed booking for today, so the
 * /my-bookings hero card renders with real data. Idempotent — safe to rerun.
 */
import { PrismaClient } from "@prisma/client";
import { slotToUtcRange, todayInOfficeTz, slotKeyToDb } from "../lib/booking/slots";

async function main() {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirstOrThrow({ where: { role: "admin" } });
    // Pick 1-B so the floor plan has a natural center point (mirrors the Paper mock).
    const desk = await prisma.desk.findFirstOrThrow({ where: { label: "1-B", active: true } });

    const today = todayInOfficeTz();
    const { startAt: dayStart, endAt: dayEnd } = slotToUtcRange(today, "all-day");

    // Remove any existing confirmed bookings for this user today so this script is idempotent.
    await prisma.booking.updateMany({
      where: {
        userId: admin.id,
        status: "confirmed",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      data: { status: "cancelled", cancelledAt: new Date(), cancelledById: admin.id },
    });

    const { startAt, endAt } = slotToUtcRange(today, "all-day");
    const b = await prisma.booking.create({
      data: {
        deskId: desk.id,
        userId: admin.id,
        slot: slotKeyToDb("all-day"),
        startAt,
        endAt,
        status: "confirmed",
      },
    });
    console.log(`seeded booking ${b.id} for ${admin.email} on ${today} at ${desk.label}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
