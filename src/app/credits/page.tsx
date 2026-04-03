"use client";

import { useState } from "react";
import Link from "next/link";

const CREDIT_PACKS = [
  { id: "credits_20", credits: 20, price: "$2.90", perUnit: "$0.145", badge: null },
  { id: "credits_100", credits: 100, price: "$9.90", perUnit: "$0.099", badge: "Popular" },
  { id: "credits_300", credits: 300, price: "$24.90", perUnit: "$0.083", badge: null },
  { id: "credits_800", credits: 800, price: "$49.90", perUnit: "$0.062", badge: "Best Value" },
];

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (productId: string) => {
    setLoading(productId);
    try {
      const res = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert(data.error || "Failed to create checkout");
      }
    } catch {
      alert("Payment error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-300">Credits</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Buy Credit Packs</h1>
        <p className="mt-3 text-gray-400">
          Need more removals without a subscription? Buy credits that never expire.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-[24px] border p-5 shadow-[0_14px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ${
              pack.badge === "Best Value"
                ? "border-white/14 bg-white/[0.06]"
                : "border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.045]"
            }`}
          >
            {pack.badge && (
              <span className="absolute -top-2.5 left-4 rounded-full border border-white/10 bg-white/[0.05] px-3 py-0.5 text-[10px] uppercase tracking-wider text-gray-200">
                {pack.badge}
              </span>
            )}
            <div className="mt-2 text-center">
              <div className="text-4xl font-bold">{pack.credits}</div>
              <p className="mt-1 text-sm text-gray-500">credits</p>
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-semibold">{pack.price}</div>
              <p className="mt-1 text-xs text-gray-500">{pack.perUnit} per removal</p>
            </div>
            <button
              onClick={() => handleBuy(pack.id)}
              disabled={loading === pack.id}
              className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                pack.badge === "Best Value"
                  ? "bg-white text-gray-950 hover:bg-gray-200 disabled:bg-gray-400"
                  : "border border-white/10 bg-white/[0.04] text-gray-100 hover:bg-white/[0.08]"
              }`}
            >
              {loading === pack.id ? "Redirecting..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">How Credits Work</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
            <span>Credits are used after your monthly plan limit is reached.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
            <span>Credits never expire — use them whenever you need.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
            <span>Larger packs offer better per-removal pricing.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
            <span>You must be signed in to purchase and use credits.</span>
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Want unlimited monthly access instead?{" "}
          <Link href="/pricing/" className="text-gray-200 underline decoration-white/20 underline-offset-4 hover:text-white">
            View subscription plans →
          </Link>
        </p>
      </div>
    </main>
  );
}
