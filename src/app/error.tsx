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
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-gray-800 bg-gray-900/70 font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
