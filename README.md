# Commerce Operating System

Phase 1 expansion of the original Business Management App into a single-retailer commerce platform built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind, React Hook Form, Zod, TanStack Table, Recharts, Vitest, and Playwright.

## Phase 1 scope

This repo now supports five working product surfaces in one codebase:

- Customer web storefront
  - browse products
  - add to cart
  - checkout
  - order history and order detail
- Retail operations app
  - dashboard
  - products and suppliers
  - POS checkout and sale completion
  - refunds
  - reorder list
  - reports
  - staff and sessions
- Manager procurement
  - supplier-backed wholesale catalog
  - purchase order creation
  - goods receiving
- Supplier portal
  - supplier sign-up and sign-in
  - wholesale catalog management
  - retailer purchase order inbox
  - fulfillment status updates
- Shared platform foundations
  - email/password auth
  - role-based access control
  - authoritative inventory balances
  - inventory movement ledger
  - audit logging
  - transactional write flows

## Roles

- `customer`
- `cashier`
- `manager`
- `supplier`
- `owner`
- legacy support kept for `inventory_staff`

`platform_admin` is reserved in schema and permissions for later expansion, but not exposed as a live app surface in Phase 1.

## Architecture

### Route surfaces

- `src/app`
  - public landing and auth pages
- `src/app/shop`, `src/app/cart`, `src/app/orders`
  - customer storefront and order account
- `src/app/app`
  - POS, manager, and owner operations
- `src/app/supplier`
  - supplier portal

### Service domains

- `src/lib/services/auth-*`
  - account creation, session flows, invites, password reset
- `src/lib/services/catalog-*`
  - retailer catalog and suppliers
- `src/lib/services/customer-commerce-*`
  - storefront, cart, customer checkout, customer order history
- `src/lib/services/sales-*`
  - POS checkout, sale completion, refunds, receipts
- `src/lib/services/procurement-*`
  - supplier products, purchase orders, goods receiving, supplier portal
- `src/lib/services/reporting-*`
  - dashboard and reporting snapshots

### Data and transaction decisions

- `InventoryBalance` remains authoritative for stock.
- `InventoryMovement` records every stock-changing operation.
- POS sales and online customer orders share the same inventory ledger.
- Customer checkout and procurement writes are idempotent.
- Receipt, online order, and purchase-order numbers are allocated from transactional business counters.
- Customer web checkout uses the same pricing, tax, and stock reservation patterns as the POS flow.

## Main models added in Phase 1

The original schema was extended with:

- `CustomerProfile`
- `Address`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`
- `OrderStatusHistory`
- `OrderFulfillment`
- `OrderPayment`
- `POSRegister`
- `RegisterSession`
- `SupplierProduct`
- `Notification`
- `NotificationPreference`

The commerce expansion migration is checked in at:

- `prisma/migrations/0002_commerce_phase1/migration.sql`
- `prisma/migrations/0003_production_indexes/migration.sql`

## Production hardening in this repo

Beyond the Phase 1 feature set, the repo now includes:

- tiered runtime env validation via `pnpm env:check`
- middleware-based request IDs and security headers
- client and server error reporting hooks for Sentry-compatible monitoring
- liveness and readiness endpoints:
  - `/api/health`
  - `/api/readiness`
- throttling on sign-in, forgot-password, and invite flows
- operational repair scripts for expired reservations and inventory consistency
- queued notification processing infrastructure
- Vercel cron configuration for internal scheduled jobs
- owner-only operations page for runtime issues, failed notifications, and recent audit activity
- GitHub Actions CI for verify and Playwright smoke coverage
- support and launch runbooks under `docs/`

## Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/business_management_app?schema=public"
SESSION_SECRET="replace-with-a-long-random-string"
APP_URL="http://localhost:3000"
DEMO_MODE="true"
RESEND_API_KEY=""
MAIL_FROM="Commerce Operating System <noreply@example.com>"
MAIL_REPLY_TO=""
SENTRY_DSN=""
CRON_SECRET="replace-with-a-long-internal-job-secret"
```

Notes:

- `DATABASE_URL` is used by the app runtime.
- `DIRECT_URL` is used by Prisma migrations.
- `DEMO_MODE=true` keeps forgot-password and staff-invite flows deterministic by surfacing tokens in the UI instead of requiring live email delivery.
- `DEMO_MODE=false` requires Resend configuration for password reset and staff invite emails.
- `SENTRY_DSN` is required in staging/production so runtime failures are captured by monitoring.
- `CRON_SECRET` protects internal job routes used by Vercel Cron and manual operator calls.

### Staging and production environment contract

For hosted environments, keep a separate Supabase database for `staging` and `production`, and configure separate Vercel environment variable sets. Do not reuse your local `.env`.

