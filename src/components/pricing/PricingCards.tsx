"use client";

import { useState, useEffect } from "react";
import { pricingPlans, type BillingCycle } from "@/lib/pricing";
import { PricingCard } from "./PricingCard";

type UserInfo = {
  plan: string;
  status: string;
} | null;

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-sm">
            <button
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

        <div className="grid gap-6 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.code}
              plan={plan}
              billingCycle={billingCycle}
              currentPlan={userInfo?.plan}
              userStatus={userInfo?.status}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Need extra removals without a subscription?{" "}
            <a href="/credits/" className="text-neutral-800 underline decoration-black/20 underline-offset-4 hover:text-neutral-950">
              Buy credit packs →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
