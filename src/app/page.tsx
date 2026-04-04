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
    <main className="min-h-screen flex flex-col bg-stone-50 text-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-stone-50/88 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white transition-colors group-hover:bg-stone-100">
              <svg
                className="w-5 h-5 text-neutral-900"
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
              <span className="text-neutral-950">BG</span>Remover
            </span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 text-sm text-neutral-500">
              <a href="/pricing/" className="hover:text-neutral-900 transition-colors hidden sm:block">
                Pricing
              </a>
              <a
                href="#how-it-works"
                className="hover:text-neutral-900 transition-colors hidden sm:block"
              >
                How it works
              </a>
              <a
                href="#use-cases"
                className="hover:text-neutral-900 transition-colors hidden sm:block"
              >
                Use Cases
              </a>
              <a href="#faq" className="hover:text-neutral-900 transition-colors">
                FAQ
              </a>
            </nav>
            <a
              href="/pricing/"
              className="hidden rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100 sm:inline-flex"
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
          <div className="absolute left-[-8%] top-[-72px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72),rgba(255,255,255,0.28)_32%,transparent_72%)] blur-3xl" />
          <div className="absolute right-[-6%] top-[18px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(214,211,209,0.38),rgba(214,211,209,0.14)_34%,transparent_74%)] blur-3xl" />
          <div className="absolute left-[28%] top-[180px] h-[240px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_72%)] blur-[90px]" />
          <div className="ambient-grid absolute inset-x-0 top-0 h-[460px] opacity-[0.06]" />
          <div className="ambient-noise absolute inset-0 opacity-[0.08]" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-black/10 to-transparent" />

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
          <div id="auth-error-box" className="hidden mb-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" />

          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="pt-4 lg:pt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Free online background remover
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-neutral-950 md:text-6xl md:leading-[0.95]">
                Remove image backgrounds in seconds
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">
                Upload a photo and get a clean transparent background in seconds. Great for product photos, portraits, and everyday image cleanup.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#tool"
                  className="inline-flex items-center rounded-xl bg-neutral-950 px-5 py-3 font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Upload an image
                </a>
                <a
                  href="/pricing/"
                  className="inline-flex items-center rounded-xl border border-black/10 bg-white px-5 py-3 font-medium text-neutral-800 transition-colors hover:bg-stone-100"
                >
                  See pricing
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Cleaner cutouts", "Better handling for product edges, hair, and detailed outlines."],
                  ["Faster workflow", "Upload, preview, and download without getting stuck in a bloated editor."],
                  ["For everyday tasks", "Useful for stores, social posts, presentations, documents, and quick design work."],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <p className="text-sm font-semibold text-neutral-900">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-1/2 top-[-34px] h-36 w-[78%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.58),transparent_66%)] blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-[24%] h-[62%] w-[92%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,211,209,0.12),transparent_68%)] blur-[90px]" />
              <div className="pointer-events-none absolute left-1/2 bottom-[-34px] h-28 w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42),transparent_70%)] blur-3xl" />
              <div id="tool" className="relative rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:p-4">
              <BgRemover />
              </div>
            </div>
          </div>
        </div>

        <StatsCounter />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-black/8 bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            A simple workflow from upload to download
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-xl mx-auto">
            Upload your image, let BGRemover remove the background, and download the result in seconds.
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
                title: "Upload image",
                desc: "Drag and drop or click to upload your photo. Supports PNG, JPG, and WebP.",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 4.11a2.25 2.25 0 01-1.94 1.14H9.41a2.25 2.25 0 01-1.94-1.14L5 14.5m14 0H5" />
                  </svg>
                ),
                title: "Automatic cutout",
                desc: "The background is removed automatically so you can get a clean result faster.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
                title: "Download PNG",
                desc: "Preview the result and download your transparent PNG in seconds.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center group min-h-[200px]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/8 bg-stone-50 text-neutral-700 transition-colors group-hover:bg-stone-100">
                  {item.icon}
                </div>
                <div className="mb-2 font-mono text-xs text-neutral-400">
                  Step {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-black/8 py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            One tool, many everyday uses
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-xl mx-auto">
            Create cleaner images for stores, profiles, marketing, and day-to-day content work without extra editing overhead.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: "🛍️",
                title: "Product photos",
                desc: "Create cleaner listing images with white or transparent backgrounds for stores, marketplaces, and ads.",
              },
              {
                icon: "📸",
                title: "Profile pictures",
                desc: "Remove distracting backgrounds from portraits and headshots for resumes, LinkedIn, and social profiles.",
              },
              {
                icon: "📱",
                title: "Social media images",
                desc: "Clean up photos for stories, thumbnails, and quick content production that needs a sharper final look.",
              },
              {
                icon: "🏷️",
                title: "Marketing content",
                desc: "Prepare cleaner visuals for posts, banners, flyers, and campaigns without opening a full design tool.",
              },
              {
                icon: "📋",
                title: "Slides and documents",
                desc: "Insert cleaner images into presentations, reports, and documents without awkward white boxes.",
              },
              {
                icon: "🎨",
                title: "Quick design work",
                desc: "Cut products or subjects out for layouts, mockups, comparisons, and lightweight creative tasks.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group/card flex gap-4 rounded-2xl border border-black/8 bg-white p-5 transition-all duration-300 hover:border-black/12 hover:bg-stone-50 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-stone-50 transition-colors group-hover/card:bg-stone-100">{item.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative border-t border-black/8 py-20 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,245,244,0.95),transparent_62%)] blur-3xl" />
          <div className="absolute left-[16%] top-[30%] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(245,245,244,0.7),transparent_72%)] blur-2xl" />
          <div className="absolute right-[12%] top-[18%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(214,211,209,0.3),transparent_72%)] blur-2xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple pricing for different needs
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-xl mx-auto">
            Start for free and upgrade only when your image volume makes it worth it.
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
                    ? "border-black/12 bg-stone-50 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                    : "border-black/8 bg-white hover:border-black/12 hover:bg-stone-50 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                <p className="mt-1 text-sm text-neutral-600">{plan.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center justify-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-900/70" />
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
              className="inline-flex rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
            >
              See Full Pricing
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-black/8 bg-stone-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Common questions
          </h2>
          <p className="text-neutral-600 text-center mb-12">
            Questions about pricing, file limits, formats, and privacy.
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
              Need more removals?
            </h2>
            <p className="text-gray-400 mb-8">
              Start with the free plan and upgrade when you have enough images to make it worthwhile.
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
                A practical background remover for stores, content work, documents, and everyday image cleanup.
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
