"use client";

import { useState, useCallback, useRef } from "react";

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

export default function BgRemover() {
  const [stage, setStage] = useState<Stage>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setStage("idle");
    setOriginalUrl(null);
    setResultUrl(null);
    setError("");
    setSliderPos(50);
  };

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP)");
      setStage("error");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("Image must be under 25MB");
      setStage("error");
      return;
    }

    // Show original preview
    const objUrl = URL.createObjectURL(file);
    setOriginalUrl(objUrl);
    setStage("processing");
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Processing failed");
      }

      const blob = await res.blob();
      const resultObjUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjUrl);
      setStage("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "removed-bg.png";
    a.click();
  };

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Upload / Idle */}
      {(stage === "idle" || stage === "error") && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-violet-400 bg-violet-500/10"
              : "border-gray-600 hover:border-violet-400 hover:bg-gray-900/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-xl font-semibold mb-2">
            Drop your image here or click to upload
          </p>
          <p className="text-gray-400 text-sm">
            Supports PNG, JPG, WebP — up to 25MB
          </p>
          {stage === "error" && (
            <p className="text-red-400 mt-4 text-sm">{error}</p>
          )}
        </div>
      )}

      {/* Processing */}
      {stage === "processing" && (
        <div className="text-center py-16">
          <div className="relative inline-block mb-6">
            {originalUrl && (
              <img
                src={originalUrl}
                alt="Processing"
                className="max-h-72 rounded-xl opacity-50"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-violet-300">
                  Removing background...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result with comparison slider */}
      {stage === "done" && originalUrl && resultUrl && (
        <div className="space-y-6">
          {/* Comparison slider */}
          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden select-none cursor-col-resize"
            onMouseMove={(e) => {
              if (e.buttons === 1) handleSliderMove(e.clientX);
            }}
            onTouchMove={(e) => {
              handleSliderMove(e.touches[0].clientX);
            }}
          >
            {/* Result (full width, behind) */}
            <img
              src={resultUrl}
              alt="Background removed"
              className="w-full block"
              style={{
                background:
                  "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px",
              }}
            />
            {/* Original (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalUrl}
                alt="Original"
                className="w-full block"
                style={{
                  width: containerRef.current
                    ? `${containerRef.current.offsetWidth}px`
                    : "100%",
                }}
              />
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <span className="text-gray-800 text-sm font-bold">⟨⟩</span>
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 bg-black/60 text-xs px-2 py-1 rounded">
              Original
            </div>
            <div className="absolute top-3 right-3 bg-black/60 text-xs px-2 py-1 rounded">
              Removed
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              ⬇️ Download PNG
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
            >
              🔄 New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
