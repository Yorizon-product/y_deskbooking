"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SLOT_KEYS, SLOT_LABELS, type SlotKey } from "@/lib/booking/slots";
import { cn } from "@/lib/utils";

export function SlotTabs({ current }: { current: SlotKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pick = (slot: SlotKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("slot", slot);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted p-1">
      {SLOT_KEYS.map((slot) => (
        <Button
          key={slot}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8",
            current === slot
              ? "bg-background shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => pick(slot)}
          aria-pressed={current === slot}
        >
          {SLOT_LABELS[slot]}
        </Button>
      ))}
    </div>
  );
}
