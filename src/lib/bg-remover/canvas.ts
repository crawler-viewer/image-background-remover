/**
 * Canvas / filename rules for solid-background exports.
 *
 * Pure — no DOM. The browser-only compositing lives in `export-image.ts`.
 */
import type { CanvasSize } from "./types";

export const CANVAS_PRESETS: Array<{ id: CanvasSize; label: string; edge: number | null }> = [
  { id: "original", label: "Original", edge: null },
  { id: "1000", label: "1000²", edge: 1000 },
  { id: "1600", label: "1600²", edge: 1600 },
  { id: "2000", label: "2000²", edge: 2000 },
];

/** Square canvases place the subject at ~85% of the edge (Amazon-style). */
export const SUBJECT_FILL_RATIO = 0.85;

/** Default square edge for marketplace white exports when the user kept "original". */
export const DEFAULT_WHITE_EXPORT_SIZE: CanvasSize = "2000";

export function canvasEdge(size: CanvasSize): number | null {
  return CANVAS_PRESETS.find((p) => p.id === size)?.edge ?? null;
}

/**
 * White/marketplace exports need a square canvas, so "original" is upgraded to
 * 2000². An explicit 1000/1600/2000 choice is always honored.
 */
export function resolveWhiteExportSize(size: CanvasSize): CanvasSize {
  return size === "original" ? DEFAULT_WHITE_EXPORT_SIZE : size;
}

export function sizeSlug(size: CanvasSize): string {
  return size === "original" ? "orig" : size;
}

function colorSlug(hex: string): string {
  return hex.replace("#", "").toLowerCase() || "custom";
}

/** Filename slug for a solid background: white / black / raw hex digits. */
export function solidColorSlug(hex: string): string {
  const upper = hex.toUpperCase();
  if (upper === "#FFFFFF") return "white";
  if (upper === "#000000") return "black";
  return colorSlug(hex);
}

/** Human label for a solid background (UI copy, keeps the `#` for custom). */
export function solidColorLabel(hex: string): string {
  const upper = hex.toUpperCase();
  if (upper === "#FFFFFF") return "white";
  if (upper === "#000000") return "black";
  return hex;
}

/** Accepts `2000`, `2000x2000`, `orig`, … from a deep link. */
export function parseCanvasSizeParam(raw: string | null): CanvasSize | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "original" || v === "orig") return "original";
  if (v === "1000" || v === "1000x1000") return "1000";
  if (v === "1600" || v === "1600x1600") return "1600";
  if (v === "2000" || v === "2000x2000") return "2000";
  return null;
}
