/**
 * Browser-only image export helpers (canvas / object URLs).
 * The pure filename + canvas rules live in `canvas.ts`.
 */
import { SUBJECT_FILL_RATIO, canvasEdge } from "./canvas";
import type { CanvasSize } from "./types";

/**
 * Composite transparent PNG onto a solid background.
 * When edge is set, outputs a square canvas (marketplace-friendly) with the
 * subject centered and scaled to fill ~85% of the shorter side.
 */
export async function exportSolidBackgroundJpeg(
  pngUrl: string,
  fillStyle = "#FFFFFF",
  canvasSize: CanvasSize = "original",
  quality = 0.92
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load result image."));
    el.src = pngUrl;
  });

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const edge = canvasEdge(canvasSize);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  if (!edge) {
    canvas.width = srcW;
    canvas.height = srcH;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  } else {
    canvas.width = edge;
    canvas.height = edge;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, edge, edge);
    // Fill ~85% of the canvas while preserving aspect ratio (Amazon-style)
    const maxDim = edge * SUBJECT_FILL_RATIO;
    const scale = Math.min(maxDim / srcW, maxDim / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    const dx = (edge - dw) / 2;
    const dy = (edge - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to export solid-background JPEG.");
  return blob;
}

export async function fetchResultBlob(pngUrl: string): Promise<Blob> {
  const res = await fetch(pngUrl);
  if (!res.ok) throw new Error("Failed to read result image.");
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
