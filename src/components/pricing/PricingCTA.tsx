import Link from "next/link";

export function PricingCTA() {
  return (
    <section id="upgrade" className="border-t border-gray-800/50 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
        <h2 className="text-3xl font-bold">Start free today</h2>
        <p className="mt-3 text-gray-400">
          Try the remover now, then upgrade only when you need higher limits and more account features.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/#tool"
            className="inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Start Free
          </Link>
          <Link
            href="/api/auth/google/login"
            className="inline-flex rounded-xl border border-gray-800 bg-gray-950/70 px-5 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Sign in for Free
          </Link>
        </div>
      </div>
    </section>
  );
}
