# Human Pulse Commerce — Production Setup Guide

All Phase 2 code is committed and pushed to `master` (commit `75b4975`).
Follow these 4 steps to complete the production deployment.

---

## Step 1: Run the Database Migration on Supabase

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** (or the `+` button)
5. Paste the entire contents of `prisma/migrations/0004_phase2_marketplace/migration.sql`
   - This creates 15 new tables + adds 4 columns to existing tables
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see `Success. No rows returned` — that means it worked

**Alternative (CLI):** If you have Prisma CLI locally:
```bash
cd App
pnpm prisma migrate deploy
```

---

## Step 2: Create Stripe Webhook Endpoint

1. Go to **[Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **Add endpoint**
3. Enter:
   - **Endpoint URL:** `https://human-pulse.com/api/stripe/webhooks`
   - **Description:** `Human Pulse Commerce - Production webhook`
4. Click **+ Select events** and add these 4 events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Click **Add endpoint**
6. On the endpoint detail page, click **Reveal** next to **Signing secret**
7. Copy the `whsec_...` value — you'll need it for Vercel env vars (Step 4)

---

## Step 3: Add admin.human-pulse.com to Vercel

1. Go to **[Vercel Dashboard → Project → Settings → Domains](https://vercel.com/shashidhars-projects-46e8d4de/app/settings/domains)**
2. In the domain input field, type: `admin.human-pulse.com`
3. Click **Add**
4. If prompted to configure DNS:
   - Add a **CNAME** record in GoDaddy:
     - **Name:** `admin`
     - **Value:** `cname.vercel-dns.com`
     - **TTL:** 600

Your existing subdomains (shop, retail, supply, www) are already configured.

---

## Step 4: Set Vercel Environment Variables

1. Go to **[Vercel Dashboard → Project → Settings → Environment Variables](https://vercel.com/shashidhars-projects-46e8d4de/app/settings/environment-variables)**
2. Add each variable below for **Production** + **Preview** environments:

| Variable | Value | Where to find it |
|----------|-------|-------------------|
| `DATABASE_URL` | Your Supabase connection string | Supabase → Settings → Database → Connection string (URI) — use the **connection pooler** URL |
| `DIRECT_URL` | Your Supabase direct connection string | Supabase → Settings → Database → Connection string (URI) — use the **direct** URL |
| `SESSION_SECRET` | A random 64-char string | Generate: `openssl rand -hex 32` |
| `APP_URL` | `https://human-pulse.com` | — |
| `DEMO_MODE` | `false` | — |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | [Stripe API Keys](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | [Stripe API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Step 2, the signing secret |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | [Upstash Console](https://console.upstash.com/) — create a free Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Token from Upstash | Upstash Console → your database → REST API section |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | Vercel → Storage → Create Blob Store → get token |
| `PLATFORM_ADMIN_EMAIL` | `shashidharreddy3333@gmail.com` | Your admin email |
| `CRON_SECRET` | A random string | Generate: `openssl rand -hex 16` |

### Optional (can add later):
| Variable | Value | Purpose |
|----------|-------|---------|
| `RESEND_API_KEY` | `re_...` | Transactional emails via Resend |
| `MAIL_FROM` | `Human Pulse <noreply@human-pulse.com>` | Email sender address |
| `SENTRY_DSN` | `https://xxx@sentry.io/xxx` | Error monitoring |

3. After adding all variables, click **Redeploy** on the latest deployment to pick up the new env vars

---

## Step 5: Verify Everything Works

After completing steps 1-4 and redeploying:

- [ ] Visit `https://human-pulse.com` — main storefront loads
- [ ] Visit `https://admin.human-pulse.com` — admin portal loads
- [ ] Visit `https://shop.human-pulse.com` — customer portal loads
- [ ] Visit `https://retail.human-pulse.com` — retailer portal loads
- [ ] Visit `https://supply.human-pulse.com` — supplier portal loads
- [ ] Test Stripe: try a checkout flow (use test mode first)
- [ ] Check Stripe webhook: go to Dashboard → Webhooks → your endpoint → check for successful deliveries

---

## Quick Reference

| Resource | URL |
|----------|-----|
| Vercel Project | https://vercel.com/shashidhars-projects-46e8d4de/app |
| Stripe Dashboard | https://dashboard.stripe.com |
| Stripe API Keys | https://dashboard.stripe.com/apikeys |
| Supabase Dashboard | https://supabase.com/dashboard |
| GitHub Repo | https://github.com/ShashidhaReddy3333/App |
| GoDaddy DNS | https://dcc.godaddy.com/manage/human-pulse.com/dns |

---

## Services You'll Need to Sign Up For (if not already)

1. **Upstash** (free tier) — [console.upstash.com](https://console.upstash.com/) — for Redis job queue & rate limiting
2. **Vercel Blob** — already included in Vercel, just create a Blob store in your project's Storage tab
3. **Resend** (optional, free tier) — [resend.com](https://resend.com/) — for transactional emails
4. **Sentry** (optional, free tier) — [sentry.io](https://sentry.io/) — for error monitoring
