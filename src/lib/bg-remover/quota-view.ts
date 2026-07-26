/**
 * Derived quota numbers shared by the quota bar, the queue header and the
 * result footer — one place so the three can't disagree.
 */
import { planLabel } from "./format";
import type { QuotaInfo } from "./types";

export type QuotaView = {
  planLabel: string;
  creditBalance: number;
  monthlyRemaining: number;
  /** Plan remainder + credits (credits only count for signed-in users) */
  totalAvailable: number;
  /** Plan quota is spent but credits will cover the next removal */
  usingCreditsNext: boolean;
  /** 0–100 for the usage bar */
  usedPercent: number;
};

export function deriveQuotaView(quota: QuotaInfo | null): QuotaView {
  const creditBalance = Number(quota?.credits || 0);
  const monthlyRemaining = quota?.remaining ?? 0;
  const loggedIn = !!quota?.loggedIn;
  const limit = Math.max(1, quota?.limit ?? 1);
  const used = quota?.used ?? 0;

  return {
    planLabel: planLabel(quota?.plan),
    creditBalance,
    monthlyRemaining,
    totalAvailable: monthlyRemaining + (loggedIn ? creditBalance : 0),
    usingCreditsNext: loggedIn && monthlyRemaining <= 0 && creditBalance > 0,
    usedPercent: Math.max(0, Math.min(100, (used / limit) * 100)),
  };
}
