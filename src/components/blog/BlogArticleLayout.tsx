import Link from "next/link";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
    <div className="min-h-screen bg-stone-50 text-neutral-950">
      <SiteHeader active="blog" />

      <article className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_62%)]" />

        <div className="relative mx-auto max-w-3xl">
          <a
            href="/blog/"
            className="mb-6 inline-flex text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            ← Back to Blog
          </a>

          <div className="rounded-[28px] border border-black/8 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)] md:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="rounded-full border border-black/10 bg-stone-50 px-2 py-0.5 font-medium text-neutral-700">
                {category}
              </span>
              <span>{date}</span>
              <span>·</span>
              <span>{readTime}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-neutral-950 md:text-5xl">
              {title}
            </h1>

            {intro ? (
              <div className="mt-6 rounded-2xl border border-black/8 bg-stone-50 px-5 py-4 text-sm leading-7 text-neutral-700 md:text-[15px]">
                {intro}
              </div>
            ) : null}

            <div className="prose prose-neutral prose-sm mt-8 max-w-none space-y-6 leading-relaxed text-neutral-700 [&_a]:text-emerald-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-neutral-950 [&_li]:text-neutral-700 [&_strong]:text-neutral-900">
              {children}
            </div>

            <div className="mt-10 rounded-2xl border border-black/8 bg-stone-50 p-6 text-center">
              <p className="text-lg font-semibold text-neutral-950">{ctaTitle}</p>
              <p className="mt-2 text-sm text-neutral-600">{ctaDescription}</p>
              <Link
                href="/#tool"
                className="mt-4 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
