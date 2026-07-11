"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type User = {
  email?: string;
  name?: string;
  picture?: string;
};

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="h-10 w-20 animate-pulse rounded-xl border border-black/8 bg-stone-100 sm:w-28" />
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/google/login"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 sm:px-4 sm:py-2.5"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.8 12.23c0-.68-.06-1.34-.17-1.97H12v3.73h5.5a4.7 4.7 0 0 1-2.04 3.09v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.4Z"
          />
          <path
            fill="currentColor"
            d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.3-2.56c-.92.62-2.09.98-3.47.98-2.67 0-4.93-1.8-5.74-4.22H2.85v2.65A10 10 0 0 0 12 22Z"
          />
          <path
            fill="currentColor"
            d="M6.26 13.74A5.98 5.98 0 0 1 5.94 12c0-.6.11-1.19.32-1.74V7.61H2.85A10 10 0 0 0 2 12c0 1.61.39 3.13 1.09 4.39l3.17-2.65Z"
          />
          <path
            fill="currentColor"
            d="M12 5.96c1.5 0 2.85.51 3.91 1.52l2.93-2.93C17.07 2.91 14.76 2 12 2A10 10 0 0 0 2.85 7.61l3.41 2.65c.81-2.42 3.07-4.3 5.74-4.3Z"
          />
        </svg>
        <span className="hidden sm:inline">Sign in</span>
        <span className="sm:hidden">Login</span>
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100 sm:px-3 sm:py-2"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt=""
            className="h-7 w-7 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-stone-100 text-xs font-semibold text-neutral-800">
            {initials}
          </div>
        )}
        <span className="hidden max-w-[7rem] truncate sm:inline">
          {user.name || user.email}
        </span>
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg shadow-black/10"
        >
          <div className="border-b border-black/6 px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium text-neutral-900">
              {user.name || "Account"}
            </p>
            {user.email && (
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            )}
          </div>
          <Link
            href="/account/"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-stone-50"
            onClick={() => setMenuOpen(false)}
          >
            Account
          </Link>
          <Link
            href="/pricing/"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-stone-50"
            onClick={() => setMenuOpen(false)}
          >
            Upgrade
          </Link>
          <Link
            href="/credits/"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-stone-50"
            onClick={() => setMenuOpen(false)}
          >
            Buy credits
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
