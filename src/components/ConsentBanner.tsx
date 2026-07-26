"use client";

import { useEffect, useState } from "react";
import { applyConsent, readConsent, storeConsent, type ConsentChoice } from "@/lib/consent";

/**
 * Renders only until a choice is made. Nothing is measured before that: the
 * inline bootstrap in layout.tsx sets Consent Mode to denied by default.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      // Re-assert on every load — consent state does not survive the page
      applyConsent(stored);
      return;
    }
    setVisible(true);
  }, []);

  const decide = (choice: ConsentChoice) => {
    storeConsent(choice);
    applyConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-700">
          We use analytics cookies to see which features get used. The tool itself works
          either way — your images are never stored.{" "}
          <a
            href="/privacy/"
            className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
          >
            Privacy Policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-stone-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
