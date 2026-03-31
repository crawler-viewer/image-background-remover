"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    today_used: number;
    daily_limit: number;
    remaining: number;
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
    // Check for payment status in URL
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setPaymentMsg("Payment successful! Your plan has been upgraded.");
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
      <main className="min-h-screen bg-gray-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-10 w-56 rounded-xl bg-gray-800" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-72 rounded-3xl bg-gray-900/60" />
            <div className="h-72 rounded-3xl bg-gray-900/60" />
          </div>
          <div className="h-72 rounded-3xl bg-gray-900/60" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-800 bg-gray-900/60 p-8 text-center">
          <h1 className="mb-3 text-3xl font-bold">Account</h1>
          <p className="mb-6 text-gray-400">Please sign in first to view your account center.</p>
          <Link href="/" className="inline-flex rounded-xl bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500 transition-colors">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Account Center</p>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          </div>
          <Link href="/" className="rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors">
            Back to Home
          </Link>
        </div>

        {paymentMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            ✓ {paymentMsg}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || "Avatar"} className="h-16 w-16 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 text-xl font-semibold text-violet-200">
                  {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold">{user.name || "Unnamed user"}</h2>
                <p className="text-gray-400">{user.email || "No email"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Plan</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xl font-semibold capitalize">{user.plan}</p>
                  {user.plan === "pro" && (
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">Pro</span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Status</p>
                <p className="mt-2 text-xl font-semibold capitalize">{user.status}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Created</p>
                <p className="mt-2 text-sm text-gray-300">{formatDate(user.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Last Login</p>
                <p className="mt-2 text-sm text-gray-300">{formatDate(user.last_login_at)}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Plan Limits</p>
                <p className="mt-2 text-sm text-gray-300">
                  Up to {user.max_file_size_mb}MB per image · {user.daily_limit} removals per month
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">This Month&apos;s Quota</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">{user.remaining}</p>
                <p className="mt-1 text-sm text-gray-400">remaining this month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Used</p>
                <p className="text-xl font-semibold">{user.today_used} / {user.daily_limit}</p>
              </div>
            </div>
            {(() => {
              const pct = Math.min(100, (user.today_used / user.daily_limit) * 100);
              const barColor = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-violet-500";
              return (
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-800">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              );
            })()}
            {user.remaining === 0 && (
              <p className="mt-3 text-sm text-red-400">
                Monthly limit reached. Resets on the 1st.
              </p>
            )}
            {user.plan !== "pro" && user.plan !== "business" ? (
              <Link
                href="/pricing"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 hover:bg-violet-500/20 transition-colors"
              >
                Upgrade to Pro — 200 removals/month
              </Link>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
                You&apos;re on the Pro plan ✓
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p className="text-sm text-gray-400">Your latest background removal jobs.</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/60 p-8 text-center text-gray-400">
              No recent activity yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-800">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr] gap-4 border-b border-gray-800 bg-gray-950/70 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gray-500">
                <div>File</div>
                <div>Status</div>
                <div>Time</div>
              </div>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_0.7fr_0.9fr] gap-4 border-b border-gray-800/80 px-4 py-4 text-sm last:border-b-0">
                  <div className="truncate text-gray-200">{item.source_filename || "Untitled image"}</div>
                  <div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-gray-400">{formatDate(item.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
