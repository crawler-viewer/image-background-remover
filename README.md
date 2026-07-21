# Image Background Remover

AI-powered background removal tool built with Next.js and deployed on Cloudflare Pages.

## Live Site

- `https://image-background-remover-git.pages.dev/`

## Tech Stack

- **Framework:** Next.js (App Router, static export)
- **Styling:** Tailwind CSS v4
- **Image API:** **Clipdrop** (preferred when `CLIPDROP_API_KEY` is set); falls back to **Remove.bg** via `REMOVE_BG_API_KEY`
- **Auth:** Google OAuth via Cloudflare Pages Functions
- **Hosting:** Cloudflare Pages + D1 + Pages Functions
- **Payments:** PayPal one-time checkout (prepaid plans + credit packs)

## Environment Variables

Create `.env.local` for local development:

```bash
# Image providers (at least one required in production)
CLIPDROP_API_KEY=your_clipdrop_api_key
REMOVE_BG_API_KEY=your_remove_bg_api_key

# Google OAuth + session HMAC
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=replace_with_a_long_random_secret

# Optional: global UTC-day cap on claimed removals (0 or omit = disabled)
# DAILY_UPSTREAM_LIMIT=2000
# Optional: USD estimate per image for structured logs (default 0.04)
# UPSTREAM_COST_USD=0.04

# Optional: GA4
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

In Cloudflare Pages, set the same variables in  
`Settings -> Environment variables` (preview + production).  
Also bind D1 as `DB`.

## Development

```bash
pnpm install
pnpm dev          # Next.js only (API needs preview or deployed Functions)
pnpm test         # unit tests (plan limits, payments, rate-limit helpers)
pnpm build        # static export to ./out
pnpm preview      # wrangler pages dev out (Functions + static)
```

## Deploy to Cloudflare Pages

```bash
pnpm install
pnpm build
pnpm pages:deploy
```

This deploys:

- static files from `out`
- Pages Functions from `functions/`

Full production checklist (D1 schema, env, PayPal, rate limits, SEO smoke tests):  
see **`docs/deploy-checklist.md`**. Rate limit ops: **`docs/rate-limiting.md`**.

## Automate Cloudflare Environment Variables

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_token \
CLOUDFLARE_ACCOUNT_ID=your_account_id \
GOOGLE_CLIENT_ID=your_google_client_id \
GOOGLE_CLIENT_SECRET=your_google_client_secret \
AUTH_SECRET=your_random_auth_secret \
REMOVE_BG_API_KEY=your_remove_bg_api_key \
CLIPDROP_API_KEY=your_clipdrop_api_key \
pnpm pages:env:update
```

This script reads the current Pages project config first, then merge-updates env vars to avoid overwriting the rest of the project configuration.

## Google OAuth Configuration

Set these in Google Cloud Console:

- **Authorized JavaScript origins**
  - `https://picturebackgroundremover.xyz`
  - `https://image-background-remover-git.pages.dev`
- **Authorized redirect URIs**
  - `https://picturebackgroundremover.xyz/api/auth/google/callback`
  - `https://image-background-remover-git.pages.dev/api/auth/google/callback`

## D1 Database

Create a D1 database and bind it to Pages as `DB`, then initialize schema:

```bash
npx wrangler d1 create bg-remover-db
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

## Plan limits (single source of truth)

Monthly removals, max upload size, batch cap, and guest IP ceiling live in:

**`shared/plan-limits.js`**

Backend (`functions/api/plan-config.js`) and frontend (`src/lib/pricing.ts`) both import from there.  
Product prices / SKUs: **`shared/products.js`**.

## Features

- Drag & drop image upload
- AI background removal (Clipdrop preferred, Remove.bg fallback)
- Before/after comparison slider
- Transparent PNG + pure white (RGB 255) JPG export for marketplaces
- Batch upload (up to 20 images) with ZIP download; client paces jobs under IP rate limit
- Google login with secure HttpOnly session cookie
- D1-backed user storage, quota, credits
- Guest / Free / Pro / Business monthly limits
- Guest IP monthly cap + short-window rate limit (see `docs/rate-limiting.md`)
- Optional `DAILY_UPSTREAM_LIMIT` spend guard
- SEO optimized (structured data, meta tags)
- Mobile responsive
