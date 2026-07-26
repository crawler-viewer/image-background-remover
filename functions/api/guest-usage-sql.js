/**
 * Every successful guest removal writes TWO rows to `guest_usage_logs`:
 *
 *   1. cookie row — `guest_key = <uuid from __bg_gid>`  → the actual quota row
 *   2. mirror row — `guest_key = 'ip:<cf-connecting-ip>'` → IP anti-abuse ceiling
 *
 * See `claimGuestUsage` in functions/api/usage.js.
 *
 * Consequence: anything counting *removals* (public stats, admin report, daily
 * spend guard) MUST exclude the mirror rows, or every guest removal is counted
 * twice. Anything counting a *specific* guest_key (quota checks) is unaffected.
 */
export const EXCLUDE_IP_MIRROR_SQL = "guest_key NOT LIKE 'ip:%'";
