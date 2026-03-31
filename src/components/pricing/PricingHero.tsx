export function PricingHero() {
  return (
    <section className="border-b border-gray-800/50 px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          No credit card required to try
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Simple pricing for clean image cutouts
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          Start free, then upgrade only when you need higher limits and a smoother workflow.
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
