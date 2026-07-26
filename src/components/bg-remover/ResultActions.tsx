"use client";

import { resolveWhiteExportSize } from "@/lib/bg-remover/canvas";
import type { CanvasSize } from "@/lib/bg-remover/types";

type Props = {
  /** ?export=white deep link flips which button is primary */
  preferWhiteExport: boolean;
  exportingSolid: boolean;
  canvasSize: CanvasSize;
  copyState: "idle" | "ok" | "err";
  onDownloadPng: () => void;
  onDownloadWhiteJpeg: () => void;
  onCopyPng: () => void;
  onReset: () => void;
};

const PRIMARY = "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700";
const SECONDARY = "border border-black/10 bg-white text-neutral-900 hover:bg-stone-50";

export default function ResultActions({
  preferWhiteExport,
  exportingSolid,
  canvasSize,
  copyState,
  onDownloadPng,
  onDownloadWhiteJpeg,
  onCopyPng,
  onReset,
}: Props) {
  return (
    <>
      {/* Primary download CTAs — transparent PNG + marketplace white JPG */}
      <div className="mx-auto grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadPng}
          className={`inline-flex flex-col items-center justify-center rounded-2xl px-4 py-3.5 text-center transition-all ${
            preferWhiteExport ? SECONDARY : PRIMARY
          }`}
        >
          <span className="text-sm font-semibold">Transparent PNG</span>
          <span
            className={`mt-0.5 text-[11px] ${
              preferWhiteExport ? "text-neutral-500" : "text-emerald-100"
            }`}
          >
            Keep alpha · logos &amp; overlays
          </span>
        </button>
        <button
          type="button"
          onClick={onDownloadWhiteJpeg}
          disabled={exportingSolid}
          className={`inline-flex flex-col items-center justify-center rounded-2xl px-4 py-3.5 text-center transition-all disabled:opacity-70 ${
            preferWhiteExport ? PRIMARY : SECONDARY
          }`}
        >
          <span className="text-sm font-semibold">
            {exportingSolid ? "Exporting…" : "White background JPG"}
          </span>
          <span
            className={`mt-0.5 text-[11px] ${
              preferWhiteExport ? "text-emerald-100" : "text-neutral-500"
            }`}
          >
            Amazon-ready · {resolveWhiteExportSize(canvasSize)}² pure white
          </span>
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onCopyPng}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-all hover:bg-stone-50"
        >
          {copyState === "ok" ? "Copied!" : copyState === "err" ? "Copy failed" : "Copy PNG"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex rounded-xl border border-black/10 bg-stone-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-stone-100"
        >
          New images
        </button>
      </div>
    </>
  );
}
