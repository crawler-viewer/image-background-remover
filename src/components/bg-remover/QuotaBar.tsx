"use client";

import { trackEvent } from "@/lib/analytics";
import { getPlanLimits } from "@/lib/plan-limits";
import { deriveQuotaView } from "@/lib/bg-remover/quota-view";
import type { QuotaInfo } from "@/lib/bg-remover/types";

const LINK_CLASS =
  "text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800";

/** Plan + remaining removals, always visible while the tool is in use. */
export default function QuotaBar({ quota }: { quota: QuotaInfo | null }) {
  const view = deriveQuotaView(quota);

  return (
    <div className="mb-4 rounded-xl border border-black/8 bg-stone-50 px-4 py-3">
      {quota ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-neutral-700">
                {view.planLabel}
              </span>
              <span className="text-neutral-600">
                <span className="font-medium text-neutral-800">{view.monthlyRemaining}</span>
                /{quota.limit} plan left
                {quota.loggedIn ? (
                  <>
                    {" · "}
                    <span className="font-medium text-neutral-800">{view.creditBalance}</span>{" "}
                    credits
                  </>
                ) : null}
              </span>
              {view.usingCreditsNext && (
                <span className="inline-flex rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                  Next removal uses 1 credit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!quota.loggedIn && (
                <a
                  href="/api/auth/google/login?return=%2F%23tool"
                  onClick={() => trackEvent("login_click", { source: "quota_bar" })}
                  className={LINK_CLASS}
                >
                  Sign in for {getPlanLimits("free").monthlyLimit}/mo
                </a>
              )}
              {quota.loggedIn && view.totalAvailable <= 3 && (
                <a
                  href="/credits/"
                  onClick={() =>
                    trackEvent("upgrade_click", { source: "quota_bar_credits", plan: quota.plan })
                  }
                  className={LINK_CLASS}
                >
                  Buy credits
                </a>
              )}
              {quota.loggedIn && quota.plan !== "pro" && quota.plan !== "business" && (
                <a
                  href="/pricing/"
                  onClick={() => trackEvent("upgrade_click", { source: "quota_bar", plan: quota.plan })}
                  className={LINK_CLASS}
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className={`h-full transition-all duration-300 ${
                view.usedPercent >= 90
                  ? "bg-red-500"
                  : view.usedPercent >= 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${view.usedPercent}%` }}
            />
          </div>
        </>
      ) : (
        <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
      )}
    </div>
  );
}
