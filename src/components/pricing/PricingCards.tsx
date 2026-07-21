"use client";

import { useState, useEffect, useMemo } from "react";
import { pricingPlans, type BillingCycle } from "@/lib/pricing";
import { getPlanLimits } from "@/lib/plan-limits";
import { parseBuyProductId } from "@/lib/checkout";
import { trackViewPricing } from "@/lib/analytics";
import { PricingCard } from "./PricingCard";

type UserInfo = {
  plan: string;
  status: string;
} | null;

function billingCycleForProduct(productId: string | null): BillingCycle | null {
  if (!productId) return null;
  if (productId.endsWith("_yearly")) return "yearly";
  if (productId.endsWith("_monthly")) return "monthly";
  return null;
}

function planCodeForProduct(productId: string | null): string | null {
  if (!productId) return null;
  if (productId.startsWith("pro_")) return "pro";
  if (productId.startsWith("business_")) return "business";
  return null;
}

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [autoBuyProduct, setAutoBuyProduct] = useState<string | null>(null);
  const [autoBuyConsumed, setAutoBuyConsumed] = useState(false);

  useEffect(() => {
    trackViewPricing("pricing_page");
    const params = new URLSearchParams(window.location.search);
    const buy = parseBuyProductId(params.get("buy"));
    if (buy) {
      const cycle = billingCycleForProduct(buy);
      if (cycle) setBillingCycle(cycle);
      setAutoBuyProduct(buy);
      // Clean URL so refresh does not re-trigger checkout
      params.delete("buy");
      const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", next);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      try {
        const res = await fetch("/api/account/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active && data.user) {
            setUserInfo({ plan: data.user.plan, status: data.user.status });
          }
        }
      } catch {
        // silently fail - user not logged in
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const autoBuyPlanCode = useMemo(
    () => planCodeForProduct(autoBuyProduct),
    [autoBuyProduct]
  );

  // Wait until we know login state before auto-starting (avoids 401 race)
  const canAutoBuy = !loading && !!autoBuyProduct && !autoBuyConsumed;

  return (
    <section className="px-4 py-16" id="upgrade">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                billingCycle === "monthly"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                billingCycle === "yearly"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly · Save 17%
            </button>
          </div>
        </div>

        {canAutoBuy && (
          <p className="mb-6 text-center text-sm text-neutral-600">
            Signed in — resuming checkout for your selected plan…
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.code}
              plan={plan}
              billingCycle={billingCycle}
              currentPlan={userInfo?.plan}
              userStatus={userInfo?.status}
              autoBuy={canAutoBuy && plan.code === autoBuyPlanCode}
              onAutoBuyHandled={() => setAutoBuyConsumed(true)}
            />
          ))}
        </div>

        <div className="mt-8 space-y-2 text-center">
          <p className="text-sm text-neutral-500">
            Paid plans are{" "}
            <strong className="font-medium text-neutral-700">one-time prepaid periods</strong> via
            PayPal — not auto-renewing subscriptions. Renewing the same plan extends your current
            expiry.
          </p>
          <p className="text-sm text-neutral-500">
            Need extra removals without a plan?{" "}
            <a
              href="/credits/"
              className="text-neutral-800 underline decoration-black/20 underline-offset-4 hover:text-neutral-950"
            >
              Buy credit packs →
            </a>{" "}
            ($9.90 = 100 credits vs Pro {getPlanLimits("pro").monthlyLimit}/mo prepaid)
          </p>
        </div>
      </div>
    </section>
  );
}
