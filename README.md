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
npm install
npm run dev
```

## Deploy to Cloudflare Pages

```bash
npm install
npm run build
npm run pages:deploy
```

This deploys:
- static files from `out`
- Pages Functions from `functions/`

## Google OAuth Configuration

Set these in Google Cloud Console:

- **Authorized JavaScript origins**
  - `https://image-background-remover-bbk.pages.dev`
- **Authorized redirect URIs**
  - `https://image-background-remover-bbk.pages.dev/api/auth/google/callback`

## Features

- Drag & drop image upload
- AI background removal via Remove.bg
- Before/after comparison slider
- One-click transparent PNG download
- Google login with secure HttpOnly session cookie
- SEO optimized (structured data, meta tags)
- Mobile responsive
- Dark theme UI
