# Production Runbook

## Environments

- `local`
- `staging`
- `production`

## Required environment variables

For `staging` and `production`:

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

## Required production checks

1. `pnpm env:check`
2. `pnpm exec prisma validate`
3. `pnpm typecheck`
4. `pnpm test:unit`
5. `pnpm build`

## Deployment order

1. Confirm environment variables are present and `DEMO_MODE=false`.
2. Apply database migrations.
3. Verify `/api/readiness`.
4. Verify `/api/health`.
5. Send a monitoring test event:
   - `corepack pnpm monitoring:test`
   - or call `/api/internal/monitoring/test` with `Authorization: Bearer $CRON_SECRET`
6. Perform smoke checks:
   - owner sign-in
   - customer sign-up and storefront checkout
   - cashier checkout
   - manager procurement
   - supplier sign-in and order inbox
7. Verify cron jobs are registered from `vercel.json`.

## Operational scripts

- `pnpm ops:cleanup-reservations`
  - releases expired POS reservations and cancels expired pending carts
- `pnpm ops:check-data`
  - validates inventory availability math and flags negative balances
- `pnpm ops:cleanup-maintenance`
  - purges expired reset tokens, aged invites, old sessions, stale throttles, and aged notification rows
- `pnpm notifications:process`
  - dispatches queued notifications
- `pnpm monitoring:test`
  - emits a test monitoring event to the configured `SENTRY_DSN`

## Scheduled jobs

Configured in `vercel.json`:

- `/api/internal/jobs/process-notifications`
  - every 5 minutes
- `/api/internal/jobs/cleanup-reservations`
  - every 10 minutes
- `/api/internal/jobs/maintenance-cleanup`
  - daily at 03:00 UTC

All scheduled job routes require `Authorization: Bearer $CRON_SECRET` for manual triggering.

## Incident response

### Stuck pending-payment sales

1. Run `pnpm ops:cleanup-reservations`.
2. Recheck the sale list and inventory balances.
3. If balances still look wrong, run `pnpm ops:check-data`.

### Password reset or invite delivery failures

1. Verify `RESEND_API_KEY`, `MAIL_FROM`, and `APP_URL`.
2. Verify `SENTRY_DSN` and inspect monitoring events for delivery failures.
3. Check `Notification` rows and application logs.
4. Retry only after confirming sender configuration.

### Inventory mismatch

1. Run `pnpm ops:check-data`.
2. Inspect recent `InventoryMovement`, `Sale`, `Order`, `Refund`, and `PurchaseOrder` records.
3. Apply a manual audited inventory adjustment if a business-approved correction is required.

### Cleanup and support

1. Visit the owner-only `/app/ops` page to review runtime issues, failed notifications, and recent audit activity.
2. Retry failed notifications from the operations page before manually resending business emails.
3. Resend pending invites from the staff page instead of generating ad hoc replacement accounts.
