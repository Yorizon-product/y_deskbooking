"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingCreateSchema, BookingCancelSchema } from "@/lib/validators/booking";
import {
  isWithinBookingWindow,
  slotToUtcRange,
  slotKeyToDb,
  isPast,
} from "@/lib/booking/slots";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createBooking(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const userId = session.user.id;

  const parsed = BookingCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { deskId, date, slot } = parsed.data;

  if (!isWithinBookingWindow(date)) {
    return { ok: false, error: "Date is outside the booking window." };
  }

  // Validate the desk is still bookable.
  const desk = await prisma.desk.findUnique({
    where: { id: deskId },
    select: { id: true, active: true, floor: { select: { active: true } } },
  });
  if (!desk || !desk.active || !desk.floor.active) {
    return { ok: false, error: "This desk is no longer available." };
  }

  // One confirmed booking per user per office-local date.
  // The partial unique index is not enforceable at the DB level (AT TIME ZONE
  // is STABLE, not IMMUTABLE), so we enforce here. The desk-level EXCLUDE is
  // still the hard DB invariant for overlap prevention.
  const { startAt, endAt } = slotToUtcRange(date, slot);
  const dayStart = slotToUtcRange(date, "all-day").startAt;
  const dayEnd = slotToUtcRange(date, "all-day").endAt;
  const existing = await prisma.booking.findFirst({
    where: {
      userId,
      status: "confirmed",
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "You already have a booking for this date. Cancel it first to pick a different desk or slot.",
    };
  }

  try {
    await prisma.booking.create({
      data: {
        deskId,
        userId,
        slot: slotKeyToDb(slot),
        startAt,
        endAt,
        status: "confirmed",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // 23P01 / Prisma P2002-ish for exclusion constraint surfaces as P2010 raw
      // or P2030; message contains the constraint name either way.
      const msg = "meta" in e ? JSON.stringify(e.meta ?? {}) : e.message;
      if (msg.includes("Booking_no_overlap") || msg.includes("exclusion")) {
        return { ok: false, error: "That desk was just booked for this slot. Try another." };
      }
    }
    if (e instanceof Error && /Booking_no_overlap|exclusion/i.test(e.message)) {
      return { ok: false, error: "That desk was just booked for this slot. Try another." };
    }
    throw e;
  }

  revalidatePath("/book");
  revalidatePath("/my-bookings");
  revalidatePath("/admin");
  return { ok: true };
}

export async function cancelBooking(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const parsed = BookingCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true, startAt: true, status: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  const isOwner = booking.userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) return { ok: false, error: "Not authorised" };

  if (booking.status !== "confirmed") {
    return { ok: false, error: "This booking is already cancelled." };
  }
  if (isPast(booking.startAt)) {
    return { ok: false, error: "Past bookings cannot be cancelled." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledById: session.user.id,
    },
  });

  // Best-effort cache-busting across all surfaces that show bookings.
  revalidatePath("/book");
  revalidatePath("/my-bookings");
  revalidatePath("/admin");
  return { ok: true };
}

