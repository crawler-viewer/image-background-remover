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

There is no lint, test, or typecheck script. Type errors surface at `pnpm build` time (Next.js runs `tsc`). When changing code, run `pnpm build` to verify.

CI (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`; there is no separate test job.

## Architecture

This is a Next.js 16 App Router app **statically exported** to Cloudflare Pages, with all server logic implemented as **Cloudflare Pages Functions** (Workers runtime) under `functions/api/*`. There is no Node server at runtime — Next.js produces `out/` and `functions/` is deployed alongside it.

Key consequence: anything dynamic (auth, quota, image processing, payments) must live in `functions/api/*.js` and use Workers-compatible APIs (`fetch`, `crypto.subtle`, `env.DB`). Do **not** put server logic in Next route handlers — `output: "export"` in `next.config.ts` disables them.

### Request flow for `/api/remove-bg`

`functions/api/remove-bg.js` orchestrates a single chain that mixes concerns (identity → plan resolution → quota check → file validation → upstream call → usage recording). Touch points:

1. `readSession` (`functions/api/auth/_lib.js`) — verifies HMAC-signed `bg_session` cookie using `AUTH_SECRET`.
2. `getUserWithSession` (`functions/api/auth/db.js`) — loads the D1 `users` row.
3. Plan resolution + expiry downgrade — if `plan_expires_at` is past, the user is downgraded to `free` in-place.
4. Monthly quota — `assertMonthlyLimit` / `assertGuestMonthlyLimit` in `functions/api/usage.js` count rows in `usage_logs` / `guest_usage_logs` for the current UTC month.
5. Credit fallback — when a logged-in user exceeds quota, `user_credits.balance` is checked; if positive, the request proceeds and 1 credit is deducted on success.
6. Upstream — **Clipdrop is preferred when `CLIPDROP_API_KEY` is set; otherwise falls back to Remove.bg via `REMOVE_BG_API_KEY`**. The README only mentions Remove.bg but the live code prefers Clipdrop.
7. Usage row inserted on success only.

`functions/api/quota.js` mirrors steps 1–5 (read-only) and is what the frontend polls.

### Plan config

`functions/api/plan-config.js` is the **source of truth** for backend limits (monthly removals + max upload size for `guest`/`free`/`pro`/`business`). `src/lib/pricing.ts` holds the marketing/UI version of the same plans — keep these in sync when limits change.

Note: the backend enforces **monthly** quotas (`monthRange()` uses UTC month start/end). The account UI historically used "daily" naming; treat the backend as authoritative.

### Guest identity

Guests get a UUID in the `__bg_gid` cookie (`guestCookieString`, 1-year, HttpOnly, Secure, SameSite=Lax). The cookie is the primary key in `guest_usage_logs` (5 removals/month).

Anti-abuse: successful guest removals also write a second row with `guest_key = ip:<cf-connecting-ip>`. `assertGuestAccess` enforces cookie limit **and** IP soft ceiling (`GUEST_IP_MONTHLY_LIMIT = 15` per UTC month). Clearing cookies cannot exceed the IP ceiling.

Short-window rate limit: `assertRateLimit` writes to D1 `rate_limit_logs` (**12 POSTs / IP / 60s** on `/api/remove-bg`). Fails open if the table is missing. See `docs/rate-limiting.md` for Cloudflare WAF setup.

### Auth

Google OAuth flow lives in `functions/api/auth/google/` (login, callback). Session is a **stateless HMAC-signed cookie** (`bg_session`, 7-day TTL) — there is no server-side session store. Logout just clears the cookie. The `users` row is upserted on each callback.

### Database (Cloudflare D1)

Binding name is `DB`. Schema is `db/schema.sql`. Tables: `users`, `usage_logs`, `guest_usage_logs`, `payment_orders`, `user_credits`. Apply with:

```bash
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

The schema file is the migration — there is no migrations directory. Add new tables/columns idempotently (`CREATE TABLE IF NOT EXISTS`, etc.) and re-run.

### Payments

`functions/api/payment/` contains PayPal checkout and webhook handling, persisting to `payment_orders` and crediting `user_credits` (credit packs) or updating `users.plan` + `plan_expires_at` (subscriptions). The frontend entry point is `/credits` and `/pricing`.

### Frontend

`src/app/` is App Router with `output: "export"` — every route must be statically renderable (no `dynamic = "force-dynamic"`, no server actions, no Node runtime APIs at request time). Dynamic data is fetched client-side from `/api/*`.

Main interactive component is `src/components/BgRemover.tsx`, a state-machine (`idle | processing | done | error`) that posts a `FormData` blob to `/api/remove-bg` and renders a before/after slider. Supports multi-file batch (up to 20) and ZIP download via `fflate`.

SEO use-case pages (static, CTA to `/#tool`):

- `/white-background/` — pure white JPG / Amazon intent
- `/batch-remove-background/` — multi-image + ZIP intent

Deploy ops: `docs/deploy-checklist.md`.

## Environment variables

Required in Cloudflare Pages (preview + production):

- `REMOVE_BG_API_KEY` — fallback image provider
- `CLIPDROP_API_KEY` — preferred image provider (optional; falls back to Remove.bg if absent)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth
- `AUTH_SECRET` — HMAC key for session cookies (rotating it invalidates all sessions)
- D1 binding `DB` pointing at the `bg-remover-db` database

Local dev uses `.env.local` (same keys minus `CLIPDROP_API_KEY` per `.env.example`). `pnpm pages:env:update` (script at `scripts/update-cloudflare-env.sh`) does a **merge-update** of the Pages project config via Cloudflare API — it reads the current config first so other env vars are preserved. Requires `jq` and `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

## Conventions

- Functions code is plain JavaScript ESM (`.js`), not TypeScript. The frontend is TypeScript. Don't introduce TS into `functions/` — the Pages Functions build path expects `.js`.
- Money values are stored as TEXT in D1 (`amount_usd TEXT`) to avoid float drift.
- All timestamps in D1 are ISO 8601 strings in UTC.
- Image responses set `Cache-Control: no-store` and `Access-Control-Allow-Origin: *`.
- When the `__bg_gid` cookie is newly minted, the `Set-Cookie` header must be attached to the *same* response that consumed the guest quota (see the manual `Response` construction in `remove-bg.js` and `quota.js`).
