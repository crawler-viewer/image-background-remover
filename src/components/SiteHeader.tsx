"use client";

import AuthButton from "@/components/AuthButton";

const navLinks = [
  { href: "/pricing/", label: "Pricing" },
  { href: "/white-background/", label: "White BG", hideOnMobile: true },
  { href: "/batch-remove-background/", label: "Batch", hideOnMobile: true },
  { href: "/blog/", label: "Blog", hideOnMobile: true },
];

type SiteHeaderProps = {
  /** Highlight current path for active nav styling */
  active?: "home" | "pricing" | "credits" | "blog" | "account" | "other";
  showUpgrade?: boolean;
};

export default function SiteHeader({ active, showUpgrade = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-stone-50/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <a href="/" className="group flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white transition-colors group-hover:bg-stone-100">
            <svg
              className="h-5 w-5 text-neutral-900"
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
            <span className="text-neutral-950">BG</span>Remover
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden items-center gap-5 text-sm text-neutral-500 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-neutral-900 ${
                  (active === "pricing" && link.href === "/pricing/") ||
                  (active === "blog" && link.href === "/blog/")
                    ? "font-medium text-neutral-900"
                    : ""
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {showUpgrade && active !== "pricing" && (
            <a
              href="/pricing/"
              className="hidden rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100 sm:inline-flex"
            >
              Upgrade
            </a>
          )}

          <AuthButton />
        </div>
      </div>
    </header>
  );
}
