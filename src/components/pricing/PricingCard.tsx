import Link from "next/link";
import type { BillingCycle, PricingPlan } from "@/lib/pricing";

type PricingCardProps = {
  plan: PricingPlan;
  billingCycle: BillingCycle;
};

export function PricingCard({ plan, billingCycle }: PricingCardProps) {
  const priceLabel =
    plan.code === "pro" && billingCycle === "yearly" && plan.yearlyPriceLabel
      ? plan.yearlyPriceLabel
      : plan.monthlyPriceLabel;

  return (
    <div
      className={`rounded-3xl border p-6 shadow-lg transition-colors ${
        plan.highlight
          ? "border-violet-500/30 bg-violet-500/5 shadow-violet-500/10"
          : "border-gray-800 bg-gray-900/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
        </div>
        {plan.badge ? (
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            {plan.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="text-4xl font-bold tracking-tight">{priceLabel}</div>
        {plan.code === "pro" ? (
          <p className="mt-2 text-sm text-gray-400">Save 33% with yearly billing</p>
        ) : null}
      </div>

      <ul className="mt-6 space-y-3 text-sm text-gray-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.ctaHref}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
          plan.highlight
            ? "bg-violet-600 text-white hover:bg-violet-500"
            : "border border-gray-800 bg-gray-950/70 text-gray-200 hover:bg-gray-800"
        }`}
      >
        {plan.ctaLabel}
      </Link>
    </div>
  );
}
