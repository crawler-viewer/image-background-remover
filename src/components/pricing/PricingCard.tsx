"use client";

import type { BillingCycle, PricingPlan } from "@/lib/pricing";
import { useState } from "react";

type PricingCardProps = {
  plan: PricingPlan;
  billingCycle: BillingCycle;
};

function getProductId(planCode: string, billingCycle: BillingCycle): string | null {
  if (planCode === "pro") return billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
  if (planCode === "business") return billingCycle === "yearly" ? "business_yearly" : "business_monthly";
  return null;
}

export function PricingCard({ plan, billingCycle }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const priceLabel =
    plan.code === "pro" && billingCycle === "yearly" && plan.yearlyPriceLabel
      ? plan.yearlyPriceLabel
      : plan.code === "business" && billingCycle === "yearly" && plan.yearlyPriceLabel
        ? plan.yearlyPriceLabel
        : plan.monthlyPriceLabel;

  const productId = getProductId(plan.code, billingCycle);

  const handleBuy = async () => {
    if (!productId) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  const isPayable = !!productId;

  return (
    <div
      className={`rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 ${
        plan.highlight
          ? "border-black/12 bg-stone-50"
          : "border-black/8 bg-white hover:border-black/12 hover:bg-stone-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <p className="mt-2 text-sm text-neutral-600">{plan.description}</p>
        </div>
        {plan.badge ? (
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-neutral-700">
            {plan.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="text-4xl font-bold tracking-tight">{priceLabel}</div>
        {(plan.code === "pro" || plan.code === "business") && billingCycle === "yearly" ? (
          <p className="mt-2 text-sm text-neutral-500">Save with yearly billing</p>
        ) : null}
      </div>

      <ul className="mt-6 space-y-3 text-sm text-neutral-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900/70" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isPayable ? (
        <button
          onClick={handleBuy}
          disabled={loading}
          className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            plan.highlight
              ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-400"
              : "border border-black/10 bg-white text-neutral-800 hover:bg-stone-100"
          }`}
        >
          {loading ? "Redirecting to PayPal..." : plan.ctaLabel}
        </button>
      ) : (
        <a
          href={plan.ctaHref}
          className={`mt-8 inline-flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100`}
        >
          {plan.ctaLabel}
        </a>
      )}
    </div>
  );
}
