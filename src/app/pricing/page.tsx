import { PricingCTA } from "@/components/pricing/PricingCTA";
import { PricingCards } from "@/components/pricing/PricingCards";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PlanComparison } from "@/components/pricing/PlanComparison";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <PricingHero />
      <PricingCards />
      <PlanComparison />
      <PricingFAQ />
      <PricingCTA />
    </main>
  );
}
