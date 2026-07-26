# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned to `pnpm@9.15.9`). Node 22 is used in CI.

```bash
pnpm install                  # install dependencies
pnpm dev                      # Next.js dev server (default :3000)
pnpm build                    # static export to ./out
pnpm preview                  # wrangler pages dev out (run Functions locally against built output)
pnpm pages:deploy             # wrangler pages deploy out --project-name=image-background-remover-git
pnpm pages:env:update         # push env vars to Cloudflare Pages preview+production via API
```

`pnpm test` runs `scripts/unit-tests.mjs` (no test framework, no extra deps). It imports the
real modules — including frontend `.ts` files, via native type stripping plus
`scripts/ts-alias-hook.mjs` for the `@/*` alias — so assertions are behavioural, not
source-text greps. **Node ≥ 22.18 is required** for that. There is no lint script; type errors
surface at `pnpm build` time (Next.js runs `tsc`). When changing code, run both.

CI: `.github/workflows/ci.yml` covers pull requests. `.github/workflows/deploy.yml` runs tests
in a `test` job that the `deploy` job depends on, so a red build never reaches production.

## Architecture

This is a Next.js 16 App Router app **statically exported** to Cloudflare Pages, with all server logic implemented as **Cloudflare Pages Functions** (Workers runtime) under `functions/api/*`. There is no Node server at runtime — Next.js produces `out/` and `functions/` is deployed alongside it.

Key consequence: anything dynamic (auth, quota, image processing, payments) must live in `functions/api/*.js` and use Workers-compatible APIs (`fetch`, `crypto.subtle`, `env.DB`). Do **not** put server logic in Next route handlers — `output: "export"` in `next.config.ts` disables them.

### Request flow for `/api/remove-bg`

`functions/api/remove-bg.js` is orchestration only (~140 lines). Each phase is a module, and
each phase function returns either `{ response }` to short-circuit or the data the next phase
needs. The `_`-prefixed filenames keep Pages from routing them:

| Module | Owns |
|---|---|
| `_remove-bg-guards.js` | daily spend cap → per-IP burst limit → `Content-Length` pre-check → type/size validation |
| `_remove-bg-billing.js` | session → user row → plan (+expiry downgrade) → quota claim/rank → credit fallback → `releaseClaims` |
| `_remove-bg-upstream.js` | provider selection, the Clipdrop/Remove.bg call, upstream→client error mapping |

Add new server logic **inside a phase module**, not in the orchestrator. Touch points:

1. `readSession` (`functions/api/auth/_lib.js`) — verifies HMAC-signed `bg_session` cookie using `AUTH_SECRET`.
2. `getUserWithSession` (`functions/api/auth/db.js`) — loads the D1 `users` row.
3. Plan resolution + expiry downgrade — if `plan_expires_at` is past, the user is downgraded to `free` in-place.
4. Size pre-check — `Content-Length` over the plan cap is rejected with 413 **before** `request.formData()` buffers the upload into Worker memory.
5. Monthly quota — `assertMonthlyLimit` / `assertGuestAccess` in `functions/api/usage.js` count rows in `usage_logs` / `guest_usage_logs` for the current UTC month.
6. Claim, then rank — the usage row is inserted *before* the upstream call, then `getUserUsageRank` / `getGuestUsageRanks` compute that row's position within the month. Over the limit → roll the row back. Ranking (not re-counting a total) is what keeps two requests racing on the last slot from both being rejected.
7. Credit fallback — when a logged-in user exceeds quota, `user_credits.balance` is checked; if positive, the request proceeds and 1 credit is deducted on success.
8. Upstream — **Clipdrop is preferred when `CLIPDROP_API_KEY` is set; otherwise falls back to Remove.bg via `REMOVE_BG_API_KEY`**. The README only mentions Remove.bg but the live code prefers Clipdrop.
9. Failure → `releaseClaims` deletes the claimed rows and refunds any deducted credit.

`functions/api/quota.js` mirrors steps 1–3, 5 and 7 (read-only) and is what the frontend polls.

Guest removals write **two** `guest_usage_logs` rows (cookie + `ip:<addr>` mirror). Anything that counts removals must exclude the mirror rows via `EXCLUDE_IP_MIRROR_SQL` (`functions/api/guest-usage-sql.js`) — `stats.js`, `admin/report.js` and `cost-guard.js` all do.

### Plan config

`shared/plan-limits.js` is the **source of truth** for monthly removals, max upload size, `MAX_BATCH_SIZE`, and `GUEST_IP_MONTHLY_LIMIT`. Backend adapts it via `functions/api/plan-config.js`; frontend via `src/lib/plan-limits.ts` / `src/lib/pricing.ts`. Change limits only in `shared/plan-limits.js` — unit tests assert alignment.

Note: the backend enforces **monthly** quotas (`monthRange()` uses UTC month start/end). The account UI historically used "daily" naming; treat the backend as authoritative.

### Guest identity

Guests get a UUID in the `__bg_gid` cookie (`guestCookieString`, 1-year, HttpOnly, Secure, SameSite=Lax). The cookie is the primary key in `guest_usage_logs` (5 removals/month).

Anti-abuse: successful guest removals also write a second row with `guest_key = ip:<cf-connecting-ip>`. `assertGuestAccess` enforces cookie limit **and** IP soft ceiling (`GUEST_IP_MONTHLY_LIMIT = 15` per UTC month). Clearing cookies cannot exceed the IP ceiling.

