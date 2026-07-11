import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PricingCTA } from "@/components/pricing/PricingCTA";
import { PricingCards } from "@/components/pricing/PricingCards";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PlanComparison } from "@/components/pricing/PlanComparison";

export const metadata: Metadata = {
  title: "Pricing — Free Photo Background Remover Plans | BGRemover",
  description:
    "Free online background remover pricing. Guests 5/mo, free account 20/mo, Pro 200/mo. Transparent PNG & white JPG. Start free — no card required.",
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title: "BGRemover Pricing — Free to Start",
    description: "Free photo background remover plans. Upgrade only when you need more volume.",
    url: "/pricing/",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="pricing" showUpgrade={false} />
      <PricingHero />
      <PricingCards />
      <PlanComparison />
      <PricingFAQ />
      <PricingCTA />
      <SiteFooter />
    </div>
  );
}
