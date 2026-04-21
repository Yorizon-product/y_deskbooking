"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DateNav({
  current,
  min,
  max,
}: {
  current: string;
  min: string;
  max: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setDate = React.useCallback(
    (next: string) => {
      if (next < min || next > max) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", next);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, min, max]
  );

  const shift = (days: number) => {
    const [y, m, d] = current.split("-").map(Number);
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + days);
    setDate(base.toISOString().slice(0, 10));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        aria-label="Previous day"
        onClick={() => shift(-1)}
        disabled={current <= min}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Input
        type="date"
        value={current}
        min={min}
        max={max}
        onChange={(e) => {
          if (e.target.value) setDate(e.target.value);
        }}
        className="h-10 w-auto"
      />
      <Button
        size="icon"
        variant="outline"
        aria-label="Next day"
        onClick={() => shift(1)}
        disabled={current >= max}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
