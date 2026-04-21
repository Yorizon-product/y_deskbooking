import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodayHero, type TodayHeroBooking } from "@/components/my-bookings/today-hero";

import {
  SLOT_LABELS,
  classifySlot,
  formatInOfficeTz,
  isPast,
  slotToUtcRange,
  todayInOfficeTz,
} from "@/lib/booking/slots";
import {
  DeskAttributesSchema,
  type DeskAttributes,
} from "@/lib/validators/inventory";
import type { FloorPlanDesk } from "@/components/book/floor-plan-svg";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/my-bookings");

  const today = todayInOfficeTz();
  const { startAt: dayStart, endAt: dayEnd } = slotToUtcRange(today, "all-day");

  const [bookings, todaysForFloor] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { desk: { include: { floor: true } } },
      orderBy: { startAt: "desc" },
    }),
    // Pull the full list of active desks per floor up front — we'll pick the
    // floor that today's confirmed booking is on.
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
  ]);

  const now = new Date();
  const todayConfirmed = bookings.find(
    (b) =>
      b.status === "confirmed" &&
      b.startAt < dayEnd &&
      b.endAt > dayStart &&
      !isPast(b.startAt, now)
  );

  // If there's a confirmed booking for today, compute per-desk taken state
  // against the rest of today's bookings so the swap-sheet can disable the
  // taken desks.
  let heroBooking: TodayHeroBooking | null = null;
  let floorDesks: Array<FloorPlanDesk & { attributes: DeskAttributes }> = [];

  if (todayConfirmed) {
    const floor = todaysForFloor.find((f) => f.id === todayConfirmed.desk.floorId);
    const allTodayBookings = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { deskId: true, startAt: true, endAt: true },
    });
    const slot = classifySlot(todayConfirmed.startAt, todayConfirmed.endAt);
    const { startAt: slotStart, endAt: slotEnd } = slotToUtcRange(today, slot);

    if (floor) {
      floorDesks = floor.desks.map((d) => {
        const taken = allTodayBookings.some(
          (b) =>
            b.deskId === d.id && b.startAt < slotEnd && b.endAt > slotStart
        );
        return {
          id: d.id,
          label: d.label,
          taken,
          attributes: DeskAttributesSchema.catch({} as DeskAttributes).parse(
            d.attributes ?? {}
          ),
        };
      });
    }

    heroBooking = {
      id: todayConfirmed.id,
      deskId: todayConfirmed.deskId,
      deskLabel: todayConfirmed.desk.label,
      floorName: todayConfirmed.desk.floor.name,
      startLabel: `${formatInOfficeTz(todayConfirmed.startAt, "HH:mm")} — ${formatInOfficeTz(
        todayConfirmed.endAt,
        "HH:mm"
      )}`,
      dateLabel: formatInOfficeTz(todayConfirmed.startAt, "EEE d MMM"),
      slotLabel: SLOT_LABELS[slot],
      attributes: DeskAttributesSchema.catch({} as DeskAttributes).parse(
        todayConfirmed.desk.attributes ?? {}
      ),
    };
  }

  const upcomingOtherDays = bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      !isPast(b.startAt, now) &&
      b.id !== todayConfirmed?.id
  );
  const history = bookings.filter(
    (b) => !(b.status === "confirmed" && !isPast(b.startAt, now))
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="font-mono text-[13px] font-medium tracking-tight text-foreground"
            >
              y_deskbooking
            </Link>
            <span className="font-mono text-[11px] text-muted-foreground">/ my bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/book"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Book
            </Link>
            {session.user.role === "admin" ? (
              <Link
                href="/admin"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
              >
                Admin
              </Link>
            ) : null}
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {heroBooking ? (
        <TodayHero booking={heroBooking} floorDesks={floorDesks} />
      ) : (
        <NoBookingToday />
      )}

      <div className="mx-auto max-w-md px-5 pb-10 pt-8">
        {upcomingOtherDays.length > 0 ? (
          <>
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Upcoming
            </h2>
            <div className="space-y-2">
              {upcomingOtherDays.map((b) => (
                <BookingCard
                  key={b.id}
                  title={`Desk ${b.desk.label}`}
                  floor={b.desk.floor.name}
                  startAt={b.startAt}
                  endAt={b.endAt}
                />
              ))}
            </div>
            <Separator className="my-8" />
          </>
        ) : null}

        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground hover:text-foreground">
            <span>History</span>
            <span className="text-foreground/40 group-open:hidden">Show</span>
            <span className="hidden text-foreground/40 group-open:inline">Hide</span>
          </summary>
          <div className="mt-3 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              history.slice(0, 20).map((b) => (
                <BookingCard
                  key={b.id}
                  title={`Desk ${b.desk.label}`}
                  floor={b.desk.floor.name}
                  startAt={b.startAt}
                  endAt={b.endAt}
                  cancelled={b.status === "cancelled"}
                />
              ))
            )}
          </div>
        </details>

        <div className="mt-10">
          <Button asChild className="w-full" size="lg">
            <Link href="/book">Book another desk</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoBookingToday() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3.5 px-6 pb-2 pt-16 text-center">
      <p className="font-mono text-[10.5px] uppercase tracking-[1px] text-muted-foreground">
        Today
      </p>
      <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
        No booking yet
      </h1>
      <p className="max-w-[260px] text-[15px] leading-snug text-muted-foreground">
        Pick a desk in the floor grid. It takes about ten seconds.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/book">Book a desk</Link>
      </Button>
    </section>
  );
}

function BookingCard({
  title,
  floor,
  startAt,
  endAt,
  cancelled,
}: {
  title: string;
  floor: string;
  startAt: Date;
  endAt: Date;
  cancelled?: boolean;
}) {
  const slot = classifySlot(startAt, endAt);
  const dateLabel = formatInOfficeTz(startAt, "EEE d MMM yyyy");
  const timeLabel = `${formatInOfficeTz(startAt, "HH:mm")}–${formatInOfficeTz(endAt, "HH:mm")}`;
  return (
    <Card className="py-3">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[14px]">
              {title} <span className="text-muted-foreground">· {floor}</span>
            </CardTitle>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {dateLabel} · {timeLabel} · {SLOT_LABELS[slot]}
            </p>
          </div>
          {cancelled ? <Badge variant="muted">Cancelled</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="hidden" />
    </Card>
  );
}
