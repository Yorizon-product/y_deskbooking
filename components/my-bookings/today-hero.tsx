"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PannableFloorPlan } from "@/components/book/pannable-floor-plan";
import { SwapSeatSheet } from "@/components/my-bookings/swap-seat-sheet";
import { cancelBooking } from "@/app/book/actions";
import type { DeskAttributes } from "@/lib/validators/inventory";
import type { FloorPlanDesk } from "@/components/book/floor-plan-svg";

export type TodayHeroBooking = {
  id: string;
  deskId: string;
  deskLabel: string;
  floorName: string;
  startLabel: string; // e.g. "9:00 — 12:00"
  dateLabel: string; // e.g. "Tue 21 Apr"
  slotLabel: string; // e.g. "Morning"
  attributes: DeskAttributes;
};

type Props = {
  booking: TodayHeroBooking;
  floorDesks: Array<FloorPlanDesk & { attributes: DeskAttributes }>;
};

export function TodayHero({ booking, floorDesks }: Props) {
  const router = useRouter();
  const [swapOpen, setSwapOpen] = React.useState(false);
  const [releasing, setReleasing] = React.useState(false);

  async function release() {
    if (!confirm(`Release desk ${booking.deskLabel} for ${booking.dateLabel.toLowerCase()}?`)) return;
    setReleasing(true);
    const result = await cancelBooking({ id: booking.id });
    setReleasing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Desk released");
    router.refresh();
  }

  const area = booking.attributes.accessible
    ? "Accessible"
    : booking.attributes.standing
      ? "Standing"
      : booking.attributes.monitor
        ? "Monitor"
        : "Open";

  return (
    <>
      <section className="mx-auto w-full max-w-md px-4 pt-5">
        <div className="px-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[1px] text-muted-foreground">
            Today · {booking.dateLabel}
          </p>
          <h1 className="mt-0.5 text-[22px] font-semibold leading-tight tracking-tight">
            Your booking
          </h1>
        </div>

        <div className="mt-3 grid gap-3.5 rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                {area} · {booking.floorName}
              </p>
              <p className="mt-0.5 font-mono text-[28px] font-semibold leading-none tracking-tight">
                {booking.deskLabel}
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {booking.startLabel} · {booking.slotLabel}
              </p>
            </div>
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {booking.attributes.monitor ? <Badge variant="secondary">Monitor</Badge> : null}
            {booking.attributes.standing ? <Badge variant="secondary">Standing</Badge> : null}
            {booking.attributes.accessible ? <Badge variant="secondary">Accessible</Badge> : null}
            {!booking.attributes.monitor && !booking.attributes.standing && !booking.attributes.accessible ? (
              <Badge variant="secondary">Open desk</Badge>
            ) : null}
          </div>

          <PannableFloorPlan desks={floorDesks} myDeskId={booking.deskId} />
        </div>

        <div className="mt-3.5 grid gap-2 px-0">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={() => setSwapOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4" strokeWidth={1.8} />
            Swap seat
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground"
            onClick={release}
            disabled={releasing}
          >
            {releasing ? "Releasing…" : "Release"}
          </Button>
        </div>
      </section>

      <SwapSeatSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        bookingId={booking.id}
        myDeskLabel={booking.deskLabel}
        desks={floorDesks}
      />
    </>
  );
}
