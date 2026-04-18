# Base Predict

> Daily creator coin prediction game on Base (Coinbase L2). Pick the coin that pumps the most in 24 hours, build streaks, and climb the leaderboard.

---

## How The App Works

Every day at 00:00 UTC, 3 random Base creator coins are selected. Users sign in with their wallet, pick which coin they think will pump the most in 24 hours, and wait. At midnight UTC the results are resolved — the coin with the highest % gain wins. Correct picks earn 100 points + streak bonuses. Miss = streak resets.

**Points System:**
- Correct prediction: 100 base points
- Streak bonus: +10 per consecutive correct day (max +100 bonus)
- Wrong prediction: 0 points, streak resets to 0
- Example: 5-day streak + correct = 100 + 50 = 150 points

---

## Full Setup Guide (Step by Step)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A GitHub account
- A [Vercel](https://vercel.com) account (free, sign up with GitHub)
- A [Supabase](https://supabase.com) account (free tier works)
- An [Upstash](https://upstash.com) account (free tier works)

---

### Step 1: Supabase Setup (Database)

1. Go to [supabase.com](https://supabase.com) → Sign up / Log in
2. Click **"New Project"**
3. Choose a name (e.g., `base-predict`), set a database password, pick a region close to you
4. Wait ~2 minutes for the project to be created
5. Go to **SQL Editor** (left sidebar)
6. Paste the entire contents of `supabase/schema.sql` into the editor
7. Click **"Run"** — you should see "Success. No rows returned"
8. Now go to **Settings → API** (left sidebar → bottom)
9. Copy these 3 values:

| What to copy | Env variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **Never share** the `service_role` key publicly. It bypasses Row Level Security.

---

### Step 2: Upstash Setup (Redis Cache + Rate Limiting)

1. Go to [upstash.com](https://upstash.com) → Sign up / Log in
2. Click **"Create Database"**
3. Name it (e.g., `base-predict-cache`), pick a region, select **"Free" plan**
4. After creation, you'll see the database details page
5. Copy these 2 values:

| What to copy | Env variable |
|---|---|
| REST URL (`https://...upstash.io`) | `UPSTASH_REDIS_REST_URL` |
| REST Token | `UPSTASH_REDIS_REST_TOKEN` |

---

### Step 3: Generate Secrets

Open your terminal and run:

```bash
# Session encryption key
openssl rand -hex 32
# Copy the output → SESSION_SECRET

# Cron job authentication key
openssl rand -hex 32
# Copy the output → CRON_SECRET
```

If you don't have `openssl`, use any random 64-character hex string, or go to [generate-random.org/api-key-generator](https://generate-random.org/api-key-generator).

---

### Step 4: Local Development

```bash
# Unzip the project
unzip base-predict.zip
cd base-predict

# Install dependencies
npm install

# Create your env file
cp .env.example .env.local
```

Now open `.env.local` in any text editor and fill in all 7 values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
UPSTASH_REDIS_REST_URL=https://us1-something.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXk3AAIj...
SESSION_SECRET=your64charhexstringhere...
CRON_SECRET=another64charhexstringhere...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Base Predict
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the app but no coins yet.

---

### Step 5: Seed Today's Coins (First Run)

The app needs coins for today. Run this in a new terminal:

```bash
curl -X POST http://localhost:3000/api/resolve \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

Replace `YOUR_CRON_SECRET_HERE` with the actual CRON_SECRET from your `.env.local`.

You should get a response like:
```json
{
  "ok": true,
  "results": [
    "No coins found for yesterday — skipping resolve",
    "Set today's coins: DEGEN, HIGHER, BRETT",
    "Cache invalidated"
  ]
}
```

Refresh the app — 3 coins should now appear!

---

### Step 6: Push to GitHub

```bash
cd base-predict
git init
git add .
git commit -m "Base Predict MVP"
```

Go to [github.com/new](https://github.com/new) → create a new repository called `base-predict` (don't add README/gitignore, keep it empty).

```bash
git remote add origin https://github.com/YOUR_USERNAME/base-predict.git
git branch -M main
git push -u origin main
```

---

### Step 7: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Log in with GitHub
2. Click **"Add New" → "Project"**
3. Find and select your `base-predict` repo → click **"Import"**
4. Vercel will auto-detect **Next.js** as the framework
5. Expand **"Environment Variables"** section
6. Add all 7 variables one by one:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `UPSTASH_REDIS_REST_URL` | Your Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash REST token |
| `SESSION_SECRET` | Your 64-char hex secret |
| `CRON_SECRET` | Your 64-char hex secret |

7. Also add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.vercel.app` (update after first deploy) |
| `NEXT_PUBLIC_APP_NAME` | `Base Predict` |

8. Click **"Deploy"** — wait 1-2 minutes
9. Vercel gives you a URL like `base-predict-xyz.vercel.app` — this is your live app!

---

### Step 8: Seed Production Coins

After deploy, seed the first day's coins on production:

```bash
curl -X POST https://base-predict-xyz.vercel.app/api/resolve \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

Replace the URL with your actual Vercel URL.

---

### Step 9: Setup Daily Cron Job

The `vercel.json` file is already included in the project with:

```json
{
  "crons": [
    {
      "path": "/api/resolve",
      "schedule": "1 0 * * *"
    }
  ]
}
```

This runs automatically every day at 00:01 UTC. But Vercel Cron sends the `Authorization: Bearer <CRON_SECRET>` header automatically **only on Pro plan**.

**Free plan workaround:** Use [cron-job.org](https://cron-job.org) (free):

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL:** `https://your-app.vercel.app/api/resolve`
   - **Method:** POST
   - **Schedule:** Every day at 00:01 UTC
   - **Headers:** Add `Authorization` = `Bearer YOUR_CRON_SECRET`
3. Save and enable

Now every day at midnight UTC, yesterday's results resolve and today's 3 new coins are selected automatically.

---

### Step 10 (Optional): Custom Domain

1. In Vercel → your project → **Settings → Domains**
2. Add your domain (e.g., `basepredict.xyz`)
3. Update DNS records as Vercel instructs
4. Update `NEXT_PUBLIC_APP_URL` env var to your custom domain

---

### Step 11 (Optional): Register on Base App

1. Go to [base.dev](https://base.dev)
2. Create a new project
3. Set primary URL to your Vercel/custom domain
4. Fill in metadata:
   - **Name:** Base Predict
   - **Description:** Daily creator coin prediction game on Base
   - **Category:** Games
5. Submit for review

No Farcaster SDK needed — this is a standard web app.

---

## Adding More Creator Coins

Open `lib/coins.ts` and add entries to the `CANDIDATES` array:

```typescript
{
  address: "0x...",             // Token contract address on Base
  symbol: "TICKER",            // e.g., "DEGEN"
  name: "Full Token Name",     // e.g., "Degen"
  imageUrl: "https://...",     // Token logo URL
}
```

**How to find coin info:**
1. Go to [dexscreener.com](https://dexscreener.com)
2. Search the token name, filter to Base chain
3. Copy the contract address from the URL
4. For image: `https://dd.dexscreener.com/ds-data/tokens/base/CONTRACT_ADDRESS.png`

After adding coins, push to GitHub → Vercel auto-deploys.

---

## Project Structure

```
base-predict/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   ├── page.tsx                # Home: hero + 3 coin cards + countdown
│   ├── globals.css             # Fonts, noise texture, design tokens
│   ├── providers.tsx           # Wagmi + React Query providers
│   ├── leaderboard/page.tsx    # Top 100 leaderboard table
│   ├── profile/page.tsx        # User stats, streak, history dots
│   └── api/
│       ├── auth/nonce/route.ts     # Generate SIWE nonce
│       ├── auth/verify/route.ts    # Verify SIWE signature
│       ├── today/route.ts          # Today's 3 coins + live prices
│       ├── predict/route.ts        # Submit prediction
│       ├── leaderboard/route.ts    # Top 100 users
│       ├── profile/route.ts        # User stats + history
│       └── resolve/route.ts        # Cron: resolve yesterday + setup today
├── components/
│   ├── Header.tsx              # Logo, nav, sign-in, streak badge
│   ├── SignInButton.tsx        # Wallet connect + SIWE auth flow
│   ├── CoinCard.tsx            # Coin display + pick button
│   ├── CountdownTimer.tsx      # Live countdown to midnight UTC
│   ├── StreakBadge.tsx         # Flame icon + streak number
│   ├── LeaderboardTable.tsx    # Ranked table with top-3 styling
│   └── PriceTicker.tsx         # Marquee scroll of coin prices
├── lib/
│   ├── wagmi.ts               # Base chain wallet config
│   ├── supabase.ts            # Database clients + TypeScript types
│   ├── redis.ts               # Cache helpers + rate limiters
│   ├── dexscreener.ts         # Price fetching from DexScreener API
│   ├── session.ts             # Iron-session + date utilities
│   └── coins.ts               # Candidate coins list (edit this!)
├── supabase/
│   └── schema.sql             # Database tables + indexes + RLS
├── package.json
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── vercel.json                # Cron schedule config
├── .env.example               # Template for environment variables
└── .gitignore
```

---

## Architecture Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 App Router + React | Pages, SSR, client components |
| Styling | Tailwind CSS 3.4 | Custom dark design system |
| Auth | SIWE + iron-session | Wallet-based sign in |
| Wallet | wagmi 2 + viem 2 | Base chain connection |
| Database | Supabase (PostgreSQL) | Users, predictions, daily coins |
| Cache | Upstash Redis | Response caching + rate limiting |
| Prices | DexScreener Public API | Live token prices (free, no key) |
| Deploy | Vercel | Hosting + serverless + cron |

---

## Cache and Rate Limit Strategy

**Cache (Redis):**

| Cache Key | TTL | Invalidated By |
|-----------|-----|----------------|
| `today` | 60 sec | `/api/resolve` and `/api/predict` |
| `leaderboard:top100` | 60 sec | `/api/resolve` |
| `profile:{address}` | 30 sec | `/api/predict` |

Every read endpoint checks Redis first → only hits Supabase on cache miss.

**Rate Limits:**

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /api/predict` | 5 per minute | Per wallet address |
| All `GET` endpoints | 60 per minute | Per IP address |
| `POST /api/resolve` | Bearer token only | CRON_SECRET |

---

## Troubleshooting

**"No coins set for today"**
→ Run the resolve endpoint manually (Step 5 or 8 above)

**Wallet won't connect**
→ Make sure you're using a browser with MetaMask or another injected wallet. Inside Base App's in-app browser it should work automatically.

**"Rate limited" error**
→ Wait 1 minute and try again. The predict endpoint allows 5 requests per minute per wallet.

**Coins show price "—"**
→ DexScreener might be slow. Prices auto-refresh every 30 seconds. Some very new/small coins may not have DexScreener data.

**Build fails on Vercel**
→ Double-check all 7 environment variables are set correctly. The most common issue is a missing or incorrect Supabase URL.

**Cron not running**
→ Vercel free plan: use [cron-job.org](https://cron-job.org) as described in Step 9. Make sure the Authorization header is set correctly.

---

## Tech Stack (Exact Versions)

- Next.js 14.2.15 (App Router + TypeScript strict)
- Tailwind CSS 3.4
- wagmi 2.12 + viem 2.21
- @tanstack/react-query 5.56
- siwe 2.3 (Sign-In with Ethereum)
- @supabase/supabase-js 2.45
- @upstash/redis 1.34 + @upstash/ratelimit 2.0
- iron-session 8.0
- lucide-react (icons)

---

## License

MIT — do whatever you want with it.
