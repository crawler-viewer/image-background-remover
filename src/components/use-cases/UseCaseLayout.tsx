import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type FaqItem = { q: string; a: string };

type UseCaseLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  steps: Array<{ title: string; body: string }>;
  bullets: string[];
  faqs: FaqItem[];
  related?: Array<{ href: string; label: string }>;
  children?: ReactNode;
};

export default function UseCaseLayout({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  steps,
  bullets,
  faqs,
  related,
  children,
}: UseCaseLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-neutral-950">
      <SiteHeader active="other" />

      <section className="relative overflow-hidden px-4 pb-12 pt-14 md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_62%)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-neutral-600">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={primaryCta.href}
              className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
            >
              {primaryCta.label}
            </a>
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className="inline-flex rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-stone-100"
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-black/8 bg-stone-50 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="font-mono text-xs text-neutral-400">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="mt-2 text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Why sellers use this</h2>
          <ul className="mt-6 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex gap-3 text-neutral-700">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          {children}
        </div>
      </section>

      <section className="border-t border-black/8 bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-black/8 bg-stone-50 px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-medium text-neutral-900 marker:content-none">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {related && related.length > 0 ? (
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-neutral-900">Related</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {related.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-stone-100"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-black/8 bg-neutral-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Ready to process your images?</h2>
          <p className="mt-3 text-neutral-400">
            Free to try — no signup required for guest removals.
          </p>
          <a
            href={primaryCta.href}
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-stone-200"
          >
            {primaryCta.label}
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
