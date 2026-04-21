import Link from "next/link";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { DateNav } from "@/components/book/date-nav";
import { SlotTabs } from "@/components/book/slot-tabs";
import { DeskCard } from "@/components/book/desk-card";

import {
  BOOKING_WINDOW_DAYS,
  OFFICE_TZ,
  SLOT_KEYS,
  SLOT_LABELS,
  type SlotKey,
  formatInOfficeTz,
  isWithinBookingWindow,
  shiftDate,
  slotToUtcRange,
  todayInOfficeTz,
} from "@/lib/booking/slots";
import { getAvailability } from "@/lib/booking/availability";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; slot?: string }>;
}) {
  const session = await auth();
  const viewerId = session?.user?.id;

  const sp = await searchParams;
  const today = todayInOfficeTz();
  const max = shiftDate(today, BOOKING_WINDOW_DAYS);
  const date = sp.date && isWithinBookingWindow(sp.date) ? sp.date : today;
  const slot: SlotKey = (SLOT_KEYS as readonly string[]).includes(sp.slot ?? "")
    ? (sp.slot as SlotKey)
    : "all-day";

  const snapshot = await getAvailability(date, viewerId);
  const { startAt } = slotToUtcRange(date, slot);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              y_deskbooking
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/book" className="font-medium text-foreground">
                Book
              </Link>
              <Link href="/my-bookings" className="text-muted-foreground hover:text-foreground">
                My bookings
              </Link>
              {session?.user?.role === "admin" ? (
                <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.user.email}
                </span>
                <SignOutButton />
              </>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Book a desk</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatInOfficeTz(startAt, "EEEE, d MMM yyyy")} · {OFFICE_TZ}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateNav current={date} min={today} max={max} />
            <SlotTabs current={slot} />
          </div>
        </div>

        {snapshot.mineForDate ? (
          <div className="mb-6 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
            <strong>You already have a booking for this date.</strong>{" "}
            Desk {snapshot.mineForDate.deskLabel} · {SLOT_LABELS[snapshot.mineForDate.slot].toLowerCase()}. Cancel it
            from <Link href="/my-bookings" className="underline">my bookings</Link> to pick a different desk or slot.
          </div>
        ) : null}

        {snapshot.floors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No desks yet. An admin still needs to set up floors and desks.
          </div>
        ) : (
          snapshot.floors.map((floor) => (
            <section key={floor.id} className="mb-10">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {floor.name}
              </h2>
              {floor.desks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active desks on this floor.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {floor.desks.map((desk) => (
                    <DeskCard
                      key={desk.id}
                      desk={desk}
                      date={date}
                      selectedSlot={slot}
                      dayLockedByMine={snapshot.mineForDate !== null && desk.slots[slot] !== "mine"}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}

        <div className="mt-12 flex gap-3 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href="/my-bookings">View my bookings &rarr;</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
