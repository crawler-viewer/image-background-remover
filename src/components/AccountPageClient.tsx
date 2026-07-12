"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type AccountResponse = {
  user: {
    id: number | null;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    plan: string;
    status: string;
    created_at: string | null;
    last_login_at: string | null;
    month_used: number;
    monthly_limit: number;
    remaining: number;
    credits: number;
    max_file_size_mb: number;
  } | null;
};

type UsageResponse = {
  items: Array<{
    id: number;
    action: string;
    source_filename: string | null;
    status: string;
    created_at: string;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AccountPageClient() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AccountResponse["user"]>(null);
  const [items, setItems] = useState<UsageResponse["items"]>([]);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setPaymentMsg(
        "Payment successful! Prepaid plan access or credits are active. Limits apply for the paid period; plans do not auto-renew."
      );
      trackEvent("purchase", { status: "success" });
      params.delete("payment");
      const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", next);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [accountRes, usageRes] = await Promise.all([
          fetch("/api/account/me", { cache: "no-store" }),
          fetch("/api/account/usage", { cache: "no-store" }),
        ]);

        const accountData = accountRes.ok ? await accountRes.json() : { user: null };
        const usageData = usageRes.ok ? await usageRes.json() : { items: [] };

        if (!active) return;
        setUser(accountData.user || null);
        setItems(usageData.items || []);
      } catch {
        if (!active) return;
        setUser(null);
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
        <SiteHeader active="account" />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-56 rounded-xl bg-black/[0.06]" />
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-72 rounded-3xl bg-black/[0.04]" />
              <div className="h-72 rounded-3xl bg-black/[0.04]" />
            </div>
            <div className="h-72 rounded-3xl bg-black/[0.04]" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
        <SiteHeader active="account" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
          <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <h1 className="mb-3 text-3xl font-bold">Account</h1>
            <p className="mb-6 text-neutral-600">
              Please sign in first to view your account center.
            </p>
            <a
              href="/api/auth/google/login"
              className="inline-flex rounded-xl bg-neutral-950 px-5 py-3 font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Sign in with Google
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="account" />
      <main className="relative flex-1 overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_62%)]" />
      <div className="pointer-events-none absolute left-[12%] top-24 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.6),transparent_72%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[14%] top-32 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(214,211,209,0.45),transparent_72%)] blur-3xl" />

      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Account Center</p>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          </div>
          <Link
            href="/#tool"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
          >
            Open tool
          </Link>
        </div>

        {paymentMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ✓ {paymentMsg}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || "Avatar"} className="h-16 w-16 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-stone-100 text-xl font-semibold text-neutral-900">
                  {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold">{user.name || "Unnamed user"}</h2>
                <p className="text-neutral-500">{user.email || "No email"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-black/8 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Plan</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xl font-semibold capitalize">{user.plan}</p>
                  {user.plan === "pro" && (
                    <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs text-neutral-700">Pro</span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-black/8 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Status</p>
                <p className="mt-2 text-xl font-semibold capitalize">{user.status}</p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Created</p>
                <p className="mt-2 text-sm text-neutral-700">{formatDate(user.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Last Login</p>
                <p className="mt-2 text-sm text-neutral-700">{formatDate(user.last_login_at)}</p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-stone-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Plan Limits</p>
                <p className="mt-2 text-sm text-neutral-700">
                  Up to {user.max_file_size_mb}MB per image · {user.monthly_limit} removals per month
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">This Month&apos;s Quota</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">{user.remaining}</p>
                <p className="mt-1 text-sm text-neutral-500">remaining this month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500">Used</p>
                <p className="text-xl font-semibold">{user.month_used} / {user.monthly_limit}</p>
              </div>
            </div>
            {(() => {
              const pct = Math.min(100, (user.month_used / user.monthly_limit) * 100);
              const barColor = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-200">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              );
            })()}
            {user.remaining === 0 && (
              <p className="mt-3 text-sm text-red-600">
                Monthly limit reached. {user.credits > 0 ? "Using credits for additional removals." : "Resets on the 1st."}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl border border-black/8 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-sm text-neutral-500">Credit Balance</p>
                <p className="text-lg font-semibold">{user.credits || 0} credits</p>
              </div>
              <Link
                href="/credits"
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-stone-100"
              >
                Buy Credits
              </Link>
            </div>

            {user.plan !== "pro" && user.plan !== "business" ? (
              <Link
                href="/pricing/"
                onClick={() => trackEvent("upgrade_click", { source: "account", plan: user.plan })}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
              >
                Buy Pro prepaid — 200 removals/month
              </Link>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                You&apos;re on the {user.plan === "business" ? "Business" : "Pro"} plan ✓
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p className="text-sm text-neutral-500">Your latest background removal jobs.</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 p-8 text-center text-neutral-500">
              No recent activity yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/8">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr] gap-4 border-b border-black/8 bg-stone-100 px-4 py-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
                <div>File</div>
                <div>Status</div>
                <div>Time</div>
              </div>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_0.7fr_0.9fr] gap-4 border-b border-black/8 px-4 py-4 text-sm last:border-b-0">
                  <div className="truncate text-neutral-800">{item.source_filename || "Untitled image"}</div>
                  <div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-neutral-500">{formatDate(item.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
