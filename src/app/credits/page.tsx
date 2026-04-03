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
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Credits</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Buy Credit Packs</h1>
        <p className="mt-3 text-gray-400">
          Need more removals without a subscription? Buy credits that never expire.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-2xl border p-5 transition-colors ${
              pack.badge === "Best Value"
                ? "border-violet-500/30 bg-violet-500/5"
                : "border-gray-800 bg-gray-900/50"
            }`}
          >
            {pack.badge && (
              <span className="absolute -top-2.5 left-4 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-0.5 text-[10px] uppercase tracking-wider text-violet-300">
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
                  ? "bg-violet-600 text-white hover:bg-violet-500 disabled:bg-violet-800"
                  : "border border-gray-800 bg-gray-950/70 text-gray-200 hover:bg-gray-800"
              }`}
            >
              {loading === pack.id ? "Redirecting..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold">How Credits Work</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>Credits are used after your monthly plan limit is reached.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>Credits never expire — use them whenever you need.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>Larger packs offer better per-removal pricing.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>You must be signed in to purchase and use credits.</span>
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Want unlimited monthly access instead?{" "}
          <Link href="/pricing/" className="text-violet-400 hover:text-violet-300">
            View subscription plans →
          </Link>
        </p>
      </div>
    </main>
  );
}
