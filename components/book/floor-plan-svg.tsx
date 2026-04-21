"use client";

import * as React from "react";
import { VIEW_H, VIEW_W, deskCoords } from "@/lib/booking/layout";

export type FloorPlanDesk = {
  id: string;
  label: string;
  taken: boolean;
};

type Props = {
  desks: FloorPlanDesk[];
  myDeskId?: string | null;
  selectedId?: string | null;
  onSelect?: (deskId: string) => void;
  showLabels?: boolean;
  showAreaLabels?: boolean;
};

/**
 * Stateless top-down office view. All geometry is in a 1000×600 viewBox.
 * Desks are rendered at coordinates synthesised from their label.
 *
 * Colors intentionally use the Yorizon CSS tokens so the plan matches the
 * rest of the app in both light and dark modes — no per-mode branching here.
 */
export function FloorPlanSVG({
  desks,
  myDeskId = null,
  selectedId = null,
  onSelect,
  showLabels = true,
  showAreaLabels = true,
}: Props) {
  const interactive = !!onSelect;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full select-none"
      aria-hidden={!interactive}
    >
      {/* outer walls */}
      <rect
        x="40"
        y="40"
        width="920"
        height="520"
        rx="4"
        className="fill-muted stroke-border"
        strokeWidth={2}
      />

      {/* east wing divider with a door gap between y=220 and y=300 */}
      <line x1="600" y1="40" x2="600" y2="220" className="stroke-border" strokeWidth={2} />
      <line x1="600" y1="300" x2="600" y2="560" className="stroke-border" strokeWidth={2} />

      {/* north window band */}
      <rect x="40" y="40" width="560" height="16" className="fill-accent/40" />
      {/* kitchen (east wing, top) */}
      <rect x="600" y="40" width="360" height="80" className="fill-muted-foreground/10" />

      {showAreaLabels ? (
        <g className="fill-muted-foreground/70 font-mono" fontSize={12} letterSpacing={1.5}>
          <text x="60" y="78">WINDOW · QUIET</text>
          <text x="60" y="210">OPEN POD</text>
          <text x="60" y="395">FOCUS BOOTHS</text>
          <text x="620" y="70">KITCHEN</text>
          <text x="620" y="140">SOCIAL ROW</text>
        </g>
      ) : null}

      {desks.map((d) => {
        const { x, y } = deskCoords(d.label);
        const isMe = !!myDeskId && d.id === myDeskId;
        const isSel = !!selectedId && d.id === selectedId;
        const canSelect = interactive && !d.taken && !isMe;

        return (
          <g
            key={d.id}
            onClick={canSelect ? () => onSelect?.(d.id) : undefined}
            style={{ cursor: canSelect ? "pointer" : "default" }}
          >
            {/* desk surface */}
            <rect
              x={x - 18}
              y={y - 12}
              width={36}
              height={24}
              rx={2.5}
              className={
                d.taken
                  ? "fill-muted-foreground/10 stroke-muted-foreground/30"
                  : "fill-card stroke-border"
              }
              strokeWidth={isSel ? 2.5 : 1}
              style={isSel ? { stroke: "var(--primary)" } : undefined}
            />
            {/* chair indicator */}
            <circle
              cx={x}
              cy={y + 22}
              r={5}
              className={
                d.taken
                  ? "fill-muted-foreground/10 stroke-muted-foreground/30"
                  : "fill-card stroke-border"
              }
              strokeWidth={1}
            />
            {/* my-desk crown */}
            {isMe ? (
              <g>
                <circle cx={x} cy={y} r={14} fill="none" stroke="var(--primary)" strokeWidth={2} />
                <circle
                  cx={x}
                  cy={y}
                  r={20}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={1}
                  opacity={0.3}
                />
              </g>
            ) : null}
            {/* selected (swap) ring */}
            {isSel && !isMe ? (
              <circle
                cx={x}
                cy={y}
                r={18}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            ) : null}
            {/* label */}
            {showLabels ? (
              <text
                x={x}
                y={y + 40}
                textAnchor="middle"
                className="fill-muted-foreground/70 font-mono"
                fontSize={9}
              >
                {d.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
