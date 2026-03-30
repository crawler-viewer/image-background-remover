# Image Background Remover

AI-powered background removal tool built with Next.js and deployed on Cloudflare Pages.

## Live Site

- `https://image-background-remover-bbk.pages.dev/`

## Tech Stack

- **Framework:** Next.js (App Router, static export)
- **Styling:** Tailwind CSS v4
- **Image API:** Remove.bg
- **Auth:** Google OAuth via Cloudflare Pages Functions
- **Hosting:** Cloudflare Pages

## Environment Variables

Create `.env.local` for local development:

```bash
REMOVE_BG_API_KEY=your_remove_bg_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=replace_with_a_long_random_secret
```

In Cloudflare Pages, set the same variables in:
`Settings -> Environment variables`

## Development

```bash
pnpm install
pnpm dev
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

## Automate Cloudflare Environment Variables

You can update Google OAuth variables for both `preview` and `production` via API:

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_token \
CLOUDFLARE_ACCOUNT_ID=your_account_id \
GOOGLE_CLIENT_ID=your_google_client_id \
GOOGLE_CLIENT_SECRET=your_google_client_secret \
AUTH_SECRET=your_random_auth_secret \
REMOVE_BG_API_KEY=your_remove_bg_api_key \
pnpm pages:env:update
```

This script reads the current Pages project config first, then merge-updates env vars to avoid overwriting the rest of the project configuration.

## Google OAuth Configuration

Set these in Google Cloud Console:

- **Authorized JavaScript origins**
  - `https://picturebackgroundremover.xyz`
  - `https://image-background-remover-bbk.pages.dev`
- **Authorized redirect URIs**
  - `https://picturebackgroundremover.xyz/api/auth/google/callback`
  - `https://image-background-remover-bbk.pages.dev/api/auth/google/callback`

## D1 Database

Create a D1 database and bind it to Pages as `DB`, then initialize schema:

```bash
npx wrangler d1 create bg-remover-db
npx wrangler d1 execute bg-remover-db --remote --file=db/schema.sql
```

## Features

- Drag & drop image upload
- AI background removal via Remove.bg
- Before/after comparison slider
- One-click transparent PNG download
- Google login with secure HttpOnly session cookie
- D1-backed user storage
- Personal account center with profile, quota, and recent activity
- Guest / Free / Pro plan rules with different daily limits and file sizes
- Daily usage limit enforcement
- SEO optimized (structured data, meta tags)
- Mobile responsive
- Dark theme UI
