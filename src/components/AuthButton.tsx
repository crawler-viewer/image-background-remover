"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  email?: string;
  name?: string;
  picture?: string;
};

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (active) setUser(data?.user || null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "G";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="h-10 w-28 rounded-xl border border-gray-800 bg-gray-900/70 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/google/login"
        className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M21.8 12.23c0-.68-.06-1.34-.17-1.97H12v3.73h5.5a4.7 4.7 0 0 1-2.04 3.09v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.4Z"/>
          <path fill="currentColor" d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.3-2.56c-.92.62-2.09.98-3.47.98-2.67 0-4.93-1.8-5.74-4.22H2.85v2.65A10 10 0 0 0 12 22Z"/>
          <path fill="currentColor" d="M6.26 13.74A5.98 5.98 0 0 1 5.94 12c0-.6.11-1.19.32-1.74V7.61H2.85A10 10 0 0 0 2 12c0 1.61.39 3.13 1.09 4.39l3.17-2.65Z"/>
          <path fill="currentColor" d="M12 5.96c1.5 0 2.85.51 3.91 1.52l2.93-2.93C17.07 2.91 14.76 2 12 2A10 10 0 0 0 2.85 7.61l3.41 2.65c.81-2.42 3.07-4.3 5.74-4.3Z"/>
        </svg>
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || "User avatar"}
            className="h-7 w-7 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-200">
            {initials}
          </div>
        )}
        <div className="max-w-32 truncate text-sm text-gray-200">{user.name || user.email}</div>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
