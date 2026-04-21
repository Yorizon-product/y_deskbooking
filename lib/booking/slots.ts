import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime, format as tzFormat } from "date-fns-tz";

import type { Slot } from "@prisma/client";

export const OFFICE_TZ = process.env.OFFICE_TZ || "Europe/Berlin";

/** Max days ahead a user can book (today is day 0). */
export const BOOKING_WINDOW_DAYS = 60;

export type SlotKey = "morning" | "afternoon" | "all-day";

export const SLOT_KEYS: SlotKey[] = ["morning", "afternoon", "all-day"];

/** Hours in the office timezone. endHour is exclusive, like a half-open range. */
const SLOT_HOURS: Record<SlotKey, { startHour: number; endHour: number }> = {
  morning: { startHour: 8, endHour: 12 },
  afternoon: { startHour: 12, endHour: 18 },
  "all-day": { startHour: 8, endHour: 18 },
};

export const SLOT_LABELS: Record<SlotKey, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  "all-day": "All day",
};

/** Convert a UI slot key to the Prisma enum. */
export function slotKeyToDb(slot: SlotKey): Slot {
  return (slot === "all-day" ? "all_day" : slot) as Slot;
}

/** Convert a Prisma enum back to the UI slot key. */
export function dbSlotToKey(slot: Slot): SlotKey {
  return (slot === "all_day" ? "all-day" : slot) as SlotKey;
}

/** Today in the office timezone as a `YYYY-MM-DD` string. */
export function todayInOfficeTz(now = new Date()): string {
  return tzFormat(toZonedTime(now, OFFICE_TZ), "yyyy-MM-dd", { timeZone: OFFICE_TZ });
}

/** Add N days to a `YYYY-MM-DD` string, treating it as a wall-clock date. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const shifted = addDays(base, days);
  return shifted.toISOString().slice(0, 10);
}

/** Is this date within [today, today + BOOKING_WINDOW_DAYS] in office tz? */
export function isWithinBookingWindow(date: string, now = new Date()): boolean {
  const today = todayInOfficeTz(now);
  const [ty, tm, td] = today.split("-").map(Number);
  const [dy, dm, dd] = date.split("-").map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const dateMs = Date.UTC(dy, dm - 1, dd);
  const diff = differenceInCalendarDays(new Date(dateMs), new Date(todayMs));
  return diff >= 0 && diff <= BOOKING_WINDOW_DAYS;
}

/**
 * Convert a (date, slot) in the office timezone to UTC instants for
 * storage. Returns { startAt, endAt } where the range is half-open
 * [startAt, endAt).
 */
export function slotToUtcRange(date: string, slot: SlotKey): { startAt: Date; endAt: Date } {
  const { startHour, endHour } = SLOT_HOURS[slot];
  const startLocal = `${date}T${pad(startHour)}:00:00`;
  const endLocal = `${date}T${pad(endHour)}:00:00`;
  return {
    startAt: fromZonedTime(startLocal, OFFICE_TZ),
    endAt: fromZonedTime(endLocal, OFFICE_TZ),
  };
}

/**
 * Given a UTC instant, return the office-local date string `YYYY-MM-DD`.
 * Used for the "one booking per user per date" rule (app-level enforcement).
 */
export function utcToLocalDate(utc: Date): string {
  return tzFormat(toZonedTime(utc, OFFICE_TZ), "yyyy-MM-dd", { timeZone: OFFICE_TZ });
}

/** Render a UTC instant in the office timezone. */
export function formatInOfficeTz(utc: Date, pattern = "EEE dd MMM, HH:mm"): string {
  return tzFormat(toZonedTime(utc, OFFICE_TZ), pattern, { timeZone: OFFICE_TZ });
}

/**
 * Which slot does a stored (startAt, endAt) correspond to? We lean on the
 * office-tz hour of startAt — the three slot windows have distinct start hours.
 */
export function classifySlot(startAt: Date, endAt: Date): SlotKey {
  const startHour = Number(tzFormat(toZonedTime(startAt, OFFICE_TZ), "H", { timeZone: OFFICE_TZ }));
  const endHour = Number(tzFormat(toZonedTime(endAt, OFFICE_TZ), "H", { timeZone: OFFICE_TZ }));
  if (startHour === 8 && endHour === 18) return "all-day";
  if (startHour === 8) return "morning";
  return "afternoon";
}

/** Is this booking's start in the past relative to `now` (office tz)? */
export function isPast(startAt: Date, now = new Date()): boolean {
  return startAt.getTime() <= now.getTime();
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Round-trip guard for `startOfDay` — exported for tests to import. */
export const __internal = { startOfDay };
