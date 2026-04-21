"use client";

import * as React from "react";
import { Crosshair } from "lucide-react";

import { FloorPlanSVG, type FloorPlanDesk } from "@/components/book/floor-plan-svg";
import { deskCoords } from "@/lib/booking/layout";

type Props = {
  desks: FloorPlanDesk[];
  myDeskId: string;
  className?: string;
  /**
   * Height of the viewport. The SVG is scaled 1.6× so there's always room to pan.
   * Defaults to 300 — same as the design source.
   */
  height?: number;
};

/**
 * Fixed-size viewport into the floor plan. Blueprint is rendered larger than
 * the viewport so the user can drag to pan; pinch-to-zoom scales 1×–3×.
 * Initially centred on the user's desk.
 */
export function PannableFloorPlan({ desks, myDeskId, className, height = 300 }: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const stateRef = React.useRef({ x: 0, y: 0, s: 1.6, initialized: false });

  const apply = React.useCallback(() => {
    const { x, y, s } = stateRef.current;
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
    }
  }, []);

  const center = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const { x: dx, y: dy } = deskCoords(desks.find((d) => d.id === myDeskId)?.label ?? "");
    const s = stateRef.current.s;
    stateRef.current.x = r.width / 2 - (dx / 1000) * r.width * s;
    stateRef.current.y = r.height / 2 - (dy / 600) * r.height * s;
    const minX = r.width - r.width * s;
    const minY = r.height - r.height * s;
    stateRef.current.x = Math.min(0, Math.max(minX, stateRef.current.x));
    stateRef.current.y = Math.min(0, Math.max(minY, stateRef.current.y));
    apply();
  }, [desks, myDeskId, apply]);

  // Initial centering.
  React.useLayoutEffect(() => {
    if (stateRef.current.initialized) return;
    center();
    stateRef.current.initialized = true;
  }, [center]);

  // Pan + pinch handlers.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let drag: { x: number; y: number } | null = null;
    let pinch: { d: number; s0: number } | null = null;

    const clamp = () => {
      const r = el.getBoundingClientRect();
      const s = stateRef.current.s;
      const minX = r.width - r.width * s;
      const minY = r.height - r.height * s;
      stateRef.current.x = Math.min(0, Math.max(minX, stateRef.current.x));
      stateRef.current.y = Math.min(0, Math.max(minY, stateRef.current.y));
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        pinch = {
          d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          s0: stateRef.current.s,
        };
        drag = null;
      } else {
        const p = "touches" in e ? e.touches[0] : e;
        drag = { x: p.clientX, y: p.clientY };
      }
      e.preventDefault();
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (pinch && "touches" in e && e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        stateRef.current.s = Math.min(3, Math.max(1, pinch.s0 * (d / pinch.d)));
        clamp();
        apply();
        e.preventDefault();
      } else if (drag) {
        const p = "touches" in e ? e.touches[0] : e;
        stateRef.current.x += p.clientX - drag.x;
        stateRef.current.y += p.clientY - drag.y;
        drag.x = p.clientX;
        drag.y = p.clientY;
        clamp();
        apply();
        e.preventDefault();
      }
    };

    const onUp = () => {
      drag = null;
      pinch = null;
    };

    el.addEventListener("mousedown", onDown as EventListener);
    el.addEventListener("touchstart", onDown as EventListener, { passive: false });
    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("touchmove", onMove as EventListener, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown as EventListener);
      el.removeEventListener("touchstart", onDown as EventListener);
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [apply]);

  const recenter = () => {
    if (!innerRef.current) return;
    innerRef.current.style.transition = "transform .3s cubic-bezier(.2,.7,.3,1)";
    center();
    setTimeout(() => {
      if (innerRef.current) innerRef.current.style.transition = "";
    }, 320);
  };

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-label="Office floor plan — drag to pan"
      className={`relative overflow-hidden rounded-md border border-border bg-muted/50 ${
        className ?? ""
      }`}
      style={{ height, touchAction: "none", cursor: "grab", userSelect: "none" }}
    >
      <div
        ref={innerRef}
        className="absolute inset-0"
        style={{ transformOrigin: "0 0", willChange: "transform" }}
      >
        <FloorPlanSVG desks={desks} myDeskId={myDeskId} showLabels showAreaLabels />
      </div>

      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter on your desk"
        className="absolute bottom-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 text-primary shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <Crosshair className="h-3.5 w-3.5" />
      </button>

      <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-background/70 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        Drag to pan
      </div>
    </div>
  );
}
