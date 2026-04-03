import Link from "next/link";

export function PricingCTA() {
  return (
    <section id="upgrade" className="border-t border-white/8 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
        <h2 className="text-3xl font-bold">Start free, upgrade when it pays off</h2>
        <p className="mt-3 text-gray-400">
          Use the free tier first. Move up only when your image volume or workflow actually needs it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/#tool"
            className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-950 transition-colors hover:bg-gray-100"
          >
            Start Free
          </Link>
          <Link
            href="/api/auth/google/login"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.08]"
          >
            Sign in for Free
          </Link>
        </div>
      </div>
    </section>
  );
}
