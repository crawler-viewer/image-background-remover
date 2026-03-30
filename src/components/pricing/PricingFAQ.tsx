import { pricingFaqs } from "@/lib/pricing";

export function PricingFAQ() {
  return (
    <section className="border-t border-gray-800/50 bg-gray-900/20 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold">Pricing FAQ</h2>
        <p className="mt-3 text-center text-gray-400">
          Everything you need to know before you upgrade.
        </p>
        <div className="mt-10 space-y-4">
          {pricingFaqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-gray-800/50 bg-gray-900/50">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold hover:text-violet-300 transition-colors">
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