Required for `staging` and `production`:

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`
- `APP_URL`
- `DEMO_MODE=false`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `SENTRY_DSN`
- `CRON_SECRET`

Optional:

- `MAIL_REPLY_TO`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Scripts

- `corepack pnpm db:up`
  - start local PostgreSQL with Docker
- `corepack pnpm db:down`
  - stop local PostgreSQL
- `corepack pnpm db:health`
  - verify database connectivity
- `corepack pnpm env:check`
  - validate runtime configuration and production-critical environment values
- `corepack pnpm prisma:generate`
  - regenerate Prisma client
- `corepack pnpm prisma:migrate:deploy`
  - apply checked-in migrations to a fresh or migration-managed database
- `corepack pnpm prisma:reset`
  - reset a local development database and reapply migrations without seeding
- `corepack pnpm prisma:seed`
  - reset demo data contents and seed all Phase 1 roles and flows
- `corepack pnpm demo:setup`
  - local demo setup: DB health, Prisma generate, Prisma reset, seed
- `corepack pnpm ops:cleanup-reservations`
  - release expired POS reservations and cancel expired pending-payment carts
- `corepack pnpm ops:check-data`
  - validate inventory availability math and detect broken balances
- `corepack pnpm ops:cleanup-maintenance`
  - purge expired auth artifacts, old sessions, stale throttles, and aged notification rows
- `corepack pnpm notifications:process`
  - dispatch queued notifications
- `corepack pnpm monitoring:test`
  - emit a test monitoring event through the configured Sentry DSN
- `corepack pnpm dev`
  - start Next.js in development
- `corepack pnpm build`
  - create a production build
- `corepack pnpm test:unit`
  - run unit and lightweight integration tests
- `corepack pnpm test:e2e`
  - run Playwright smoke tests against a seeded production build

## Local setup

Fresh machine:

1. Install dependencies.

```bash
corepack pnpm install
```

2. Start PostgreSQL.

```bash
corepack pnpm db:up
```

3. Copy `.env.example` to `.env`.

4. Generate Prisma client.

```bash
corepack pnpm prisma:generate
```

5. Apply migrations to an empty or migration-managed database.

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

For a repeatable local demo database, use:

```bash
corepack pnpm demo:setup
```

This intentionally resets the local development database before seeding.

## Demo credentials

- Owner: `owner@demo.local` / `DemoPass!123`
- Manager: `manager@demo.local` / `DemoPass!123`
- Cashier: `cashier@demo.local` / `DemoPass!123`
- Inventory staff: `inventory@demo.local` / `DemoPass!123`
- Customer: `customer@demo.local` / `DemoPass!123`
- Supplier: `supplier@demo.local` / `DemoPass!123`

## Test coverage

Current automated coverage includes:

- unit tests for pricing, inventory, timezone grouping, session-cookie policy, mailer behavior, idempotency helpers, permissions, and new commerce identifiers
- smoke tests for:
  - owner sign-in, supplier creation, product creation, staff invite, session revoke
  - cashier split-payment checkout
  - manager refund flow
  - inventory staff reorder access and supplier/checkout blocking
  - customer storefront -> cart -> checkout -> order detail
  - manager procurement
  - supplier catalog and supplier order status update

Run the main verification set:

```bash
corepack pnpm env:check
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm build
corepack pnpm exec prisma validate
```

Run browser smoke coverage:

```bash
corepack pnpm test:e2e
```

The Playwright global setup now runs:

- `db:health`
- `prisma:reset`
- `prisma:seed`
- `build`

before starting the production server.

## Operations and launch

Useful endpoints:

- `/api/health`
  - app + database liveness
- `/api/readiness`
  - readiness for traffic, including runtime config checks
- `/api/internal/jobs/process-notifications`
  - cron/manual notification dispatch, protected by `CRON_SECRET`
- `/api/internal/jobs/cleanup-reservations`
  - cron/manual release of expired reservations, protected by `CRON_SECRET`
- `/api/internal/jobs/maintenance-cleanup`
  - daily cleanup for expired tokens, old sessions, and aged notification rows
- `/api/internal/monitoring/test`
  - authenticated test event for Sentry verification

Useful production docs:

- `docs/PRODUCTION_RUNBOOK.md`
- `docs/DATA_RETENTION.md`
- `docs/LAUNCH_CHECKLIST.md`

## Hosted rollout notes

### Vercel Cron

`vercel.json` schedules these jobs:

- every 5 minutes: `/api/internal/jobs/process-notifications`
- every 10 minutes: `/api/internal/jobs/cleanup-reservations`
- daily at 03:00 UTC: `/api/internal/jobs/maintenance-cleanup`

Set `CRON_SECRET` in Vercel so both routes reject unauthenticated manual traffic while still accepting platform-triggered cron requests.

### Staging verification

Minimum staging checks before production:

1. `corepack pnpm env:check`
2. `corepack pnpm prisma:migrate:deploy`
3. `GET /api/readiness`
4. `GET /api/health`
5. `POST /api/internal/monitoring/test` with `Authorization: Bearer $CRON_SECRET`
6. real forgot-password email
7. real staff invite email
8. customer checkout, cashier checkout, procurement receive, supplier status update, refund flow

## Important files

- `prisma/schema.prisma`
- `prisma/migrations/0002_commerce_phase1/migration.sql`
- `prisma/seed.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/auth/guards.ts`
- `src/lib/services/customer-commerce-service.ts`
- `src/lib/services/procurement-service.ts`
- `src/lib/services/sales-service.ts`
- `src/lib/services/command-helpers.ts`
- `src/lib/view-models/app.ts`

## Deferred beyond Phase 1

- true multi-retailer marketplace discovery
- native mobile apps
- full platform-admin portal
- Redis-backed jobs and notification queues
- object storage for receipt PDFs and product media
- external payment gateway integration beyond current internal/manual wiring
