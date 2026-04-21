"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { createBooking } from "@/app/book/actions";
import { SLOT_KEYS, SLOT_LABELS, type SlotKey } from "@/lib/booking/slots";
import type { DeskAvailability, SlotState } from "@/lib/booking/availability";

export function DeskCard({
  desk,
  date,
  selectedSlot,
  dayLockedByMine,
}: {
  desk: DeskAvailability;
  date: string;
  selectedSlot: SlotKey;
  dayLockedByMine: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const selectedState = desk.slots[selectedSlot];
  const canBook = selectedState === "free" && !dayLockedByMine;

  async function book() {
    setPending(true);
    const result = await createBooking({ deskId: desk.id, date, slot: selectedSlot });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Booked ${desk.label} for ${SLOT_LABELS[selectedSlot].toLowerCase()}`);
    router.refresh();
  }

  return (
    <Card
      className={cn(
        "transition-colors",
        selectedState === "mine" && "border-primary",
        selectedState === "taken" && "opacity-70"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">Desk {desk.label}</CardTitle>
          {selectedState === "mine" ? <Badge>Mine</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {desk.attributes.monitor ? <Badge variant="secondary">Monitor</Badge> : null}
          {desk.attributes.standing ? <Badge variant="secondary">Standing</Badge> : null}
          {desk.attributes.accessible ? <Badge variant="secondary">Accessible</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-3 gap-1 text-xs">
          {SLOT_KEYS.map((slot) => (
            <div
              key={slot}
              className={cn(
                "flex flex-col items-start gap-1 rounded-md border border-border px-2 py-1.5",
                slot === selectedSlot && "border-foreground/40 bg-muted/60"
              )}
            >
              <dt className="font-medium text-muted-foreground">{SLOT_LABELS[slot]}</dt>
              <dd>
                <SlotDot state={desk.slots[slot]} />
              </dd>
            </div>
          ))}
        </dl>
        <Button
          size="sm"
          className="w-full"
          onClick={book}
          disabled={!canBook || pending}
          aria-label={`Book ${desk.label} for ${SLOT_LABELS[selectedSlot]}`}
        >
          {selectedState === "mine"
            ? "Your booking"
            : selectedState === "taken"
              ? "Taken"
              : dayLockedByMine
                ? "Already booked today"
                : pending
                  ? "Booking…"
                  : `Book ${SLOT_LABELS[selectedSlot].toLowerCase()}`}
        </Button>
      </CardContent>
    </Card>
  );
}

function SlotDot({ state }: { state: SlotState }) {
  if (state === "mine") {
    return (
      <span className="inline-flex items-center gap-1 text-primary">
        <Check className="h-3 w-3" /> Mine
      </span>
    );
  }
  if (state === "taken") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Circle className="h-2.5 w-2.5 fill-muted-foreground" /> Taken
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-foreground">
      <Circle className="h-2.5 w-2.5 fill-accent" /> Free
    </span>
  );
}
