"use client";

import { useState } from "react";
import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Export and delete, self-service. The Privacy Policy promises both; doing them
 * by email only would mean every request costs a human round trip.
 */
export default function DataRightsCard({ creditBalance = 0 }: { creditBalance?: number }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canDelete = typed.trim().toUpperCase() === "DELETE" && !busy;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Deletion failed (${res.status}).`);
      }
      window.location.href = "/?deleted=1";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="text-sm text-neutral-500">
          Download everything we hold about you, or close your account for good.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/account/export"
          className="inline-flex rounded-xl border border-black/10 bg-stone-50 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
        >
          Download my data (JSON)
        </a>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Delete my account
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h3 className="text-sm font-semibold text-red-900">This cannot be undone</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900/90">
            <li>Your profile and removal history are erased.</li>
            <li>
              {creditBalance > 0 ? (
                <>
                  Your <strong>{creditBalance} remaining credits</strong> are forfeited — spend
                  them first if you want to use them.
                </>
              ) : (
                <>Any remaining credit balance is forfeited.</>
              )}
            </li>
            <li>
              Records of completed payments are kept for accounting and dispute handling, with
              your identity detached from them.
            </li>
            <li>Signing in again creates a new, empty account.</li>
          </ul>

          <label className="mt-4 block text-sm font-medium text-red-900" htmlFor="confirm-delete">
            Type <span className="font-mono">DELETE</span> to confirm
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-1 w-40 rounded-lg border border-red-300 bg-white px-3 py-2 font-mono text-sm text-neutral-900 outline-none focus:border-red-500"
          />

          {error && <p className="mt-3 text-sm font-medium text-red-800">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped("");
                setError("");
              }}
              disabled={busy}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-500">
        Trouble signing in? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-700 hover:text-emerald-800">
          {SUPPORT_EMAIL}
        </a>{" "}
        from your account address and we will handle it.
      </p>
    </section>
  );
}
