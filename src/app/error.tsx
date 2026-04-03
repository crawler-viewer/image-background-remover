"use client";

import Link from "next/link";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-950 text-white">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-gray-400 mb-2">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-600 mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-white px-6 py-3 font-medium text-gray-950 transition-colors hover:bg-gray-100"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-3 font-medium transition-colors hover:bg-white/[0.06]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
