/**
 * Smoke test for the booking invariants, run directly against the DB (no HTTP).
 * Skips the `auth()` layer — we're proving that the DB + pure logic correctly
 * reject overlapping bookings on a desk, so the server action's friendly-error
 * mapping has something real to react to.
 */

import { PrismaClient } from "@prisma/client";
import {
  slotToUtcRange,
  slotKeyToDb,
  isWithinBookingWindow,
  shiftDate,
  todayInOfficeTz,
  classifySlot,
} from "../lib/booking/slots";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirstOrThrow({ where: { role: "admin" } });
  const desk = await prisma.desk.findFirstOrThrow({ where: { active: true } });

  // Use a date two weeks out to avoid collisions with anything you might create
  // by hand for real testing.
  const date = shiftDate(todayInOfficeTz(), 14);

  if (!isWithinBookingWindow(date)) throw new Error("picked a date outside the booking window");
  console.log(`✓ window check passes for ${date}`);

  // Clean prior runs.
  await prisma.booking.deleteMany({
    where: {
      deskId: desk.id,
      startAt: { gte: slotToUtcRange(date, "all-day").startAt, lt: slotToUtcRange(date, "all-day").endAt },
    },
  });

  // A: user books morning.
  const morning = slotToUtcRange(date, "morning");
  const a = await prisma.booking.create({
    data: {
      deskId: desk.id,
      userId: user.id,
      slot: slotKeyToDb("morning"),
      ...morning,
      status: "confirmed",
    },
  });
  console.log(`✓ created morning booking: ${a.id}`);
  if (classifySlot(a.startAt, a.endAt) !== "morning") throw new Error("slot classify wrong");

  // B: another user attempts the SAME morning slot on the same desk.
  const otherUser = await prisma.user.upsert({
    where: { email: "smoke+other@example.com" },
    update: {},
    create: { email: "smoke+other@example.com", name: "Smoke Other" },
  });
  try {
    await prisma.booking.create({
      data: {
        deskId: desk.id,
        userId: otherUser.id,
        slot: slotKeyToDb("morning"),
        ...morning,
        status: "confirmed",
      },
    });
    throw new Error("overlap was accepted — constraint is broken");
  } catch (e) {
    if (!(e instanceof Error) || !/Booking_no_overlap|exclusion/i.test(e.message)) throw e;
    console.log("✓ overlap rejected by DB");
  }

  // C: same user tries all-day on the same desk (overlaps morning).
  const allDay = slotToUtcRange(date, "all-day");
  try {
    await prisma.booking.create({
      data: {
        deskId: desk.id,
        userId: user.id,
        slot: slotKeyToDb("all-day"),
        ...allDay,
        status: "confirmed",
      },
    });
    throw new Error("all-day-over-morning was accepted — constraint is broken");
  } catch (e) {
    if (!(e instanceof Error) || !/Booking_no_overlap|exclusion/i.test(e.message)) throw e;
    console.log("✓ all-day overlapping an existing morning rejected");
  }

  // D: cancelling A frees the slot — the constraint is WHERE status = 'confirmed'.
  await prisma.booking.update({
    where: { id: a.id },
    data: { status: "cancelled", cancelledAt: new Date(), cancelledById: user.id },
  });
  const b = await prisma.booking.create({
    data: {
      deskId: desk.id,
      userId: otherUser.id,
      slot: slotKeyToDb("morning"),
      ...morning,
      status: "confirmed",
    },
  });
  console.log(`✓ after cancel, same slot is free again: ${b.id}`);

  // Cleanup.
  await prisma.booking.deleteMany({
    where: { deskId: desk.id, startAt: morning.startAt },
  });
  await prisma.user.deleteMany({ where: { email: "smoke+other@example.com" } });
  console.log("✓ booking smoke test passed");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
