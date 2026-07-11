export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/8 bg-stone-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <a href="/" className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white">
                <svg
                  className="h-4 w-4 text-neutral-900"
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
              <span className="text-sm font-bold">
                <span className="text-neutral-950">BG</span>Remover
              </span>
            </a>
            <p className="max-w-xs text-xs text-neutral-600">
              Free online background remover — transparent PNG, pure white JPG, and batch export for
              product photos.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-neutral-500">
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs uppercase tracking-[0.15em] text-neutral-400">
                Product
              </span>
              <a href="/#tool" className="transition-colors hover:text-neutral-900">
                Try Now
              </a>
              <a href="/white-background/" className="transition-colors hover:text-neutral-900">
                White Background
              </a>
              <a
                href="/batch-remove-background/"
                className="transition-colors hover:text-neutral-900"
              >
                Batch Remove
              </a>
              <a href="/pricing/" className="transition-colors hover:text-neutral-900">
                Pricing
              </a>
              <a href="/credits/" className="transition-colors hover:text-neutral-900">
                Credits
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs uppercase tracking-[0.15em] text-neutral-400">
                Resources
              </span>
              <a href="/blog/" className="transition-colors hover:text-neutral-900">
                Blog
              </a>
              <a
                href="/blog/remove-background-amazon-product-photos/"
                className="transition-colors hover:text-neutral-900"
              >
                Amazon Guide
              </a>
              <a href="/#faq" className="transition-colors hover:text-neutral-900">
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs uppercase tracking-[0.15em] text-neutral-400">
                Legal
              </span>
              <a href="/privacy/" className="transition-colors hover:text-neutral-900">
                Privacy
              </a>
              <a href="/terms/" className="transition-colors hover:text-neutral-900">
                Terms
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-black/8 pt-6 text-center text-xs text-neutral-500">
          © {year} BGRemover — Free Online Image Background Remover
        </div>
      </div>
    </footer>
  );
}
