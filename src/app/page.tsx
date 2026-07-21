import dynamic from "next/dynamic";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { StatsCounter } from "@/components/StatsCounter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroDemo from "@/components/HeroDemo";
import { compactPlanFeatures, MAX_BATCH_SIZE, PLAN_LIMITS } from "@/lib/pricing";

const BgRemover = dynamic(() => import("@/components/BgRemover"), {
  loading: () => (
    <div className="mx-auto w-full max-w-3xl">
      <div className="animate-pulse rounded-2xl border-2 border-dashed border-neutral-300 bg-stone-50 p-12 text-center md:p-16">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-stone-200" />
        <div className="mx-auto h-6 w-48 rounded-lg bg-stone-200" />
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="home" />

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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Free online · No signup · PNG &amp; white JPG
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-neutral-950 md:text-5xl md:leading-[1.05] lg:text-6xl lg:leading-[0.95]">
                Remove background from photo online — free
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">
                Free photo background remover for transparent PNG or pure white JPG. Paste, drop, or
                batch up to {MAX_BATCH_SIZE} images — no account needed to start. Great for product
                photos, portraits, and listings.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#tool"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
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
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-500">
                <a href="/white-background/" className="underline-offset-4 hover:text-neutral-900 hover:underline">
                  White background export
                </a>
                <a href="/batch-remove-background/" className="underline-offset-4 hover:text-neutral-900 hover:underline">
                  Batch remove (up to 20)
                </a>
                <a href="/blog/" className="underline-offset-4 hover:text-neutral-900 hover:underline">
                  Guides
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

              <div className="mt-8 hidden lg:block">
                <HeroDemo />
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
            How to remove a photo background online
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-xl mx-auto">
            Upload a JPG or PNG, let BGRemover remove the background free, then download a transparent PNG or white-background image.
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
                title: "Upload your photo",
                desc: "Drop, browse, or paste a photo. Supports PNG, JPG/JPEG, and WebP — free online, no signup to start.",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 4.11a2.25 2.25 0 01-1.94 1.14H9.41a2.25 2.25 0 01-1.94-1.14L5 14.5m14 0H5" />
                  </svg>
                ),
                title: "AI removes the background",
                desc: "Get a clean transparent cutout in seconds. Drag the slider to compare original vs removed.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
                title: "Download PNG or white JPG",
                desc: `Transparent PNG for design, pure white JPG for listings — or batch up to ${MAX_BATCH_SIZE} and ZIP download.`,
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
                desc: "Batch-clean listing images with white or transparent backgrounds for stores, marketplaces, and ads.",
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
                features: compactPlanFeatures("guest"),
              },
              {
                name: "Free",
                price: "$0",
                desc: "More monthly access + dashboard",
                highlight: false,
                features: compactPlanFeatures("free"),
              },
              {
                name: "Pro",
                price: "$9.9/mo",
                desc: "Best for power users",
                highlight: true,
                features: compactPlanFeatures("pro"),
              },
              {
                name: "Business",
                price: "$29.9/mo",
                desc: "Teams & high volume",
                highlight: false,
                features: compactPlanFeatures("business"),
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
            Free photo background remover FAQ — formats, privacy, and limits.
          </p>
          <div className="space-y-4">
            {[
              {
                q: "Can I remove background from a photo online for free?",
                a: "Yes. Guests get free removals every month with no signup. Sign in for a free account to unlock more monthly removals, or upgrade for higher volume.",
              },
              {
                q: "Do you support transparent PNG and white JPG?",
                a: "Yes. Download a transparent PNG for design tools, or export a pure white background JPG (RGB 255) for product listings and marketplaces.",
              },
              {
                q: "Can I remove the background from JPG or JPEG photos?",
                a: `Yes. JPG, JPEG, PNG, and WebP are supported. Max file size depends on your plan (from ${PLAN_LIMITS.guest.maxFileSizeMb}MB for guests up to ${PLAN_LIMITS.business.maxFileSizeMb}MB for Business).`,
              },
              {
                q: "Why should I create an account?",
                a: `A free account gives you more monthly removals (${PLAN_LIMITS.free.monthlyLimit}/mo vs ${PLAN_LIMITS.guest.monthlyLimit}/mo), access to your personal dashboard, and usage tracking.`,
              },
              {
                q: "What does Pro include?",
                a: `Pro gives you ${PLAN_LIMITS.pro.monthlyLimit} removals per month, larger upload sizes (up to ${PLAN_LIMITS.pro.maxFileSizeMb}MB), transparent PNG and Amazon-ready white JPG export, and expanded usage history.`,
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
                q: "Can I use the results for commercial purposes?",
                a: "Yes! The processed images are entirely yours. Use them for e-commerce, marketing, social media, print — any purpose, personal or commercial.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-neutral-900 hover:text-neutral-700 transition-colors list-none">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-neutral-600 text-sm leading-relaxed -mt-1">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-black/8 bg-white py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-100/60 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="rounded-3xl border border-black/8 bg-stone-50 p-10 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h2 className="text-3xl font-bold mb-3">
              Free online photo background remover
            </h2>
            <p className="text-neutral-600 mb-8">
              Start free — no signup required. Upgrade only when you need more monthly removals.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ScrollToTopButton />
              <a
                href="/pricing/"
                className="rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
              >
                See Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
