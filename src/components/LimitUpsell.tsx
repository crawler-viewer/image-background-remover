"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { startCheckoutOrLogin } from "@/lib/checkout";
import { getMinCreditPack, getPopularCreditPack, planPriceLabel } from "@/lib/products";

export type LimitUpsellProps = {
  message: string;
  loggedIn: boolean;
  /** Compact = fewer lines (result strip); default = full card */
  compact?: boolean;
  className?: string;
  source?: string;
};

/**
 * Shown when monthly/guest quota is exhausted.
 * Guest → Sign in CTA; logged-in → one-click min credit pack + plans.
 */
export default function LimitUpsell({
  message,
  loggedIn,
  compact = false,
  className = "",
  source = "limit_upsell",
}: LimitUpsellProps) {
  const minPack = getMinCreditPack();
  const popularPack = getPopularCreditPack();
  const proPrice = planPriceLabel("pro", "monthly");
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuyCredits = async (productId: string) => {
    setBuying(productId);
    setError(null);
    trackEvent("upgrade_click", {
      source: `${source}_quick_buy`,
      product_id: productId,
    });
    try {
      const outcome = await startCheckoutOrLogin(productId, "tool", {
        product_type: "credits",
      });
      if (!outcome.redirected) {
        setError(outcome.error);
        setBuying(null);
      }
    } catch {
      setError("Payment error. Please try again.");
      setBuying(null);
    }
  };

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 text-left ${
        compact ? "p-3" : "p-4"
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="status"
    >
      <p className={`font-medium text-amber-900 ${compact ? "text-xs" : "text-sm"}`}>{message}</p>
      {!compact && (
        <p className="mt-1 text-xs text-amber-800/80">
          Limits reset on the 1st of each month (UTC). Credits never expire and work after your plan
          limit.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-4"}`}>
        {!loggedIn ? (
          <>
            <a
              href="/api/auth/google/login?return=%2F%23tool"
              onClick={() => trackEvent("login_click", { source })}
              className="inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Sign in for 20/mo free
            </a>
            <Link
              href="/pricing/"
              onClick={() => trackEvent("upgrade_click", { source: `${source}_pricing` })}
              className="inline-flex rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-stone-100"
            >
              View plans
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={buying === minPack.id}
              onClick={() => void handleBuyCredits(minPack.id)}
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-400"
            >
              {buying === minPack.id
                ? "Redirecting…"
                : `Buy ${minPack.credits} credits · ${minPack.priceLabel}`}
            </button>
            {popularPack.id !== minPack.id && !compact && (
              <button
                type="button"
                disabled={buying === popularPack.id}
                onClick={() => void handleBuyCredits(popularPack.id)}
                className="inline-flex rounded-lg border border-emerald-600/30 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
              >
                {buying === popularPack.id
                  ? "Redirecting…"
                  : `${popularPack.credits} credits · ${popularPack.priceLabel}`}
              </button>
            )}
            <Link
              href="/pricing/"
              onClick={() => trackEvent("upgrade_click", { source: `${source}_pricing` })}
              className="inline-flex rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-stone-100"
            >
              Pro {proPrice}
            </Link>
            <Link
              href="/credits/"
              onClick={() => trackEvent("upgrade_click", { source: `${source}_credits_page` })}
              className="inline-flex rounded-lg px-3 py-2 text-sm text-neutral-600 underline-offset-2 hover:underline"
            >
              More packs
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
