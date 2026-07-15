"use client";

import type { BillingCycle, PricingPlan } from "@/lib/pricing";
import { useEffect, useRef, useState } from "react";
import { startCheckoutOrLogin } from "@/lib/checkout";

type PricingCardProps = {
  plan: PricingPlan;
  billingCycle: BillingCycle;
  currentPlan?: string;
  userStatus?: string;
  /** When true, this card's product matches ?buy= after login — auto-start checkout once */
  autoBuy?: boolean;
  onAutoBuyHandled?: () => void;
};

function getProductId(planCode: string, billingCycle: BillingCycle): string | null {
  if (planCode === "pro") return billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
  if (planCode === "business")
    return billingCycle === "yearly" ? "business_yearly" : "business_monthly";
  return null;
}

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  autoBuy = false,
  onAutoBuyHandled,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoBuyStarted = useRef(false);

  const priceLabel =
    plan.code === "pro" && billingCycle === "yearly" && plan.yearlyPriceLabel
      ? plan.yearlyPriceLabel
      : plan.code === "business" && billingCycle === "yearly" && plan.yearlyPriceLabel
        ? plan.yearlyPriceLabel
        : plan.monthlyPriceLabel;

  const productId = getProductId(plan.code, billingCycle);

  const isCurrentPlan = currentPlan === plan.code;
  // Same plan → allow renew (extends expiry). Only block true downgrades.
  const isDowngrade = Boolean(
    currentPlan &&
      ((currentPlan === "business" && plan.code === "pro") ||
        (currentPlan === "business" && (plan.code === "free" || plan.code === "guest")) ||
        (currentPlan === "pro" && (plan.code === "free" || plan.code === "guest")))
  );
  const isRenewal = isCurrentPlan && !!productId;

  const handleBuy = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const outcome = await startCheckoutOrLogin(productId, "pricing", {
        product_type: "prepaid_plan",
        plan: plan.code,
        billing_cycle: billingCycle,
      });
      if (!outcome.redirected) {
        setError(outcome.error);
        setLoading(false);
      }
      // If redirected, leave loading true (navigating away)
    } catch {
      setError("Payment error. Please try again.");
      setLoading(false);
    }
  };

  // Auto-resume checkout after Google login (?buy=productId)
  useEffect(() => {
    if (!autoBuy || !productId || isDowngrade || autoBuyStarted.current) return;
    autoBuyStarted.current = true;
    onAutoBuyHandled?.();
    void handleBuy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when autoBuy is set
  }, [autoBuy, productId, isDowngrade]);

  const isPayable = !!productId;

  let ctaLabel = plan.ctaLabel;
  if (isRenewal) {
    ctaLabel =
      plan.code === "business"
        ? billingCycle === "yearly"
          ? "Renew Business (1 year)"
          : "Extend access"
        : billingCycle === "yearly"
          ? "Renew Pro (1 year)"
          : "Extend access";
  }
  if (loading) ctaLabel = "Redirecting to PayPal...";
  if (isDowngrade) ctaLabel = "Contact Support";

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
        ) : isCurrentPlan ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            Current Plan
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="text-4xl font-bold tracking-tight">{priceLabel}</div>
        {(plan.code === "pro" || plan.code === "business") && billingCycle === "yearly" ? (
          <p className="mt-2 text-sm text-neutral-500">Save ~17% · pay once for 12 months</p>
        ) : plan.code === "pro" || plan.code === "business" ? (
          <p className="mt-2 text-sm text-neutral-500">
            {isRenewal
              ? "Renewing extends your current expiry — remaining days are kept"
              : "Prepaid · no auto-renew"}
          </p>
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

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {isPayable ? (
        <button
          type="button"
          onClick={handleBuy}
          disabled={loading || isDowngrade}
          className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            plan.highlight || isRenewal
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-neutral-400"
              : "border border-black/10 bg-white text-neutral-800 hover:bg-stone-100 disabled:bg-neutral-100 disabled:text-neutral-400"
          }`}
        >
          {ctaLabel}
        </button>
      ) : (
        <a
          href={plan.ctaHref}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
        >
          {plan.ctaLabel}
        </a>
      )}
    </div>
  );
}
