import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type LegalShellProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

export default function LegalShell({ title, updated, children }: LegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="other" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:py-16">
        <div className="rounded-[28px] border border-black/8 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{title}</h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral-950 [&_li]:mt-1 [&_strong]:text-neutral-900">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
