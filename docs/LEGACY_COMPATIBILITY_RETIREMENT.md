# Legacy Compatibility Retirement

Human Pulse still keeps a small compatibility layer so a few old URLs can redirect users into the correct portal or return an explicit `410 Gone` response. Those compatibility paths are now instrumented and should be deleted after rollout monitoring shows they are no longer used.

## Logged Events

- `legacy_portal_redirect_hit`
  - emitted by [src/middleware.ts](/C:/Users/Owner/Desktop/SRJ/App/src/middleware.ts)
  - covers same-portal legacy redirects such as old cleanups and main-host compatibility redirects
- `legacy_api_endpoint_hit`
  - emitted by deprecated auth handlers under [src/app/api/auth](/C:/Users/Owner/Desktop/SRJ/App/src/app/api/auth)
  - covers removed generic auth endpoints that now return `410 Gone`

Each log line includes request metadata such as `requestId`, `host`, `ipAddress`, `userAgent`, `pathname` or `endpoint`, and the replacement target.

## What Still Exists

- Main-host compatibility redirects:
  - `/sign-up` -> retail portal
  - `/accept-invite` -> retail portal
  - `/customer/sign-up` -> customer portal `/sign-up`
  - `/admin*` -> admin portal
- Same-portal compatibility redirects:
  - shop `/customer/sign-up` -> `/sign-up`
  - shop `/stores` -> `/marketplace`
- Deprecated auth endpoints returning `410 Gone`:
  - `/api/auth/sign-in`
  - `/api/auth/sign-up`
  - `/api/auth/customer-sign-up`
  - `/api/auth/supplier-sign-up`

## Retirement Rule

Use the compatibility layer only as a temporary rollout buffer. Delete it after:

1. zero `legacy_portal_redirect_hit` and `legacy_api_endpoint_hit` events for at least 14 consecutive days
2. no customer support reports tied to legacy URLs during that same window
3. current portal smoke tests pass in staging and production

## Deletion Steps

1. Remove the remaining main-host redirect entries from [src/lib/portal.ts](/C:/Users/Owner/Desktop/SRJ/App/src/lib/portal.ts).
2. Remove remaining same-portal `legacyToCleanRewrites` entries from [src/lib/portal.ts](/C:/Users/Owner/Desktop/SRJ/App/src/lib/portal.ts).
3. Delete the deprecated auth route handlers in [src/app/api/auth](/C:/Users/Owner/Desktop/SRJ/App/src/app/api/auth) once clients have stopped calling them.
4. Update e2e coverage in [tests/e2e/portal-isolation.spec.ts](/C:/Users/Owner/Desktop/SRJ/App/tests/e2e/portal-isolation.spec.ts) so it only asserts the canonical route map.
5. Run `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test:unit`, and `corepack pnpm test:e2e`.

## Operational Review

- During rollout, filter application logs for `category=legacy_compatibility`.
- Review counts by `endpoint`, `pathname`, `host`, and `targetPortal`.
- If one specific legacy path still receives traffic, add that path to external comms or update any stale bookmarks/integrations before deleting the compatibility layer.
