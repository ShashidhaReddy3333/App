# Production Runbook

## Environments

- `local`
- `staging`
- `production`

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
5. Perform smoke checks:
   - owner sign-in
   - customer sign-up and storefront checkout
   - cashier checkout
   - manager procurement
   - supplier sign-in and order inbox

## Operational scripts

- `pnpm ops:cleanup-reservations`
  - releases expired POS reservations and cancels expired pending carts
- `pnpm ops:check-data`
  - validates inventory availability math and flags negative balances
- `pnpm notifications:process`
  - dispatches queued notifications

## Incident response

### Stuck pending-payment sales

1. Run `pnpm ops:cleanup-reservations`.
2. Recheck the sale list and inventory balances.
3. If balances still look wrong, run `pnpm ops:check-data`.

### Password reset or invite delivery failures

1. Verify `RESEND_API_KEY`, `MAIL_FROM`, and `APP_URL`.
2. Check `Notification` rows and application logs.
3. Retry only after confirming sender configuration.

### Inventory mismatch

1. Run `pnpm ops:check-data`.
2. Inspect recent `InventoryMovement`, `Sale`, `Order`, `Refund`, and `PurchaseOrder` records.
3. Apply a manual audited inventory adjustment if a business-approved correction is required.
