import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Blog - Background Removal Tips & Tutorials | BGRemover",
  description:
    "Learn how to remove backgrounds from images, create transparent PNGs, and optimize product photos with our free AI tool.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    title: "Blog - Background Removal Tips & Tutorials | BGRemover",
    description:
      "Learn how to remove backgrounds from images, create transparent PNGs, and optimize product photos with our free AI tool.",
    url: "/blog/",
    type: "website",
  },
};

const posts = [
  {
    slug: "remove-bg-alternative-free",
    title: "Best Free remove.bg Alternative in 2026",
    excerpt:
      "Compare free tiers, white JPG export, and batch ZIP workflows — and when a lighter tool beats remove.bg pricing.",
    date: "July 12, 2026",
    readTime: "6 min read",
    tag: "Comparison",
  },
  {
    slug: "shopify-product-white-background",
    title: "Shopify Product Photos: Clean White Backgrounds Fast",
    excerpt:
      "Standardize Shopify product media with AI cutouts, pure white JPG export, and batch processing for catalog drops.",
    date: "July 12, 2026",
    readTime: "5 min read",
    tag: "E-commerce",
  },
  {
    slug: "remove-background-amazon-product-photos",
    title: "How to Remove Background for Amazon Product Photos",
    excerpt:
      "Amazon requires white backgrounds for main product images. Learn how to remove backgrounds instantly and meet Amazon's image requirements.",
    date: "March 31, 2026",
    readTime: "4 min read",
    tag: "E-commerce",
  },
  {
    slug: "best-free-background-remover-tools-2026",
    title: "Best Free Background Remover Tools in 2026 Compared",
    excerpt:
      "We compared the top free background removal tools — from AI-powered web apps to desktop software. Here's what we found.",
    date: "March 31, 2026",
    readTime: "6 min read",
    tag: "Comparison",
  },
  {
    slug: "make-transparent-png-logo",
    title: "How to Make a Transparent PNG for Your Logo",
    excerpt:
      "Need a transparent logo for your website, social media, or merch? Here's the fastest way to convert any logo to transparent PNG.",
    date: "March 31, 2026",
    readTime: "3 min read",
    tag: "Tutorial",
  },
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="blog" />

      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_62%)]" />

        <div className="relative mx-auto max-w-4xl px-4 py-14 md:py-16">
          <div className="rounded-[28px] border border-black/8 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-10">
            <div className="inline-flex rounded-full border border-black/10 bg-stone-50 px-3 py-1 text-xs text-neutral-600">
              Guides for product photos, transparent PNGs, and cleaner cutouts
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">Blog</h1>
            <p className="mt-3 max-w-2xl text-neutral-600">
              Practical guides for product shots, transparent PNGs, and fixing messy backgrounds
              without a full design suite.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="group block rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/12 hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="rounded-full border border-black/10 bg-stone-50 px-2 py-0.5 font-medium text-neutral-700">
                    {post.tag}
                  </span>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-neutral-950 transition-colors group-hover:text-emerald-800">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{post.excerpt}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            <Link
              href="/white-background/"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-neutral-700 transition-colors hover:bg-stone-100"
            >
              White background guide
            </Link>
            <Link
              href="/batch-remove-background/"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-neutral-700 transition-colors hover:bg-stone-100"
            >
              Batch remove
            </Link>
            <Link
              href="/#tool"
              className="rounded-full bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Open tool
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