Short-window rate limit: `assertRateLimit` writes to D1 `rate_limit_logs` (**12 POSTs / IP / 60s** on `/api/remove-bg`). The hit is written and counted in one `db.batch()`; a rejected request deletes its own hit so a retrying client is not locked out beyond the window. Fails **open only when the table is missing** (pre-migration) — any other D1 error fails closed. See `docs/rate-limiting.md` for Cloudflare WAF setup.

### Auth

Google OAuth flow lives in `functions/api/auth/google/` (login, callback). Session is a **stateless HMAC-signed cookie** (`bg_session`, 7-day TTL) — there is no server-side session store. Logout just clears the cookie. The `users` row is upserted on each callback.

### Database (Cloudflare D1)

Binding name is `DB`. Schema is `db/schema.sql`. Tables: `users`, `usage_logs`, `guest_usage_logs`, `payment_orders`, `user_credits`, `rate_limit_logs`. Apply with:

```bash
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

The schema file is the migration — there is no migrations directory. Add new tables/columns idempotently (`CREATE TABLE IF NOT EXISTS`, etc.) and re-run.

### Payments

`functions/api/payment/` contains PayPal checkout and webhook handling, persisting to `payment_orders` and crediting `user_credits` (credit packs) or updating `users.plan` + `plan_expires_at` (subscriptions). The frontend entry point is `/credits` and `/pricing`.

`create-checkout` is throttled per account (`CHECKOUT_MAX_PER_WINDOW` in `shared/rate-limit.js`): each call writes a `payment_orders` row and creates a PayPal order, so an unthrottled loop grows the table and eats the PayPal API quota real buyers need. If the PayPal call then fails, the row is marked `failed` rather than left `pending` forever.

Both fulfilment paths (capture redirect and webhook) are fail-closed on money: `verifyCapturedAmount` in `paypal-lib.js` must pass before `fulfillPaidOrder` runs, and the webhook returns 503 for every event unless `PAYPAL_WEBHOOK_ID` is set — an unsigned event could otherwise grant a plan to anyone who knows a `paypal_order_id` (which `create-checkout` hands to the browser).

### Frontend

`src/app/` is App Router with `output: "export"` — every route must be statically renderable (no `dynamic = "force-dynamic"`, no server actions, no Node runtime APIs at request time). Dynamic data is fetched client-side from `/api/*`.

Main interactive component is `src/components/BgRemover.tsx`, a state-machine (`idle | processing | done | error`) that posts a `FormData` blob to `/api/remove-bg` and renders a before/after slider. Supports multi-file batch (up to 20) and ZIP download via `fflate`.

It owns state and orchestration only. Two rules keep it that way:

- **Logic goes in `src/lib/bg-remover/*.ts`** — `canvas.ts` (sizes + filename slugs, incl. `resolveWhiteExportSize`: white/marketplace exports upgrade `original` → 2000²), `deep-link.ts` (`?export=white&size=2000`), `removal-errors.ts` (failure → retry / hard-stop / single-file error, plus the GA4 event to fire), `batch-allowance.ts` (how many files may start), `quota-view.ts` (derived quota numbers), `format.ts` (ETA, sizes, labels). These are pure and unit-tested. `export-image.ts` and `zip-batch.ts` need browser APIs (canvas, Blob) and are not.
- **Markup goes in `src/components/bg-remover/*.tsx`** — `QuotaBar`, `UploadDropzone`, `BatchQueue`, `ProcessingOverlay`, `CompareSlider`, `ResultActions`, `ExportOptions`, `BatchZipMenu`, `FailedItemPanel`, `BatchErrorPanel`. All presentational: props in, callbacks out, no own state.

SEO use-case pages (static, CTA to `/#tool`):

- `/white-background/` — pure white JPG / Amazon intent
- `/batch-remove-background/` — multi-image + ZIP intent

Deploy ops: `docs/deploy-checklist.md`.

## Environment variables

Required in Cloudflare Pages (preview + production):

- `CLIPDROP_API_KEY` — preferred image provider
- `REMOVE_BG_API_KEY` — fallback if Clipdrop unset
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth
- `AUTH_SECRET` — HMAC key for session cookies (rotating it invalidates all sessions)
- D1 binding `DB` pointing at the `bg-remover-db` database

Cost controls:

- `DAILY_UPSTREAM_LIMIT` — max claimed removals per UTC day. **Set it in production**: `0`/omit
  means no global ceiling, and `remove_bg_ok` logs then carry `dailyBudget.enforced=false` so the
  gap is alertable. It is not fail-closed on purpose — a forgotten var must not take the site down.
- `UPSTREAM_COST_USD` — estimated USD per image for structured logs (default `0.04`)

Rate-limit constants: `shared/rate-limit.js`. Batch UI paces by `BATCH_MIN_GAP_MS` and retries on `Retry-After`.

Local dev uses `.env.local` (see `.env.example`). `pnpm pages:env:update` (script at `scripts/update-cloudflare-env.sh`) does a **merge-update** of the Pages project config via Cloudflare API — it reads the current config first so other env vars are preserved. Requires `jq` and `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

## Conventions

- Functions code is plain JavaScript ESM (`.js`), not TypeScript. The frontend is TypeScript. Don't introduce TS into `functions/` — the Pages Functions build path expects `.js`.
- Money values are stored as TEXT in D1 (`amount_usd TEXT`) to avoid float drift.
- All timestamps in D1 are ISO 8601 strings in UTC.
- Image responses set `Cache-Control: no-store` and `Access-Control-Allow-Origin: *`.
- When the `__bg_gid` cookie is newly minted, the `Set-Cookie` header must be attached to the *same* response that consumed the guest quota (see the manual `Response` construction in `remove-bg.js` and `quota.js`).
