import { pricingFaqs } from "@/lib/pricing";

export function PricingFAQ() {
  return (
    <section className="border-t border-black/8 bg-stone-50 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold">Pricing FAQ</h2>
        <p className="mt-3 text-center text-neutral-600">
          Everything you need to know before you upgrade.
        </p>
        <div className="mt-10 space-y-4">
          {pricingFaqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-black/8 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold text-neutral-900 transition-colors hover:text-neutral-700">
                {faq.q}
                <span className="text-neutral-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
