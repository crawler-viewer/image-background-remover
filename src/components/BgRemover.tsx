"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Stage = "idle" | "processing" | "done" | "error";

type QuotaInfo = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  credits?: number;
  maxFileSizeMb: number;
  loggedIn: boolean;
};

export default function BgRemover() {
  const [stage, setStage] = useState<Stage>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch quota on mount and after each successful removal
  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [originalUrl, resultUrl]);

  const reset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("idle");
    setOriginalUrl(null);
    setResultUrl(null);
    setOriginalFile(null);
    setError("");
    setSliderPos(50);
    setProcessingTime(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [originalUrl, resultUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    const maxMb = quota?.maxFileSizeMb || 25;
    const maxBytes = maxMb * 1024 * 1024;
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return `Unsupported format: ${file.type || "unknown"}. Please upload PNG, JPG, or WebP.`;
    }
    if (file.size > maxBytes) {
      return `File too large (${formatFileSize(file.size)}). Maximum size is ${maxMb}MB for your current plan.`;
    }
    if (file.size < 100) {
      return "File appears to be empty or corrupted.";
    }
    return null;
  };

  const processImage = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setStage("error");
        return;
      }

      // Show original preview
      const objUrl = URL.createObjectURL(file);
      setOriginalUrl(objUrl);
      setOriginalFile(file);
      setStage("processing");
      setError("");
      setProcessingTime(0);

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setProcessingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch("/api/remove-bg", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error ||
              (res.status === 429
                ? "Daily limit reached. Please try again tomorrow."
                : `Server error (${res.status}). Please try again.`)
          );
        }

        const blob = await res.blob();
        if (blob.size < 100) {
          throw new Error("Received empty result. Please try a different image.");
        }

        const resultObjUrl = URL.createObjectURL(blob);
        setResultUrl(resultObjUrl);
        setStage("done");

        // Refresh quota after successful removal
        fetchQuota();
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Request timed out. Please try a smaller image.");
        } else {
          setError(
            err instanceof Error ? err.message : "Something went wrong. Please try again."
          );
        }
        setStage("error");
      } finally {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    },
    []
  );

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
    const name = originalFile
      ? originalFile.name.replace(/\.[^.]+$/, "") + "-no-bg.png"
      : "removed-bg.png";
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = name;
    a.click();
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  // Global mouse/touch up to stop dragging
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener("mouseup", handleUp);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleSliderMove]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Quota Status Bar */}
      {quota && (stage === "idle" || stage === "error") && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
              {quota.plan === "guest" ? "Guest" : quota.plan === "free" ? "Free" : "Pro"}
            </span>
            <span className="text-gray-400">
              {quota.remaining}/{quota.limit} removals left this month
              {quota.credits ? ` · ${quota.credits} credits` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!quota.loggedIn && (
              <a
                href="/api/auth/google/login"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Sign in for {quota.plan === "guest" ? "20/mo" : "more"}
              </a>
            )}
            {quota.loggedIn && quota.plan !== "pro" && (
              <a
                href="/pricing"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {(stage === "idle" || stage === "error") && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 md:p-16 text-center cursor-pointer transition-all duration-300 group ${
            dragOver
              ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
              : "border-gray-600 hover:border-violet-400 hover:bg-gray-900/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="transition-transform duration-300 group-hover:scale-110">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-500 group-hover:text-violet-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>

          <p className="text-xl font-semibold mb-2">
            Drop your image here or{" "}
            <span className="text-violet-400">browse</span>
          </p>
          <p className="text-gray-400 text-sm">
            PNG, JPG, WebP — up to {quota?.maxFileSizeMb || 25}MB
          </p>

          {stage === "error" && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Processing State */}
      {stage === "processing" && (
        <div className="text-center py-8">
          <div className="relative inline-block mb-6 rounded-2xl overflow-hidden">
            {originalUrl && (
              <img
                src={originalUrl}
                alt="Processing"
                className="max-h-80 rounded-2xl opacity-40 transition-opacity"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center gap-4 p-6 bg-black/40 rounded-2xl">
                {/* Animated spinner */}
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-violet-400/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" />
                  <div className="absolute inset-2 border-4 border-transparent border-t-violet-300 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-300">
                    Removing background...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {processingTime > 0 && `${processingTime}s elapsed · `}
                    {originalFile && formatFileSize(originalFile.size)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result with Comparison Slider */}
      {stage === "done" && originalUrl && resultUrl && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Comparison Slider */}
          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden select-none cursor-col-resize shadow-2xl shadow-violet-500/10"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleSliderMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleSliderMove(e.touches[0].clientX);
            }}
          >
            {/* Result layer (full width, behind) - checkerboard background */}
            <div
              className="relative"
              style={{
                background:
                  "repeating-conic-gradient(#303030 0% 25%, #3a3a3a 0% 50%) 50% / 16px 16px",
              }}
            >
              <img
                src={resultUrl}
                alt="Background removed result"
                className="w-full block"
                draggable={false}
              />
            </div>

            {/* Original layer (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalUrl}
                alt="Original image"
                className="block h-full object-cover"
                style={{ width: `${containerRef.current?.offsetWidth || 9999}px` }}
                draggable={false}
              />
            </div>

            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none"
              style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto cursor-col-resize hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9l-3 3 3 3m8-6l3 3-3 3"
                  />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg font-medium pointer-events-none">
              Original
            </div>
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-xs px-3 py-1.5 rounded-lg font-medium pointer-events-none">
              Removed
            </div>
          </div>

          {/* File info */}
          {originalFile && (
            <p className="text-center text-xs text-gray-500">
              {originalFile.name} · {formatFileSize(originalFile.size)}
              {processingTime > 0 && ` · Processed in ${processingTime}s`}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download PNG
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl font-semibold transition-all duration-200 border border-gray-700 hover:border-gray-600"
            >
              New Image
            </button>
          </div>

          {/* Post-download quota hint */}
          {quota && (
            <div className="mt-4 text-center text-sm text-gray-500">
              <span>
                {quota.remaining}/{quota.limit} removals left this month
              </span>
              {!quota.loggedIn && (
                <span>
                  {" · "}
                  <a href="/api/auth/google/login" className="text-violet-400 hover:text-violet-300">
                    Sign in for more
                  </a>
                </span>
              )}
              {quota.loggedIn && quota.plan !== "pro" && (
                <span>
                  {" · "}
                  <a href="/pricing" className="text-violet-400 hover:text-violet-300">
                    Upgrade
                  </a>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
