# Business Management App

Production-ready MVP for small shops built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind, React Hook Form, Zod, TanStack Table, Recharts, Vitest, and Playwright.

## Scope

This app covers the requested MVP only:

- owner and staff authentication
- business onboarding
- product and supplier management
- authoritative inventory balances and movement ledger
- checkout draft and sale completion
- split payments
- refunds
- reorder list
- dashboard and reports
- staff roles and session management
- audit logging
- receipt generation and retrieval

## Production hardening included

The current codebase has been hardened without changing product scope:

- route-level `loading.tsx` and `error.tsx` coverage for public and protected areas
- shared empty and error states instead of page-specific placeholders
- consistent client form handling with disabled submit states, request envelopes, and server validation surfacing
- centralized API access guard with correct `401` vs `403` behavior
- centralized RBAC permission map used by pages, navigation, and route handlers
- transaction-safe helpers for reservations, sale commit, refund restock, idempotency, receipt sequencing, and owned-resource validation
- in-transaction audit logging for critical committed writes
- query and command service entry points for cleaner UI and API boundaries
- view-model mapping helpers so pages do not shape raw service data inline
- stable API response contract: success responses return `{ data, message }`, failures return `{ message, code, issues }`

## Architecture

### App structure

- `src/app`
  - App Router pages and route handlers
- `src/components`
  - reusable UI primitives, forms, layout, and state components
- `src/lib/auth`
  - session handling, API guards, page guards, and permission definitions
- `src/lib/domain`
  - pricing, inventory, sales, and timezone rules
- `src/lib/services`
  - command and query entry points over persistence and business workflows
- `src/lib/view-models`
  - page-facing mapping helpers
- `prisma`
  - schema, migration, and seed script
- `tests`
  - unit, integration-style, and Playwright smoke coverage

### Key design decisions

- `InventoryBalance` is authoritative for availability. `Product` does not hold authoritative stock.
- Every stock-changing operation records an `InventoryMovement`.
- Critical writes use serializable transactions where required.
- Checkout reserves stock before payment completion.
- Receipt numbers are allocated from `Business.nextReceiptNumber` inside the same transaction as sale completion.
- Business-day reporting is based on business timezone helpers, not raw UTC grouping.
- API routes use a single auth guard and a single error envelope.

## Main modules

- Authentication and sessions
  - sign up, sign in, sign out, forgot password, reset password
  - per-device sessions
  - owner session revocation
  - login throttling by email and IP bucket
- Onboarding
  - owner account + business + default `Main Location`
  - timezone, currency, country, tax mode, default tax rule
- Catalog and inventory
  - supplier creation
  - product creation with opening stock
  - inventory adjustments with idempotency
  - low-stock and reorder calculations from `availableQuantity`
- Sales
  - checkout draft creation
  - reservation-based stock hold
  - split payments
  - receipt generation
  - sales history and sale detail
- Refunds
  - partial refund flow
  - refundable quantity tracking
  - payment reversal allocation
  - explicit restock handling
- Reporting
  - dashboard summary cards
  - recent activity
  - payment breakdown chart

## Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
SESSION_SECRET="replace-with-a-long-random-string"
APP_URL="http://localhost:3000"
DEMO_MODE="true"
```

`DATABASE_URL` must point to a running PostgreSQL server. The seed script and Playwright smoke tests require a reachable database.
`DIRECT_URL` is used by Prisma for migrations and seed operations. In local Docker setup it can match `DATABASE_URL`.

For the included Docker setup, keep the default URL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
```

## Supabase + Vercel

This repo works with Supabase as its PostgreSQL database.

Recommended setup:

- `DATABASE_URL`
  - use the Supabase pooled connection string for app runtime on Vercel
- `DIRECT_URL`
  - use the direct database connection string for Prisma migrations and seed
- `SESSION_SECRET`
  - long random secret for cookie-backed sessions
- `APP_URL`
  - your deployed Vercel URL or custom domain
- `DEMO_MODE`
  - set to `false` in production

Typical deployment flow:

1. Create a Supabase project.
2. In Supabase, copy:
   - pooled connection string for `DATABASE_URL`
   - direct connection string for `DIRECT_URL`
