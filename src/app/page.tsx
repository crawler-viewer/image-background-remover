import AuthButton from "@/components/AuthButton";
import dynamic from "next/dynamic";
import ScrollToTopButton from "@/components/ScrollToTopButton";

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
      <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
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
              <span className="text-violet-400">BG</span>Remover
            </span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 text-sm text-gray-400">
              <a href="/pricing" className="hover:text-white transition-colors hidden sm:block">
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
              href="/pricing"
              className="hidden rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20 sm:inline-flex"
            >
              Upgrade
            </a>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero + Tool */}
      <section className="relative flex-1 flex flex-col items-center px-4 pt-12 md:pt-20 pb-16 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] glow-violet opacity-60" />

        <div className="relative text-center mb-10 max-w-2xl min-h-[220px] md:min-h-[260px]">
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
          <div id="auth-error-box" className="hidden mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Free to try · No design skills needed
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            Image Background
            <br />
            Remover
          </h1>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
            Remove image backgrounds instantly with AI.
            <br className="hidden md:block" />
            Free to try. Sign in for more monthly removals.
          </p>
        </div>

        <BgRemover />

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-xs text-gray-500">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/30 border border-gray-800/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Images never stored
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/30 border border-gray-800/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Processed in seconds
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/30 border border-gray-800/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            AI-powered accuracy
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-800/50 py-20 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            How to Remove Background from Image
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Three simple steps to get a transparent background. No technical skills needed.
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
                title: "AI Processing",
                desc: "Our AI automatically detects the subject and removes the background with precision.",
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
                <div className="w-16 h-16 mx-auto mb-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                  {item.icon}
                </div>
                <div className="text-xs text-violet-400 font-mono mb-2">
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
      <section id="use-cases" className="border-t border-gray-800/50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Perfect For Every Use Case
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Whether you&apos;re selling products or creating content, clean backgrounds make all the difference.
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
                className="flex gap-4 p-5 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-violet-500/20 hover:bg-gray-900/80 transition-all duration-300 group/card"
              >
                <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gray-800/50 group-hover/card:bg-violet-500/10 transition-colors">{item.icon}</div>
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
      <section className="relative border-t border-gray-800/50 py-20">
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] glow-violet-sm" />
        <div className="relative max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Choose the plan that fits your workflow
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Start free. Upgrade only when you need higher limits.
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
                    ? "border-violet-500/30 bg-violet-500/5 hover:shadow-violet-500/10"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:shadow-gray-900/50"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-400">{plan.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center justify-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="/pricing"
              className="inline-flex rounded-xl border border-gray-800 bg-gray-950/70 px-6 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
            >
              See Full Pricing
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-gray-800/50 py-20 bg-gray-900/20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Everything you need to know about our background remover tool.
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
              <details key={faq.q} className="group bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold hover:text-violet-300 transition-colors list-none">
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
      <section className="relative border-t border-gray-800/50 py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-10">
            <h2 className="text-3xl font-bold mb-3">
              Ready to remove more backgrounds?
            </h2>
            <p className="text-gray-400 mb-8">
              Start free, sign in for more daily access, or upgrade to Pro for higher limits.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ScrollToTopButton />
              <a
                href="/pricing"
                className="px-6 py-3 rounded-xl border border-gray-800 bg-gray-950/70 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
              >
                See Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold">
                  <span className="text-violet-400">BG</span>Remover
                </span>
              </a>
              <p className="text-xs text-gray-600 max-w-xs">
                Free online AI tool to remove backgrounds from images instantly. Built for sellers, creators, and designers.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Product</span>
                <a href="/#tool" className="hover:text-gray-300 transition-colors">Try Now</a>
                <a href="/pricing" className="hover:text-gray-300 transition-colors">Pricing</a>
                <a href="/credits" className="hover:text-gray-300 transition-colors">Credit Packs</a>
                <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How it works</a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Support</span>
                <a href="#faq" className="hover:text-gray-300 transition-colors">FAQ</a>
                <a href="#use-cases" className="hover:text-gray-300 transition-colors">Use Cases</a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-gray-600 mb-1">Legal</span>
                <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800/50 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} BGRemover — Free Online Image Background Remover
          </div>
        </div>
      </footer>
    </main>
  );
}
