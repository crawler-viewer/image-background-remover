export function PricingHero() {
  return (
    <section className="relative overflow-hidden border-b border-black/8 bg-white px-4 py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(245,245,244,0.95),transparent_60%)]" />
      <div className="pointer-events-none absolute left-[16%] top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,245,244,0.7),transparent_72%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[18%] top-20 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(214,211,209,0.24),transparent_72%)] blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="inline-flex rounded-full border border-black/10 bg-stone-50 px-3 py-1 text-xs text-neutral-600">
          No credit card needed to try it
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Pricing that stays simple
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          Start with the free tier. Upgrade when your image volume makes the paid plans worth it.
        </p>
        <div className="mt-6 flex justify-center gap-3 text-sm text-neutral-500">
          <span>Guest: 5/mo</span>
          <span>•</span>
          <span>Free account: 20/mo</span>
          <span>•</span>
          <span>Pro: 200/mo</span>
          <span>•</span>
          <span>Business: 800/mo</span>
        </div>
      </div>
    </section>
  );
}
