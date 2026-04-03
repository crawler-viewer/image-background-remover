import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Remove Background for Amazon Product Photos | BGRemover",
  description:
    "Amazon requires white backgrounds for main product images. Learn how to remove backgrounds instantly and meet Amazon's strict image requirements with our free AI tool.",
  alternates: { canonical: "/blog/remove-background-amazon-product-photos/" },
  openGraph: {
    title: "How to Remove Background for Amazon Product Photos",
    description: "Meet Amazon's white background requirement in seconds with AI.",
  },
};

export default function AmazonPost() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-violet-400">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/blog/" className="hover:text-white transition-colors">← Blog</a>
          </nav>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-violet-300">E-commerce</span>
          <span>March 31, 2026</span>
          <span>·</span>
          <span>4 min read</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          How to Remove Background for Amazon Product Photos
        </h1>

        <div className="mt-8 prose prose-invert prose-sm max-w-none space-y-6 text-gray-300 leading-relaxed">
          <p>
            If you sell on Amazon, you know the rules: <strong>main product images must have a pure white background (RGB 255, 255, 255)</strong>. Fail to meet this requirement and your listing may get suppressed, or worse, suspended.
          </p>

          <p>
            Traditionally, sellers either shoot on a white backdrop (expensive lighting setup) or hire a photo editor ($3-10 per image). Both are slow and costly, especially when you have dozens of SKUs.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">The AI Alternative</h2>

          <p>
            AI-powered background removal tools have gotten incredibly good. They can detect your product, remove the background, and output a clean transparent PNG — all in under 3 seconds.
          </p>

          <p>Here&apos;s how to do it with BGRemover:</p>

          <ol className="list-decimal pl-6 space-y-3">
            <li>
              <strong>Take your product photo</strong> — use any background, even your kitchen table. Just make sure the product is well-lit and in focus.
            </li>
            <li>
              <strong>Upload to BGRemover</strong> — drag and drop your image. The AI processes it in seconds.
            </li>
            <li>
              <strong>Download the transparent PNG</strong> — the background is completely removed.
            </li>
            <li>
              <strong>Add white background</strong> — open the PNG in any image editor (even free ones like Canva) and place it on a white canvas. Save as JPEG.
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-white mt-8">Amazon Image Requirements Checklist</h2>

          <ul className="list-disc pl-6 space-y-2">
            <li>Pure white background (RGB 255, 255, 255)</li>
            <li>Product fills 85% or more of the image frame</li>
            <li>Minimum 1000px on the longest side (1600px+ recommended for zoom)</li>
            <li>JPEG, TIFF, PNG, or GIF format</li>
            <li>No watermarks, logos, or text overlays</li>
            <li>No props, accessories, or lifestyle elements in the main image</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">Pro Tips for Better Results</h2>

          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Shoot in good lighting</strong> — natural daylight or a lightbox gives the AI cleaner edges to work with.</li>
            <li><strong>Avoid shadows on the product</strong> — shadows confuse the AI and may leave artifacts.</li>
            <li><strong>Use a contrasting background</strong> — a dark product on a light surface (or vice versa) gives better separation.</li>
            <li><strong>Check edges at 100% zoom</strong> — look for any remaining background pixels, especially around hair, fur, or translucent materials.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">How Much Does It Cost?</h2>

          <p>
            BGRemover offers 5 free removals per month without even signing up. Create a free account for 20/month. If you&apos;re a serious seller processing dozens of images, the Pro plan at $9.90/month gives you 200 removals — that&apos;s less than $0.05 per image.
          </p>

          <p>
            Compare that to $3-10 per image for manual editing, and the savings are obvious.
          </p>

          <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
            <p className="text-lg font-semibold text-white">Ready to try it?</p>
            <p className="mt-2 text-sm text-gray-400">Remove your first product photo background in seconds.</p>
            <Link
              href="/#tool"
              className="mt-4 inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              Try BGRemover Free →
            </Link>
          </div>
        </div>
      </article>

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
