---
name: ops
description: Guide for running operational maintenance scripts — reservations cleanup, data integrity, notification dispatch, maintenance cleanup. Use when asked to run, schedule, or explain operational tasks.
disable-model-invocation: true
---

You are an operations guide for this project. The user wants to run, understand, or schedule an operational task.

Arguments: $ARGUMENTS

## Available scripts

| npm script                      | File                                      | What it does                                                                                                                            | Safe to run anytime?                                     |
| ------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm ops:cleanup-reservations` | `scripts/release-expired-reservations.ts` | Releases cart reservations that have passed their expiry. Frees up reserved inventory back to available.                                | Yes — idempotent, safe to run repeatedly                 |
| `pnpm ops:check-data`           | `scripts/check-data-integrity.ts`         | Reads all inventory balances and validates: no negative quantities, and `available = onHand - reserved`. Exits 1 if any mismatch found. | Yes — read-only, no side effects                         |
| `pnpm ops:cleanup-maintenance`  | `scripts/cleanup-operational-data.ts`     | Deletes old operational records (e.g. expired tokens, stale audit entries) per the `cleanupOperationalData` service.                    | Yes — but avoid during peak hours; it issues DELETEs     |
| `pnpm notifications:process`    | `scripts/process-notifications.ts`        | Dispatches all queued notifications (email, in-app) via `dispatchQueuedNotifications`.                                                  | Yes — idempotent; already-sent notifications are skipped |

## Steps for each task

### 1. Confirm environment

Always check which database the scripts will hit before running:

- Local dev: requires Docker Postgres to be running (`pnpm db:up` if not already)
- Production: requires `DATABASE_URL` env var pointing to hosted DB

### 2. Run the appropriate script

Run from the project root with `corepack pnpm <script>`. Each script loads `.env` automatically if present.

### 3. Review output

All scripts log a JSON summary on success, or error messages on failure. If `ops:check-data` exits with code 1, review the printed integrity issues before taking any corrective action.

## When to run each script

| Trigger                                                    | Script to run                                             |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| Users report items stuck in "reserved" state               | `ops:cleanup-reservations`                                |
| Inventory counts seem off vs. expected                     | `ops:check-data` first, then investigate mismatches       |
| Routine nightly maintenance                                | `ops:cleanup-maintenance` then `ops:cleanup-reservations` |
| Notifications are delayed or users aren't receiving emails | `notifications:process`                                   |
| After a data migration or seed                             | `ops:check-data` to verify integrity                      |

## Safety rules

- Never run `pnpm prisma:reset` as part of ops work — it destroys all data.
- Never run cleanup scripts against production without confirming `DATABASE_URL` points to the right host.
- If `ops:check-data` finds mismatches, investigate the root cause before running cleanup scripts. Cleanup does not fix inventory imbalances — it only removes expired reservations.
- `ops:cleanup-maintenance` issues DELETE statements. Run during low-traffic windows for production.

## Scheduling (Vercel Cron)

These scripts are wired to internal API routes for cron scheduling. See `vercel.json` for the schedule config and `src/app/api/internal/` for the route handlers that invoke them. To change the schedule, edit `vercel.json` — do not modify the scripts themselves.
