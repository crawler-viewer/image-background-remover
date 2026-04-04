import { pricingFaqs } from "@/lib/pricing";

export function PricingFAQ() {
  return (
    <section className="border-t border-white/8 bg-black/10 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold">Pricing FAQ</h2>
        <p className="mt-3 text-center text-gray-400">
          Everything you need to know before you upgrade.
        </p>
        <div className="mt-10 space-y-4">
          {pricingFaqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-white/8 bg-white/[0.03]">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold transition-colors hover:text-white">
                {faq.q}
                <span className="text-gray-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
