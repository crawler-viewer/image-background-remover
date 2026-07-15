"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent, trackViewCredits } from "@/lib/analytics";
import { parseBuyProductId, startCheckoutOrLogin } from "@/lib/checkout";
import { getCreditPacks } from "@/lib/products";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const CREDIT_PACKS = getCreditPacks();

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeHint, setResumeHint] = useState(false);
  const autoBuyStarted = useRef(false);

  const handleBuy = async (productId: string) => {
    setLoading(productId);
    setError(null);
    try {
      const outcome = await startCheckoutOrLogin(productId, "credits", {
        product_type: "credits",
      });
      if (!outcome.redirected) {
        setError(outcome.error);
        setLoading(null);
      }
    } catch {
      trackEvent("checkout_error", { product_id: productId, reason: "network" });
      setError("Payment error. Please try again.");
      setLoading(null);
    }
  };

  // Resume checkout after Google login (?buy=credits_*)
  useEffect(() => {
    trackViewCredits("credits_page");
    if (autoBuyStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const buy = parseBuyProductId(params.get("buy"));
    if (!buy || !buy.startsWith("credits_")) return;

    autoBuyStarted.current = true;
    setResumeHint(true);
    params.delete("buy");
    const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", next);
    void handleBuy(buy);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="credits" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 md:py-16">
        <div className="rounded-[28px] border border-black/8 bg-white p-8 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Credits</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Buy Credit Packs</h1>
          <p className="mt-3 text-neutral-600">
            Need more removals without a prepaid plan? Buy credits that never expire. Used after your
            monthly free/plan limit is reached. Sign in is required to purchase.
          </p>
        </div>

        {resumeHint && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Signed in — opening PayPal checkout…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-[24px] border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300 ${
                pack.badge === "Best Value"
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "border-black/8 hover:border-black/12"
              }`}
            >
              {pack.badge && (
                <span className="absolute -top-2.5 left-4 rounded-full border border-black/10 bg-stone-50 px-3 py-0.5 text-[10px] uppercase tracking-wider text-neutral-700">
                  {pack.badge}
                </span>
              )}
              <div className="mt-2 text-center">
                <div className="text-4xl font-bold text-neutral-950">{pack.credits}</div>
                <p className="mt-1 text-sm text-neutral-500">credits</p>
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-semibold text-neutral-900">{pack.priceLabel}</div>
                <p className="mt-1 text-xs text-neutral-500">{pack.perUnitLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => handleBuy(pack.id)}
                disabled={loading === pack.id}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  pack.badge === "Best Value"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                    : "border border-black/10 bg-stone-50 text-neutral-900 hover:bg-stone-100"
                }`}
              >
                {loading === pack.id ? "Redirecting..." : "Buy Now"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[24px] border border-black/8 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">How Credits Work</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Credits are used after your monthly plan limit is reached.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Credits never expire — use them whenever you need.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Larger packs offer better per-removal pricing.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>
                You must be signed in to purchase. If you are not, we will send you to Google login
                and resume checkout afterward.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Want monthly access instead?{" "}
            <Link
              href="/pricing/"
              className="font-medium text-emerald-700 underline decoration-emerald-700/30 underline-offset-4 hover:text-emerald-800"
            >
              View prepaid plans →
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
