"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FloorPlanSVG, type FloorPlanDesk } from "@/components/book/floor-plan-svg";
import { swapBooking } from "@/app/book/actions";
import type { DeskAttributes } from "@/lib/validators/inventory";

type SwapTarget = FloorPlanDesk & {
  attributes: DeskAttributes;
};

type Props = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  myDeskLabel: string;
  desks: SwapTarget[];
};

export function SwapSeatSheet({ open, onClose, bookingId, myDeskLabel, desks }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // Reset state on close so re-open is clean.
  React.useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  // Escape closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const myDeskId = desks.find((d) => d.label === myDeskLabel)?.id ?? null;
  const selected = desks.find((d) => d.id === selectedId) ?? null;

  async function confirm() {
    if (!selected) return;
    setPending(true);
    const result = await swapBooking({ fromId: bookingId, toDeskId: selected.id });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Moved to desk ${selected.label}`);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pb-2 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 gap-1 px-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>

      <div className="px-5 pb-2">
        <h2 className="text-[22px] font-semibold leading-tight tracking-tight">Swap seat</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Currently at {myDeskLabel} · pick another
        </p>
      </div>

      <div className="min-h-0 flex-1 px-3 pb-3">
        <div className="relative h-full overflow-hidden rounded-lg border border-border bg-muted/40">
          <FloorPlanSVG
            desks={desks}
            myDeskId={myDeskId}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            showLabels
            showAreaLabels
          />
        </div>
      </div>

      {selected ? (
        <div className="animate-in slide-in-from-bottom-4 duration-200 rounded-t-2xl border-t border-border bg-card p-5 shadow-xl">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" />
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {myDeskLabel} &rarr; {selected.label}
              </div>
              <div className="mt-1 text-[17px] font-semibold leading-none tracking-tight">
                {selected.attributes.monitor
                  ? selected.attributes.standing
                    ? "Monitor · standing"
                    : "Monitor desk"
                  : selected.attributes.accessible
                    ? "Accessible desk"
                    : "Open desk"}
              </div>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {selected.attributes.monitor ? <Badge variant="secondary">Monitor</Badge> : null}
            {selected.attributes.standing ? <Badge variant="secondary">Standing</Badge> : null}
            {selected.attributes.accessible ? <Badge variant="secondary">Accessible</Badge> : null}
          </div>
          <Button className="w-full" size="lg" onClick={confirm} disabled={pending}>
            {pending ? "Swapping…" : `Swap to ${selected.label}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
