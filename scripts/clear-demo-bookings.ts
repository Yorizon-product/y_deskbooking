/** Dev-only: wipe today's confirmed bookings so the reel can start clean. */
import { PrismaClient } from "@prisma/client";
import { slotToUtcRange, todayInOfficeTz } from "../lib/booking/slots";

async function main() {
  const prisma = new PrismaClient();
  try {
    const today = todayInOfficeTz();
    const { startAt: dayStart, endAt: dayEnd } = slotToUtcRange(today, "all-day");
    const { count } = await prisma.booking.deleteMany({
      where: {
        status: "confirmed",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
    });
    console.log(`cleared ${count} confirmed booking(s) for ${today}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
