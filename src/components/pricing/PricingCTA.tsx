import Link from "next/link";

export function PricingCTA() {
  return (
    <section id="upgrade" className="border-t border-black/8 bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-black/8 bg-stone-50 p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <h2 className="text-3xl font-bold">Start free, upgrade when it pays off</h2>
        <p className="mt-3 text-neutral-600">
          Use the free tier first. Move up only when your image volume or workflow actually needs it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/#tool"
            className="inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Start Free
          </Link>
          <Link
            href="/api/auth/google/login"
            className="inline-flex rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
          >
            Sign in for Free
          </Link>
        </div>
      </div>
    </section>
  );
}
