import type { Metadata } from "next";
import { PricingCTA } from "@/components/pricing/PricingCTA";
import { PricingCards } from "@/components/pricing/PricingCards";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PlanComparison } from "@/components/pricing/PlanComparison";

export const metadata: Metadata = {
  title: "Pricing - Image Background Remover",
  description:
    "Simple pricing for background removal. Start free with 3 removals per day. Sign in for 10/day. Upgrade to Pro for 100/day.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing - Image Background Remover",
    description: "Start free, upgrade only when you need more.",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-violet-400">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
        </div>
      </header>
      <PricingHero />
      <PricingCards />
      <PlanComparison />
      <PricingFAQ />
      <PricingCTA />
    </main>
  );
}
