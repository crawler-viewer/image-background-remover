# Rate limiting & anti-abuse

Defense in depth for `/api/remove-bg` (the only costly upstream call).

## Layers

| Layer | Where | Limit | Purpose |
|-------|--------|-------|---------|
| Plan monthly quota | D1 `usage_logs` / `guest_usage_logs` | Guest 5, Free 20, Pro 200, Business 500 | Product billing |
| Guest IP monthly | `guest_usage_logs` key `ip:<ip>` | 15 / UTC month | Stop cookie-clearing freeloaders |
| App short window | D1 `rate_limit_logs` | **12 requests / IP / 60s** | Burst / script abuse |
| Cloudflare WAF | Dashboard (recommended) | See below | Edge block before Workers bill |

App constants live in **`shared/rate-limit.js`** (backend re-exports via `functions/api/usage.js`):

- `RATE_LIMIT_WINDOW_MS = 60_000`
- `RATE_LIMIT_MAX_PER_WINDOW = 12`
- `BATCH_MIN_GAP_MS ≈ 5000` (client paces batch jobs under the window)
- `BATCH_RATE_LIMIT_MAX_RETRIES = 3`
- Guest IP ceiling: `GUEST_IP_MONTHLY_LIMIT` in `shared/plan-limits.js` (15)

On short-window 429 the API returns:

```json
{
  "error": "Too many requests. Please wait a moment and try again.",
  "code": "RATE_LIMITED",
  "limit": 12,
  "retryAfterSec": 60
}
```

with `Retry-After` header. The batch UI waits (body + header), retries up to **3** times, and spaces jobs by `BATCH_MIN_GAP_MS`.

### Optional global daily budget

Set `DAILY_UPSTREAM_LIMIT` (e.g. `2000`) on Cloudflare Pages to cap claimed removals per **UTC day**.  
When exceeded, `/api/remove-bg` returns **503** with `code: "DAILY_BUDGET_EXCEEDED"`.  
Omit or set `0` to disable. Structured logs include `costUsdEst` when `UPSTREAM_COST_USD` is set (default `0.04`).

## Apply D1 schema (required once)

```bash
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

`CREATE TABLE IF NOT EXISTS rate_limit_logs` is idempotent.  
If the table is missing, `assertRateLimit` **fails open** (logs error, allows request) so a forgotten migration does not take the product offline.

## Cloudflare Rate Limiting (dashboard)

Cloudflare **Rate limiting rules** (WAF) run at the edge and should be configured in production even though app-level limits exist.

### Recommended rule

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → your zone (`picturebackgroundremover.xyz`)  
   or the Pages project’s associated zone.
2. **Security** → **WAF** → **Rate limiting rules** → **Create rule**.
3. Suggested settings:

| Field | Value |
|-------|--------|
| Rule name | `remove-bg burst` |
| If incoming requests match… | URI Path equals `/api/remove-bg` **and** HTTP Method equals `POST` |
| With the same characteristics | IP |
| When rate exceeds | **20** requests per **1 minute** |
| Then take action | **Block** (or Managed Challenge) |
| Duration | 1 minute |
| Response | Default 429 or custom JSON |

Why 20 at CF vs 12 in app?

- CF counts all POSTs (including validation failures before upstream).
- App limit is tighter and still returns structured JSON for the product UI.
- CF is the last line when someone bypasses the browser and hammers the edge.

### Optional stricter guest rule

If you later put guests on a path prefix or header, add a second rule at **10 / min**.  
Today guests and logged-in users share `/api/remove-bg`; rely on app guest monthly + IP monthly for freeloaders.

### Bot Fight / Super Bot Fight Mode

Enable **Bot Fight Mode** (free) under **Security → Bots**. Low effort, filters obvious scrapers.

### Pages note

Custom domains on Cloudflare Pages inherit zone WAF rules.  
`*.pages.dev` preview hosts may have fewer controls — keep preview `robots: noindex` and treat production domain as the rate-limit target.

## Ops checklist after deploy

- [ ] `rate_limit_logs` table exists on remote D1
- [ ] CF rate limit rule active on production hostname
- [ ] Manually POST `/api/remove-bg` >12 times/min → app 429 `RATE_LIMITED`
- [ ] Batch of 15 images still completes (serial + 250ms gap stays under 12/min for normal use; 20-image batch ~5+ min of work so OK)
- [ ] GA4 shows `remove_error` reason `rate_limited` if any

## Tuning

| Symptom | Action |
|---------|--------|
| Legitimate batch users hit 429 mid-queue | Raise `RATE_LIMIT_MAX_PER_WINDOW` to 20, or lower batch concurrency gap only |
| API bill spike | Lower CF rule to 10/min + tighten guest IP monthly |
| Shared office NAT false positives | Prefer Managed Challenge over Block at CF; keep app fail-open on DB errors |
