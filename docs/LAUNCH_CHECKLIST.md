# Launch Checklist

## Environment

- [ ] `DEMO_MODE=false`
- [ ] `DATABASE_URL` and `DIRECT_URL` point to the production database
- [ ] `SESSION_SECRET` is long and unique
- [ ] `APP_URL` is the real HTTPS production URL
- [ ] `RESEND_API_KEY` is configured
- [ ] `MAIL_FROM` is configured and sender identity is verified

## Database

- [ ] Migrations applied successfully
- [ ] Backup and restore tested
- [ ] `pnpm ops:check-data` passes in staging

## Auth and security

- [ ] forgot-password works with real email delivery
- [ ] staff invite works with real email delivery
- [ ] security headers are present
- [ ] session cookies are secure in production

## Business flows

- [ ] customer sign-up and checkout
- [ ] cashier split-payment sale
- [ ] manager refund
- [ ] manager purchase order create and receive
- [ ] supplier catalog update and PO status update
- [ ] owner dashboard and reports

## Observability

- [ ] `/api/health` passes
- [ ] `/api/readiness` passes
- [ ] request IDs are present in responses
- [ ] application logs are being captured

## Release

- [ ] CI passed on the release commit
- [ ] staging smoke test passed
- [ ] production smoke test passed after deploy
