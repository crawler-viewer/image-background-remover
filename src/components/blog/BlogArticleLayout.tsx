import Link from "next/link";
import type { ReactNode } from "react";

type BlogArticleLayoutProps = {
  category: string;
  date: string;
  readTime: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
};

export default function BlogArticleLayout({
  category,
  date,
  readTime,
  title,
  intro,
  children,
  ctaTitle,
  ctaDescription,
  ctaLabel,
}: BlogArticleLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/8 bg-gray-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
              <svg
                className="h-5 w-5 text-white"
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
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/blog/" className="transition-colors hover:text-white">
              ← Blog
            </a>
          </nav>
        </div>
      </header>

      <article className="relative overflow-hidden px-4 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_58%)]" />
        <div className="pointer-events-none absolute left-1/2 top-28 h-40 w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.12),transparent_72%)] blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-gray-200">
                {category}
              </span>
              <span>{date}</span>
              <span>·</span>
              <span>{readTime}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              {title}
            </h1>

            {intro ? (
              <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 text-sm leading-7 text-gray-300 md:text-[15px]">
                {intro}
              </div>
            ) : null}

            <div className="prose prose-invert prose-sm mt-8 max-w-none space-y-6 leading-relaxed text-gray-300">
              {children}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="text-lg font-semibold text-white">{ctaTitle}</p>
              <p className="mt-2 text-sm text-gray-400">{ctaDescription}</p>
              <Link
                href="/#tool"
                className="mt-4 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-medium text-gray-950 transition-colors hover:bg-gray-200"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-white/8 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} BGRemover ·{" "}
          <a href="/privacy/" className="hover:text-gray-400">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="/terms/" className="hover:text-gray-400">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