3. Add those values in Vercel Project Settings -> Environment Variables.
4. Set `SESSION_SECRET`, `APP_URL`, and `DEMO_MODE=false` in Vercel.
5. Run Prisma migrations against Supabase before first use:

```bash
corepack pnpm prisma:migrate:deploy
```

6. Optionally seed demo data once:

```bash
corepack pnpm prisma:seed
```

## Scripts

- `corepack pnpm db:up`
  - start PostgreSQL with Docker Compose
- `corepack pnpm db:health`
  - wait for and verify database connectivity
- `corepack pnpm db:down`
  - stop the local PostgreSQL container
- `corepack pnpm prisma:migrate:deploy`
  - apply the checked-in Prisma migration
- `corepack pnpm prisma:seed`
  - reset and seed the demo database
- `corepack pnpm demo:setup`
  - run DB health, Prisma generate, migration deploy, and seed in one command
- `corepack pnpm dev`
  - start the local app
- `corepack pnpm build`
  - create a clean production build; this now clears stale `.next` artifacts before building
- `corepack pnpm test:e2e`
  - run Playwright smoke tests against a production server; this now auto-runs DB health, migration deploy, seed, and build first

## Local demo setup

Startup order on a fresh machine:

1. Install dependencies.

```bash
corepack pnpm install
```

2. Start PostgreSQL.

```bash
corepack pnpm db:up
```

3. Create `.env` from `.env.example`.

4. Generate the Prisma client.

```bash
corepack pnpm prisma generate
```

5. Apply the migration.

```bash
corepack pnpm prisma:migrate:deploy
```

6. Seed demo data.

```bash
corepack pnpm prisma:seed
```

7. Start the app.

```bash
corepack pnpm dev
```

8. Verify app and DB health.

Open [http://localhost:3000/api/health](http://localhost:3000/api/health)

9. Stop any running local app server, then run the Playwright smoke suite.

```bash
corepack pnpm test:e2e
```

If you want the setup path in one command after the database is up:

```bash
corepack pnpm demo:setup
```

## Demo credentials

- Owner: `owner@demo.local` / `DemoPass!123`
- Manager: `manager@demo.local` / `DemoPass!123`
- Cashier: `cashier@demo.local` / `DemoPass!123`
- Inventory staff: `inventory@demo.local` / `DemoPass!123`

## Testing

### Required checks

```bash
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm build
corepack pnpm exec prisma validate
```

### Playwright smoke tests

These tests expect PostgreSQL to be running and `APP_URL` to be free before the run starts. The Playwright global setup now performs:

- `db:health`
- `prisma:migrate:deploy`
- `prisma:seed`
- `build`

Then it starts `next start` and runs the smoke suite:

```bash
corepack pnpm test:e2e
```

Current smoke coverage includes:

- owner sign-in and product creation
- cashier checkout reservation and split-payment completion
- manager refund creation from seeded sale history
- inventory staff access to reorder tools and direct-route blocking from checkout

## What was verified in this workspace

Verified here:

- `corepack pnpm db:up`
- `corepack pnpm db:health`
- `corepack pnpm prisma:migrate:deploy`
- `corepack pnpm prisma:seed`
- `corepack pnpm typecheck`
- `corepack pnpm test:unit`
- `corepack pnpm build`
- `corepack pnpm exec prisma validate`
- `corepack pnpm test:e2e`

## Important implementation files

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/auth/api-guard.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/errors.ts`
- `src/lib/http.ts`
- `src/lib/services/command-helpers.ts`
- `src/lib/services/catalog-command-service.ts`
- `src/lib/services/catalog-query-service.ts`
- `src/lib/services/sales-command-service.ts`
- `src/lib/services/sales-query-service.ts`
- `src/lib/services/reporting-query-service.ts`
- `src/lib/view-models/app.ts`

## Future improvements

- product edit and archive flows
- purchase order UI and receiving
- resend and revoke staff invites
- richer cashier checkout interactions and barcode-first input
- receipt PDF export
- CI-backed PostgreSQL integration and Playwright runs
- real email delivery for invites and password resets
