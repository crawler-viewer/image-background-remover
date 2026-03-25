# Image Background Remover

AI-powered background removal tool built with Next.js, deployed on Cloudflare Pages.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **API:** Remove.bg
- **Hosting:** Cloudflare Pages

## Setup

```bash
npm install
```

Create `.env.local`:

```
REMOVE_BG_API_KEY=your_api_key_here
```

## Development

```bash
npm run dev
```

## Deploy to Cloudflare Pages

```bash
npm run pages:deploy
```

Set `REMOVE_BG_API_KEY` as an environment variable in Cloudflare Pages dashboard:
Settings → Environment variables → Add variable.

## Features

- Drag & drop image upload
- AI background removal via Remove.bg
- Before/after comparison slider
- One-click transparent PNG download
- SEO optimized (structured data, meta tags)
- Mobile responsive
- Dark theme UI
