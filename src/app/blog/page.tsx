import type { Metadata } from "next";
import Link from "next/link";

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
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/8 bg-gray-950/75 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] transition-colors group-hover:bg-white/[0.1]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/pricing/" className="hover:text-white transition-colors">Pricing</a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-10">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300">
            Notes on cleaner cutouts, product photos, and image prep
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">Blog</h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Practical guides for product shots, transparent PNGs, and fixing ugly backgrounds without wasting time.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="group block rounded-[24px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-gray-200">
                  {post.tag}
                </span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold transition-colors group-hover:text-white">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/8 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} BGRemover ·{" "}
          <a href="/privacy/" className="hover:text-gray-400">Privacy</a> ·{" "}
          <a href="/terms/" className="hover:text-gray-400">Terms</a>
        </div>
      </footer>
    </main>
  );
}
