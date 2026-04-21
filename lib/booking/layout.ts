/**
 * Spatial layout for rendering a floor plan.
 *
 * Our Desk model doesn't store x/y coordinates — we synthesise them from the
 * label. Labels follow `<rowNumber>-<columnLetter>` (e.g. "1-A", "2-C", "3-B").
 *
 * Rows map to y-bands that mirror the design source — north window, middle
 * pod, south booths — so the floor plan reads as a real office, not a grid.
 * Columns (A..F) map to x-positions within a 1000×600 viewBox that matches
 * the design's coordinate space.
 *
 * Desks whose labels don't match the scheme are placed at the origin; if this
 * shows up in the UI, add a column/row to the maps below.
 */

export const VIEW_W = 1000;
export const VIEW_H = 600;

// Mirrors the design source (shared.jsx DESKS y-values).
const ROW_Y: Record<number, number> = {
  1: 80, // window row, north
  2: 240, // middle pod
  3: 420, // focus booths, south
  4: 500, // overflow row if an admin adds a 4-x desk
};

const COL_X: Record<string, number> = {
  A: 90,
  B: 190,
  C: 290,
  D: 390,
  E: 490,
  F: 590,
};

export type DeskCoords = { x: number; y: number };

export function deskCoords(label: string): DeskCoords {
  const m = /^(\d+)-([A-Z])$/.exec(label.trim());
  if (!m) return { x: 0, y: 0 };
  const row = Number(m[1]);
  const col = m[2];
  return { x: COL_X[col] ?? 0, y: ROW_Y[row] ?? 0 };
}

/** Is this floor's layout "known" for floor-plan rendering? */
export function hasKnownLayout(labels: string[]): boolean {
  return labels.every((l) => /^(\d+)-([A-Z])$/.test(l));
}
