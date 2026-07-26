"use client";

import { resolveWhiteExportSize, solidColorLabel } from "@/lib/bg-remover/canvas";
import type { CanvasSize, ZipProgress } from "@/lib/bg-remover/types";

type Props = {
  open: boolean;
  onToggle: () => void;
  doneCount: number;
  bgColor: string;
  canvasSize: CanvasSize;
  downloading: boolean;
  zipProgress: ZipProgress;
  onZipPng: () => void;
  onZipWhiteJpeg: () => void;
  onZipCurrentSolid: () => void;
};

export default function BatchZipMenu({
  open,
  onToggle,
  doneCount,
  bgColor,
  canvasSize,
  downloading,
  zipProgress,
  onZipPng,
  onZipWhiteJpeg,
  onZipCurrentSolid,
}: Props) {
  const whiteSize = resolveWhiteExportSize(canvasSize);
  // The custom option only adds value when it differs from the white ZIP above
  const showCustomSolid = bgColor.toUpperCase() !== "#FFFFFF" || canvasSize === "original";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
      >
        {open ? "Hide batch downloads" : `Batch ZIP (${doneCount}) ▾`}
      </button>
      {open && (
        <div className="flex w-full flex-col items-center gap-2 pt-1">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onZipPng}
              disabled={downloading}
              className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-medium text-neutral-800 hover:bg-stone-50 disabled:opacity-60"
            >
              {downloading && zipProgress?.label.includes("PNG")
                ? "Building…"
                : "ZIP transparent PNG"}
            </button>
            <button
              type="button"
              onClick={onZipWhiteJpeg}
              disabled={downloading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {downloading && zipProgress?.label.includes("White JPG")
                ? "Building…"
                : `ZIP white JPG ${whiteSize}²`}
            </button>
          </div>
          {showCustomSolid && (
            <button
              type="button"
              onClick={onZipCurrentSolid}
              disabled={downloading}
              className="text-[11px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline disabled:opacity-60"
            >
              Or ZIP current solid options ({solidColorLabel(bgColor)}/{canvasSize})
            </button>
          )}
          <p className="text-center text-[11px] text-neutral-500">
            White ZIP = pure RGB 255 + square canvas (default 2000² for Amazon). Change size under
            export options to use 1000/1600 instead.
          </p>
          {zipProgress && (
            <div className="w-full max-w-xs">
              <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
                <span>{zipProgress.label}</span>
                <span>
                  {zipProgress.current}/{zipProgress.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.round((zipProgress.current / Math.max(1, zipProgress.total)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
