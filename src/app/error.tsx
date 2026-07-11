"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-neutral-950">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/8 bg-white text-2xl shadow-sm">
          !
        </div>
        <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-2 text-neutral-600">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        {error?.digest && (
          <p className="mb-6 text-xs text-neutral-400">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-black/10 bg-white px-6 py-3 font-medium text-neutral-800 transition-colors hover:bg-stone-100"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
