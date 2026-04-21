import { z } from "zod";

export const SlotKeyEnum = z.enum(["morning", "afternoon", "all-day"]);

export const BookingCreateSchema = z.object({
  deskId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  slot: SlotKeyEnum,
});

export const BookingCancelSchema = z.object({
  id: z.string().min(1),
});

export const BookingSwapSchema = z.object({
  fromId: z.string().min(1),
  toDeskId: z.string().min(1),
});
