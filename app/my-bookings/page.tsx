import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CancelBookingButton } from "@/components/my-bookings/cancel-button";

import {
  SLOT_LABELS,
  classifySlot,
  formatInOfficeTz,
  isPast,
} from "@/lib/booking/slots";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/my-bookings");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      desk: { include: { floor: true } },
    },
    orderBy: { startAt: "desc" },
  });

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && !isPast(b.startAt, now)
  );
  const past = bookings.filter(
    (b) => !(b.status === "confirmed" && !isPast(b.startAt, now))
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              y_deskbooking
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/book" className="text-muted-foreground hover:text-foreground">
                Book
              </Link>
              <Link href="/my-bookings" className="font-medium text-foreground">
                My bookings
              </Link>
              {session.user.role === "admin" ? (
                <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">My bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upcoming reservations + history.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                You don&apos;t have any upcoming bookings. {" "}
                <Link href="/book" className="text-foreground underline">Book a desk</Link>.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  id={b.id}
                  title={`Desk ${b.desk.label}`}
                  floor={b.desk.floor.name}
                  startAt={b.startAt}
                  endAt={b.endAt}
                  canCancel
                />
              ))}
            </div>
          )}
        </section>

        <Separator className="my-10" />

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Past &amp; cancelled
          </h2>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <div className="space-y-3">
              {past.slice(0, 50).map((b) => (
                <BookingCard
                  key={b.id}
                  id={b.id}
                  title={`Desk ${b.desk.label}`}
                  floor={b.desk.floor.name}
                  startAt={b.startAt}
                  endAt={b.endAt}
                  cancelled={b.status === "cancelled"}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-10">
          <Button asChild>
            <Link href="/book">Book another desk</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function BookingCard({
  id,
  title,
  floor,
  startAt,
  endAt,
  canCancel,
  cancelled,
}: {
  id: string;
  title: string;
  floor: string;
  startAt: Date;
  endAt: Date;
  canCancel?: boolean;
  cancelled?: boolean;
}) {
  const slot = classifySlot(startAt, endAt);
  const dateLabel = formatInOfficeTz(startAt, "EEEE, d MMM yyyy");
  const timeLabel = `${formatInOfficeTz(startAt, "HH:mm")}–${formatInOfficeTz(endAt, "HH:mm")}`;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {title} <span className="text-muted-foreground">· {floor}</span>
            </CardTitle>
            <CardDescription>
              {dateLabel} · {timeLabel} ({SLOT_LABELS[slot]})
            </CardDescription>
          </div>
          {cancelled ? <Badge variant="muted">Cancelled</Badge> : null}
          {canCancel ? <CancelBookingButton id={id} label={`${title} on ${dateLabel}`} /> : null}
        </div>
      </CardHeader>
    </Card>
  );
}
