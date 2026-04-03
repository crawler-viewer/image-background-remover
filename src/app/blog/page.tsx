import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog - Background Removal Tips & Tutorials | BGRemover",
  description:
    "Learn how to remove backgrounds from images, create transparent PNGs, and optimize product photos with our free AI tool.",
  alternates: { canonical: "/blog/" },
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
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-violet-400">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/pricing/" className="hover:text-white transition-colors">Pricing</a>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-gray-400">Tips, tutorials, and guides for background removal.</p>

        <div className="mt-12 space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="block rounded-2xl border border-gray-800 bg-gray-900/50 p-6 hover:border-gray-700 hover:bg-gray-900/80 transition-colors group"
            >
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-violet-300">
                  {post.tag}
                </span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold group-hover:text-violet-300 transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} BGRemover ·{" "}
          <a href="/privacy/" className="hover:text-gray-400">Privacy</a> ·{" "}
          <a href="/terms/" className="hover:text-gray-400">Terms</a>
        </div>
      </footer>
    </main>
  );
}
