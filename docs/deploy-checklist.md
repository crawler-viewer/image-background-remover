# Production deploy checklist

Use this after shipping product changes (batch, ZIP, rate limits, GA4, plan limits).

## 0. Pre-flight (local)

```bash
pnpm install
pnpm build
```

- [ ] `pnpm build` succeeds (TypeScript + static export to `out/`)
- [ ] No secrets committed (`.env`, `.env.local` not in git)
- [ ] Plan copy matches backend: Guest 5 · Free 20 · Pro 200 · Business **500**

## 1. D1 schema (remote)

Idempotent — safe to re-run:

```bash
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

Confirm tables exist (especially new ones):

| Table | Purpose |
|-------|---------|
| `users` | Google accounts + plan |
| `usage_logs` | Logged-in monthly quota |
| `guest_usage_logs` | Guest cookie + `ip:` buckets |
| `payment_orders` | PayPal orders |
| `user_credits` | Credit packs |
| `rate_limit_logs` | 12 req / IP / 60s |

- [ ] Remote execute finished without error
- [ ] Spot-check: `SELECT name FROM sqlite_master WHERE type='table';` via wrangler if needed

## 2. Cloudflare Pages environment variables

Set for **Production** (and Preview if you test OAuth there).

| Variable | Required | Notes |
|----------|----------|--------|
| `CLIPDROP_API_KEY` | Preferred | Primary remove-bg provider |
| `REMOVE_BG_API_KEY` | Fallback | Used if Clipdrop unset |
| `GOOGLE_CLIENT_ID` | Yes | OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth |
| `AUTH_SECRET` | Yes | HMAC sessions; rotating logs everyone out |
| `SITE_URL` | Yes | `https://picturebackgroundremover.xyz` (PayPal return URLs) |
| `PAYPAL_CLIENT_ID` | If payments | Live app |
| `PAYPAL_CLIENT_SECRET` | If payments | Live app |
| `PAYPAL_SANDBOX` | If payments | Must be **`false`** for live |
| `PAYPAL_WEBHOOK_ID` | Recommended | Signature verify |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Recommended | **Must be present at build time** for static export |
| `NEXT_PUBLIC_SITE_ENV` | Recommended | `production` → allow indexing |

Binding:

- [ ] D1 binding name **`DB`** → `bg-remover-db`

Optional merge update:

```bash
# See scripts/update-cloudflare-env.sh — extend if you add keys there
pnpm pages:env:update
```

## 3. Build with production public env

Static export bakes `NEXT_PUBLIC_*` at **build** time:

```bash
export NEXT_PUBLIC_SITE_ENV=production
export NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # your real ID
pnpm build
pnpm pages:deploy
```

- [ ] Built with production GA ID (or intentionally empty for no analytics)
- [ ] Deploy project: `image-background-remover-git`
- [ ] Custom domain: `picturebackgroundremover.xyz` points at production

## 4. Google OAuth

Google Cloud Console → OAuth client:

- [ ] Authorized JS origin: `https://picturebackgroundremover.xyz`
- [ ] Redirect: `https://picturebackgroundremover.xyz/api/auth/google/callback`
- [ ] Optional: Pages preview origin/callback if you test there

Smoke:

- [ ] Sign in → lands back on site with session
- [ ] `/api/auth/me` or Account shows profile

## 5. PayPal (if selling)

- [ ] Live credentials (not sandbox) when `PAYPAL_SANDBOX=false`
- [ ] Webhook URL: `https://picturebackgroundremover.xyz/api/payment/paypal/webhook`
- [ ] Events: at least `PAYMENT.CAPTURE.COMPLETED` (and approve if you use them)
- [ ] `PAYPAL_WEBHOOK_ID` set
- [ ] Test: $1-ish credit pack or sandbox first, then live small amount
- [ ] Capture redirect → `/account?payment=success` and plan/credits updated

## 6. Rate limiting

App layer (automatic after schema + deploy):

- [ ] Burst >12 POSTs/min to `/api/remove-bg` → JSON `code: "RATE_LIMITED"`

Cloudflare WAF (manual — see `docs/rate-limiting.md`):

- [ ] Rule: POST `/api/remove-bg`, 20/min/IP, Block or Managed Challenge
- [ ] Bot Fight Mode on (optional, free)

## 7. Product smoke tests (production)

| Test | Expected |
|------|----------|
| Guest single remove | PNG + white JPG download work |
| Guest 6th remove same cookie | 429 monthly guest limit |
| Clear cookie, same IP, many guests | Stop around IP monthly 15 |
| Batch 3 images | Queue finishes; ZIP PNG + ZIP white work |
| Login free user | Quota shows 20/mo |
| Limit CTA | Sign in / credits / pricing links work |
| `/white-background/` | Indexes intent page → CTA to `/#tool` |
| `/batch-remove-background/` | Same |
| `/pricing/` Business | Shows **500**/mo |

## 8. SEO / Search Console

- [ ] `https://picturebackgroundremover.xyz/robots.txt` allows `/`, disallows `/api/`, `/account`
- [ ] Sitemap includes new use-case URLs
- [ ] Search Console property for production domain
- [ ] Submit `sitemap.xml`
- [ ] Preview host `*.pages.dev` remains noindex if `NEXT_PUBLIC_SITE_ENV` ≠ production

## 9. Analytics

- [ ] GA4 DebugView or Realtime: page views on home
- [ ] Events after one successful remove: `remove_start`, `remove_success`, `download`
- [ ] Batch: `batch_start`, `batch_complete`, `batch_download`

## 10. Rollback notes

| Issue | Action |
|-------|--------|
| Bad frontend | Redeploy previous Pages deployment (Dashboard → Deployments) |
| Bad Functions only | Redeploy last good `out/` + functions tree |
| Auth broken | Check `AUTH_SECRET` / Google redirect URIs |
| Everyone rate-limited | Check `rate_limit_logs` growth; raise limit or fix shared NAT; CF rule too tight |
| API costs spike | Confirm Clipdrop key; tighten CF rule; check guest IP abuse |

## Quick command card

```bash
# Schema
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql

# Production build + deploy
NEXT_PUBLIC_SITE_ENV=production \
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
pnpm build && pnpm pages:deploy
```

Related docs: `docs/rate-limiting.md`, `docs/pricing-strategy.md`, `CLAUDE.md`.
