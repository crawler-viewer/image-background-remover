/**
 * Analytics consent.
 *
 * GA4 previously loaded unconditionally. Now the page boots with Consent Mode
 * v2 in `denied`, and analytics storage is only granted after an explicit
 * choice — which is what makes the tool usable from the EU without a cookie
 * complaint. The banner is shown to everyone rather than geo-gated: it is one
 * click, and guessing jurisdictions client-side is worse than asking.
 */
export const CONSENT_STORAGE_KEY = "bg_analytics_consent";

export type ConsentChoice = "granted" | "denied";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private mode / storage disabled — treat as undecided, never as consent
    return null;
  }
}

export function storeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* choice simply will not persist */
  }
}

/** Tell gtag about a decision. Safe to call when gtag never loaded. */
export function applyConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("consent", "update", {
      analytics_storage: choice,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  } catch {
    /* analytics must never break the product */
  }
}
