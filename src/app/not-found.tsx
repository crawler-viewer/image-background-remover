import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="other" />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-neutral-950">404</h1>
          <h2 className="mb-2 text-2xl font-semibold text-neutral-900">Page Not Found</h2>
          <p className="mb-8 text-neutral-600">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            ← Back to Background Remover
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
