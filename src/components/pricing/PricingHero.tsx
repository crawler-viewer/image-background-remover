export function PricingHero() {
  return (
    <section className="border-b border-white/8 px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300">
          No credit card needed to try it
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Pricing that stays simple
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          Start with the free tier. Upgrade when your image volume makes the paid plans worth it.
        </p>
        <div className="mt-6 flex justify-center gap-3 text-sm text-gray-400">
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
