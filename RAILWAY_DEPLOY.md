# Railway Deployment Guide — Beagvs Global

## Overview

This guide walks you through deploying the full Beagvs Global app to Railway from scratch.

---

## Step 1 — Push Code to GitHub

Railway deploys from a GitHub repository.

1. Create a new repo on GitHub (or use an existing one)
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/YOUR_USER/beagvs-global.git
   git push -u origin main
   ```

---

## Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect it as a Node.js project

---

## Step 3 — Add a PostgreSQL Database

1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway creates the database and automatically injects **`DATABASE_URL`** into your project

> **No manual connection string needed** — Railway links the database automatically.

---

## Step 4 — Set Environment Variables

In the Railway dashboard → your service → **Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | *(auto-set by Railway when you add PostgreSQL)* | Already set |
| `SESSION_SECRET` | A long random string (64+ chars) | **Required** |
| `NODE_ENV` | `production` | **Required** |
| `ADMIN_EMAIL` | `admin@beagvsglobal.com` | Used by seed script |
| `ADMIN_PASSWORD` | Your chosen admin password | Used by seed script |
| `ADMIN_USERNAME` | `beagvsadmin` | Used by seed script |

### Generate SESSION_SECRET

Run this in your terminal and paste the result:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Optional — File Uploads (KYC / Documents)

Only needed if you want KYC document uploads to work on Railway. Skip for now if not needed.

| Variable | Value |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCS service account JSON |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Your GCS bucket name |
| `PRIVATE_OBJECT_DIR` | `/your-bucket/private` |
| `PUBLIC_OBJECT_SEARCH_PATHS` | `/your-bucket/public` |

---

## Step 5 — Apply the Database Schema

The schema must be applied to Railway's PostgreSQL before the app can start.

### Option A — Use Railway's Deploy Hook (Recommended)

In Railway → your service → **Settings** → **Deploy** → **Custom Start Command**:
```
npm run db:push && npm start
```

This applies schema changes automatically on every deploy.

### Option B — Apply Once via CLI

Install the Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link   # link to your project
railway run npx drizzle-kit push
```

---

## Step 6 — Deploy

Railway auto-deploys on every push to your GitHub repo. For a manual deploy:
1. Railway dashboard → **Deploy** button
2. Or: `railway up` from the CLI

The build command (`npm run build`) and start command (`npm start`) are defined in `railway.json`.

---

## Step 7 — Seed the Database

After the first successful deploy, seed the admin user and default data:

```bash
railway run npx tsx server/seed-railway.ts
```

Or with custom credentials:
```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourSecurePass railway run npx tsx server/seed-railway.ts
```

**Admin login after seeding:**
- URL: `https://your-app.up.railway.app`
- Navigate to `/auth` to log in
- Use the email/password you set in `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- The app will prompt you to change your password on first login

---

## Step 8 — Verify

Visit `https://your-app.up.railway.app/api/health` — should return:
```json
{ "status": "ok", "timestamp": "..." }
```

---

## Database Reference

The full schema is in `migrations/0000_free_jasper_sitwell.sql`.

### Tables

| Table | Purpose |
|---|---|
| `sessions` | Express session storage |
| `users` | All user accounts (custom auth + Replit OIDC) |
| `wallets` | User crypto wallet addresses |
| `listings` | Marketplace listings (real estate, shipping, products) |
| `escrows` | Transaction escrow records |
| `reviews` | Listing reviews |
| `follows` | User follow relationships |
| `chat_threads` | Direct message threads |
| `messages` | Chat messages |
| `notifications` | In-app notifications |
| `blog_posts` | Blog content |
| `platform_wallets` | Platform's own wallet addresses |
| `payment_methods` | Admin-configured payment methods |
| `platform_settings` | Key-value store for app settings & page content |
| `shipments` | Shipment records |
| `shipment_events` | Shipment tracking history |
| `kyc_verifications` | KYC verification requests |
| `kyc_documents` | KYC document uploads |
| `facial_verifications` | KYC facial verification data |

### Enums Used

| Enum | Values |
|---|---|
| `user_role` | `USER`, `ADMIN` |
| `account_type` | `BUYER`, `SELLER`, `BOTH` |
| `wallet_type` | `PI`, `USDT_TRON`, `USDT_TON`, `USDT_BNB`, `USDT_SOL`, `USDT_AVAX` |
| `listing_type` | `REAL_ESTATE`, `SHIPPING_SERVICE`, `PRODUCT`, `SERVICE` |
| `currency` | `PI`, `USDT`, `USD`, `NGN`, `EUR`, `GBP`, `CAD` |
| `network` | `PI_MAINNET`, `TRON`, `TON`, `BNB`, `SOL`, `AVAX`, `BANK_TRANSFER` |
| `escrow_status` | `CREATED`, `FUNDED`, `SHIPPED`, `DELIVERED`, `DISPUTED`, `RELEASED`, `REFUNDED` |
| `kyc_status` | `NOT_STARTED`, `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED` |

---

## Important Notes

### What Works on Railway Without Changes
- ✅ Full marketplace (listings, escrows, products, real estate)
- ✅ Email/password registration and login
- ✅ Admin panel (all sections)
- ✅ Shipment tracking
- ✅ Blog system
- ✅ Chat / messaging
- ✅ Page content management
- ✅ Payment method management

### What Needs Extra Setup on Railway
- ⚠️ **KYC document uploads** — requires a GCS bucket (set `GOOGLE_APPLICATION_CREDENTIALS` etc.)
- ℹ️ **Replit OAuth login** — disabled on Railway (users must use email/password instead)

### Re-seeding Admin Password

If you lose admin access:
```bash
ADMIN_EMAIL=admin@beagvsglobal.com ADMIN_PASSWORD=NewPass123! railway run npx tsx server/seed-railway.ts
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| App crashes with `SESSION_SECRET must be set` | Add `SESSION_SECRET` to Railway env vars |
| App crashes with `DATABASE_URL must be set` | Add PostgreSQL service to your Railway project |
| `relation "sessions" does not exist` | Run `npm run db:push` to apply schema |
| 500 errors on file uploads | KYC uploads need GCS config (optional feature) |
| `/api/health` returns 404 | Old deploy — trigger a redeploy |
