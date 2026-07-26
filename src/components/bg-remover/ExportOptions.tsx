"use client";

import { CANVAS_PRESETS } from "@/lib/bg-remover/canvas";
import type { CanvasSize } from "@/lib/bg-remover/types";

type Props = {
  open: boolean;
  onToggle: () => void;
  previewUrl: string;
  bgColor: string;
  canvasSize: CanvasSize;
  exportingSolid: boolean;
  onBgColorChange: (hex: string) => void;
  onCanvasSizeChange: (size: CanvasSize) => void;
  onExport: () => void;
};

const SWATCH_ON = "border-emerald-500 bg-white ring-1 ring-emerald-500/30";
const SWATCH_OFF = "border-black/10 bg-white";

/** Solid background colour + product canvas size, with a live preview. */
export default function ExportOptions({
  open,
  onToggle,
  previewUrl,
  bgColor,
  canvasSize,
  exportingSolid,
  onBgColorChange,
  onCanvasSizeChange,
  onExport,
}: Props) {
  const isWhite = bgColor.toUpperCase() === "#FFFFFF";
  const isBlack = bgColor.toUpperCase() === "#000000";

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
        >
          {open ? "Hide export options" : "More colors & canvas sizes ▾"}
        </button>
      </div>

      {open && (
        <div className="mx-auto w-full max-w-lg space-y-3 rounded-2xl border border-black/8 bg-stone-50 px-4 py-4">
          {/* Live solid preview */}
          <div className="overflow-hidden rounded-xl border border-black/8">
            <div
              className="flex max-h-48 min-h-[120px] items-center justify-center p-4"
              style={{ backgroundColor: bgColor }}
            >
              <img
                src={previewUrl}
                alt="Solid background preview"
                className="max-h-40 max-w-full object-contain"
                draggable={false}
              />
            </div>
            <p className="border-t border-black/6 bg-white px-3 py-1.5 text-center text-[11px] text-neutral-500">
              Preview · export canvas:{" "}
              {canvasSize === "original"
                ? "same as source"
                : `${canvasSize}×${canvasSize}px (subject ~85%)`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onBgColorChange("#FFFFFF")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                isWhite ? SWATCH_ON : SWATCH_OFF
              }`}
            >
              <span className="h-4 w-4 rounded border border-black/15 bg-white" />
              White
            </button>
            <button
              type="button"
              onClick={() => onBgColorChange("#000000")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                isBlack ? SWATCH_ON : SWATCH_OFF
              }`}
            >
              <span className="h-4 w-4 rounded border border-black/15 bg-black" />
              Black
            </button>
            <label className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-neutral-800">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              Custom
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="w-full text-center text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Canvas size
            </span>
            {CANVAS_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onCanvasSizeChange(p.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  canvasSize === p.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-black/10 bg-white text-neutral-800 hover:bg-stone-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onExport}
              disabled={exportingSolid}
              className="rounded-lg bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {exportingSolid ? "Exporting…" : "Export solid JPG"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
