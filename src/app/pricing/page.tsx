import type { Metadata } from "next";
import { PricingCTA } from "@/components/pricing/PricingCTA";
import { PricingCards } from "@/components/pricing/PricingCards";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PlanComparison } from "@/components/pricing/PlanComparison";

export const metadata: Metadata = {
  title: "Pricing - Image Background Remover",
  description:
    "Simple pricing for background removal. Start free with 5 removals per month. Sign in for 20/mo. Upgrade to Pro for 200/mo.",
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title: "Pricing - Image Background Remover",
    description: "Start free, upgrade only when you need more.",
    url: "/pricing/",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-neutral-950">
      <header className="border-b border-black/8 bg-stone-50/88 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white transition-colors group-hover:bg-stone-100">
              <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-neutral-950">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-neutral-500">
            <a href="/" className="hover:text-neutral-900 transition-colors">Home</a>
            <a href="/credits/" className="hover:text-neutral-900 transition-colors">Credits</a>
            <a href="/#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>
          </nav>
        </div>
      </header>
      <PricingHero />
      <PricingCards />
      <PlanComparison />
      <PricingFAQ />
      <PricingCTA />

      <footer className="border-t border-black/8 bg-stone-50 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} BGRemover ·{" "}
          <a href="/privacy/" className="hover:text-neutral-900">Privacy</a> ·{" "}
          <a href="/terms/" className="hover:text-neutral-900">Terms</a>
        </div>
      </footer>
    </main>
  );
}
