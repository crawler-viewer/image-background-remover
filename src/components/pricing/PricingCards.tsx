"use client";

import { useState } from "react";
import { pricingPlans, type BillingCycle } from "@/lib/pricing";
import { PricingCard } from "./PricingCard";

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-sm">
            <button
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                billingCycle === "monthly"
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                billingCycle === "yearly"
                  ? "bg-neutral-950 text-white"
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
            <PricingCard key={plan.code} plan={plan} billingCycle={billingCycle} />
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
