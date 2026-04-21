import { prisma } from "@/lib/prisma";
import {
  SLOT_KEYS,
  type SlotKey,
  classifySlot,
  slotToUtcRange,
} from "@/lib/booking/slots";
import type { DeskAttributes } from "@/lib/validators/inventory";
import { DeskAttributesSchema } from "@/lib/validators/inventory";

export type SlotState = "free" | "mine" | "taken";

export type DeskAvailability = {
  id: string;
  label: string;
  attributes: DeskAttributes;
  slots: Record<SlotKey, SlotState>;
};

export type FloorAvailability = {
  id: string;
  name: string;
  desks: DeskAvailability[];
};

export type AvailabilitySnapshot = {
  floors: FloorAvailability[];
  mineForDate: { deskLabel: string; slot: SlotKey } | null;
};

/**
 * Build an availability snapshot for a given office-tz date. For each active
 * desk we classify all three slots as `free`, `mine`, or `taken` based on
 * the confirmed bookings overlapping that slot's UTC window.
 */
export async function getAvailability(
  date: string,
  viewerId: string | undefined
): Promise<AvailabilitySnapshot> {
  const { startAt: dayStart } = slotToUtcRange(date, "all-day");
  const { endAt: dayEnd } = slotToUtcRange(date, "all-day");

  const [floors, bookings] = await Promise.all([
    prisma.floor.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      include: {
        desks: {
          where: { active: true },
          orderBy: { label: "asc" },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: "confirmed",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: {
        id: true,
        deskId: true,
        userId: true,
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  // Group bookings by desk for O(d) lookup.
  const bookingsByDesk = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const arr = bookingsByDesk.get(b.deskId) ?? [];
    arr.push(b);
    bookingsByDesk.set(b.deskId, arr);
  }

  const result: FloorAvailability[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    desks: floor.desks.map((desk) => {
      const deskBookings = bookingsByDesk.get(desk.id) ?? [];
      const slots = emptySlotMap();
      for (const slot of SLOT_KEYS) {
        const { startAt, endAt } = slotToUtcRange(date, slot);
        const overlap = deskBookings.find((b) => b.startAt < endAt && b.endAt > startAt);
        if (!overlap) {
          slots[slot] = "free";
        } else if (viewerId && overlap.userId === viewerId) {
          slots[slot] = "mine";
        } else {
          slots[slot] = "taken";
        }
      }
      return {
        id: desk.id,
        label: desk.label,
        attributes: DeskAttributesSchema.catch({} as DeskAttributes).parse(desk.attributes ?? {}),
        slots,
      };
    }),
  }));

  // Find the viewer's own confirmed booking for this date (if any) —
  // used to enforce and display the "one booking per user per date" rule.
  let mine: AvailabilitySnapshot["mineForDate"] = null;
  if (viewerId) {
    const own = bookings.find((b) => b.userId === viewerId);
    if (own) {
      const desk = floors.flatMap((f) => f.desks).find((d) => d.id === own.deskId);
      if (desk) {
        mine = { deskLabel: desk.label, slot: classifySlot(own.startAt, own.endAt) };
      }
    }
  }

  return { floors: result, mineForDate: mine };
}

function emptySlotMap(): Record<SlotKey, SlotState> {
  return { morning: "free", afternoon: "free", "all-day": "free" };
}
