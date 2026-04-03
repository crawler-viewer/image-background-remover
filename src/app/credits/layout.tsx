import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Packs - Image Background Remover",
  description:
    "Buy credit packs for extra background removals. Credits never expire. Larger packs offer better per-removal pricing.",
  alternates: { canonical: "/credits" },
};

export default function CreditsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-violet-400">BG</span>Remover
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/pricing/" className="hover:text-white transition-colors">Pricing</a>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} BGRemover ·{" "}
          <a href="/privacy/" className="hover:text-gray-400">Privacy</a> ·{" "}
          <a href="/terms/" className="hover:text-gray-400">Terms</a>
        </div>
      </footer>
    </div>
  );
}
