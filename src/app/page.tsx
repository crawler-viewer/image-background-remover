import AuthButton from "@/components/AuthButton";
import dynamic from "next/dynamic";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { StatsCounter } from "@/components/StatsCounter";

const BgRemover = dynamic(() => import("@/components/BgRemover"), {
  loading: () => (
    <div className="w-full max-w-3xl mx-auto">
      <div className="border-2 border-dashed border-gray-600 rounded-2xl p-12 md:p-16 text-center animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full" />
        <div className="h-6 w-48 mx-auto bg-gray-800 rounded-lg" />
      </div>
    </div>
  ),
});

export default function Home() {
  const authErrorMessage = {
    config: "Google login is not configured yet.",
    state: "Login expired or became invalid. Please try again.",
    google: "Google login failed. Please try again.",
  } as const;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-gray-950/75 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] transition-colors group-hover:bg-white/[0.1]">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">BG</span>Remover
            </span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 text-sm text-gray-400">
              <a href="/pricing/" className="hover:text-white transition-colors hidden sm:block">
                Pricing
              </a>
              <a
                href="#how-it-works"
                className="hover:text-white transition-colors hidden sm:block"
              >
                How it works
              </a>
              <a
                href="#use-cases"
                className="hover:text-white transition-colors hidden sm:block"
              >
                Use Cases
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </nav>
            <a
              href="/pricing/"
              className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-gray-100 transition-colors hover:bg-white/[0.08] sm:inline-flex"
            >
              Upgrade
            </a>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero + Tool */}
      <section className="relative flex-1 overflow-hidden px-4 pt-10 pb-16 md:pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[-72px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0.08)_32%,transparent_72%)] blur-3xl" />
          <div className="absolute right-[-6%] top-[18px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.18),rgba(148,163,184,0.08)_34%,transparent_74%)] blur-3xl" />
          <div className="absolute left-[28%] top-[180px] h-[240px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-[90px]" />
          <div className="ambient-grid absolute inset-x-0 top-0 h-[460px] opacity-55" />
          <div className="ambient-noise absolute inset-0 opacity-100" />
          <div className="ambient-vignette absolute inset-0" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const params = new URLSearchParams(window.location.search);
              const error = params.get("auth_error");
              const map = ${JSON.stringify({ config: "Google login is not configured yet.", state: "Login expired or became invalid. Please try again.", google: "Google login failed. Please try again." })};
              if (!error || !map[error]) return;
              const box = document.getElementById("auth-error-box");
              if (!box) return;
              box.textContent = map[error];
              box.classList.remove("hidden");
              params.delete("auth_error");
              const nextQuery = params.toString();
              const nextUrl = window.location.pathname + (nextQuery ? "?" + nextQuery : "") + window.location.hash;
              window.history.replaceState({}, "", nextUrl);
            })();`,
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div id="auth-error-box" className="hidden mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" />

          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="pt-4 lg:pt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Cleaner cutouts for real product work
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[0.95]">
                Remove backgrounds fast,
                <br />
                keep the image usable
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-gray-400">
                Built for product photos, portraits, logos, and everyday cleanup work — without the cheap cutout look or the bloated editor routine.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#tool"
                  className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-medium text-gray-950 transition-colors hover:bg-gray-200"
                >
                  Start with an image
                </a>
                <a
                  href="/pricing/"
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 font-medium text-gray-200 transition-colors hover:bg-white/[0.08]"
                >
                  See pricing
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Natural edges", "Better handling for hair, shadows, and product outlines."],
                  ["Quick workflow", "Upload, preview, download, done."],
                  ["Made for work", "Useful for stores, docs, content, and team assets."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-1/2 top-[-34px] h-36 w-[78%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_66%)] blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-[24%] h-[62%] w-[92%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.14),transparent_68%)] blur-[90px]" />
              <div className="pointer-events-none absolute left-1/2 bottom-[-34px] h-28 w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)] blur-3xl" />
              <div id="tool" className="relative rounded-[28px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_32px_100px_rgba(0,0,0,0.42)] backdrop-blur-[3px] md:p-4">
              <BgRemover />
              </div>
            </div>
          </div>
        </div>

        <StatsCounter />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/8 bg-black/10 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            A simple workflow that stays out of your way
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            No overexplaining, no giant editor, no detours. Just upload, process, and download.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
                title: "Upload Image",
                desc: "Drag and drop or click to upload your photo. Supports PNG, JPG, and WebP.",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 4.11a2.25 2.25 0 01-1.94 1.14H9.41a2.25 2.25 0 01-1.94-1.14L5 14.5m14 0H5" />
                  </svg>
                ),
                title: "Background removed",
                desc: "The subject is separated automatically, so you can get to the usable version faster.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
                title: "Download Result",
                desc: "Preview with the comparison slider and download your transparent PNG for free.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center group min-h-[200px]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-gray-200 transition-colors group-hover:bg-white/[0.08]">
                  {item.icon}
                </div>
                <div className="mb-2 font-mono text-xs text-gray-500">
                  Step {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-white/8 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Works well for the stuff people actually need
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Product photos, profile pictures, logos, social posts, quick mockups — the usual messy-image problems.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: "🛍️",
                title: "E-commerce Product Photos",
                desc: "Clean white or transparent backgrounds for your online store listings. Boost conversion with professional product images.",
              },
              {
                icon: "📸",
                title: "Portrait & Profile Pictures",
                desc: "Remove messy backgrounds from portraits and headshots. Perfect for LinkedIn, resumes, and social profiles.",
              },
              {
                icon: "🎨",
                title: "Graphic Design",
                desc: "Extract subjects for use in designs, presentations, marketing materials, and creative compositions.",
              },
              {
                icon: "📱",
                title: "Social Media Content",
                desc: "Create eye-catching posts, stories, and thumbnails with clean, professional-looking images.",
              },
              {
                icon: "🏷️",
                title: "Marketing & Ads",
                desc: "Prepare product images for banners, flyers, and ad campaigns without expensive photo editing.",
              },
              {
                icon: "📋",
                title: "Documents & Presentations",
                desc: "Insert clean images into slides, reports, and documents. No more awkward white boxes.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group/card flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.05]"
              >
                <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.04] transition-colors group-hover/card:bg-white/[0.08]">{item.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative border-t border-white/8 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.11),transparent_62%)] blur-3xl" />
          <div className="absolute left-[16%] top-[30%] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-2xl" />
          <div className="absolute right-[12%] top-[18%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.1),transparent_72%)] blur-2xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Straightforward pricing
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Start free, pay only when your volume makes it worth it.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                name: "Guest",
                price: "Free",
                desc: "Try without signing in",
                highlight: false,
                features: ["5 removals/month", "Up to 10MB"],
              },
              {
                name: "Free",
                price: "$0",
                desc: "More monthly access + dashboard",
                highlight: false,
                features: ["20 removals/month", "Up to 15MB"],
              },
              {
                name: "Pro",
                price: "$9.9/mo",
                desc: "Best for power users",
                highlight: true,
                features: ["200 removals/month", "Up to 25MB"],
              },
              {
                name: "Business",
                price: "$29.9/mo",
                desc: "Teams & high volume",
                highlight: false,
                features: ["800 removals/month", "Up to 50MB"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg min-h-[220px] ${
                  plan.highlight
                    ? "border-white/14 bg-white/[0.06]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-400">{plan.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center justify-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="/pricing/"
              className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.08]"
            >
              See Full Pricing
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/8 bg-black/10 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Common questions
          </h2>
          <p className="text-gray-400 text-center mb-12">
            The short version, without the marketing perfume.
          </p>
          <div className="space-y-4">
            {[
              {
                q: "Is this tool free to try?",
                a: "Yes! Guests get 5 free removals per month. Sign in for a free account to unlock 20 removals per month. Upgrade for even higher limits.",
              },
              {
                q: "Why should I create an account?",
                a: "A free account gives you 4x more monthly removals (20/mo vs 5/mo), access to your personal dashboard, and usage tracking.",
              },
              {
                q: "What does Pro include?",
                a: "Pro gives you 200 removals per month, larger upload sizes (up to 25MB), priority processing, and expanded usage history.",
              },
              {
                q: "What image formats and sizes are supported?",
                a: "We support PNG, JPG, JPEG, and WebP formats. Maximum file size depends on your plan: 10MB for guests, 15MB for free accounts, 25MB for Pro, and 50MB for Business.",
              },
              {
                q: "Is my image data safe and private?",
                a: "Absolutely. Your images are processed in real-time and are never stored on our servers. Once the background is removed and you receive your result, all data is immediately discarded.",
              },
              {
                q: "Do unused removals roll over?",
                a: "No. Monthly limits reset on the 1st of each month.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel your Pro subscription anytime with no questions asked.",
              },
              {
                q: "Can I use the results for commercial purposes?",
                a: "Yes! The processed images are entirely yours. Use them for e-commerce, marketing, social media, print — any purpose, personal or commercial.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold hover:text-white transition-colors list-none">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed -mt-1">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/8 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
            <h2 className="text-3xl font-bold mb-3">
              Need more volume?
            </h2>
            <p className="text-gray-400 mb-8">
              Start with the free tier. Upgrade when you actually have enough images to justify it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ScrollToTopButton />
              <a
                href="/pricing/"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-gray-100 transition-colors hover:bg-white/[0.08]"
              >
                See Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold">
                <span className="text-white">BG</span>Remover
                </span>
              </a>
              <p className="text-xs text-gray-600 max-w-xs">
                A practical background remover for sellers, designers, marketers, and anyone cleaning up images in a hurry.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Product</span>
                <a href="/#tool" className="hover:text-gray-300 transition-colors">Try Now</a>
                <a href="/pricing/" className="hover:text-gray-300 transition-colors">Pricing</a>
                <a href="/credits/" className="hover:text-gray-300 transition-colors">Credit Packs</a>
                <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How it works</a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Support</span>
                <a href="#faq" className="hover:text-gray-300 transition-colors">FAQ</a>
                <a href="#use-cases" className="hover:text-gray-300 transition-colors">Use Cases</a>
                <a href="/blog/" className="hover:text-gray-300 transition-colors">Blog</a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Legal</span>
                <a href="/privacy/" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                <a href="/terms/" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/8 pt-6 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} BGRemover — Free Online Image Background Remover
          </div>
        </div>
      </footer>
    </main>
  );
}
