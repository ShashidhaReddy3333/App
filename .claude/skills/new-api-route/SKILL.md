---
name: new-api-route
description: Scaffold a new Next.js App Router API route following this project's exact patterns — requireApiAccess, Zod parse, apiSuccess/apiError, multi-tenant scoping, CSRF, rate limiting. Use when asked to create a new API endpoint.
user-invocable: false
---

You are an API route expert for this Next.js 15 App Router project. Apply these patterns precisely whenever scaffolding a new route.

## File location

API routes live at `src/app/api/<resource>/route.ts` (collection) or `src/app/api/<resource>/[id]/route.ts` (single resource). Always add `export const dynamic = "force-dynamic";` at the top.

## Mandatory structure

Every route handler must follow this shape — no exceptions:

```ts
import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { withRateLimit } from "@/lib/api-rate-limit";
// import your Zod schema from @/lib/schemas/<domain>
// import your service from @/lib/services/<domain>-service

export const dynamic = "force-dynamic";

// GET — read-only, no request object needed
export async function GET() {
  try {
    const { businessId } = await requireApiAccess("permission_key");
    const data = await yourQueryService(businessId);
    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST/PATCH/PUT/DELETE — must pass request for CSRF validation
const postHandler = async (request: Request) => {
  try {
    const { session, businessId } = await requireApiAccess("permission_key", { request });
    const body = await request.json();
    const payload = yourSchema.parse(body); // Zod parse — throws ZodError on invalid input
    const result = await yourCommandService(session.user.id, businessId, payload);
    return apiSuccess({ result }, { status: 201, message: "Resource created." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60_000 });
```

## Dynamic segments

For routes with path params (e.g. `/api/orders/[orderId]`), use the Promise-based params pattern:

```ts
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { session, businessId } = await requireApiAccess("sales", { request });
    const { orderId } = await params;
    // ...
  } catch (error) {
    return apiError(error);
  }
}
```

## Authentication rules

| Guard                                                             | When to use                                       |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| `requireApiAccess("permission")`                                  | Standard business user route                      |
| `requireApiAccess(undefined, { allowMissingBusiness: true })`     | Onboarding routes where businessId is not yet set |
| `requireApiAccess("permission", { roles: ["owner", "manager"] })` | Restrict to specific roles                        |
| `requirePlatformAdminAccess(request)`                             | Admin-only platform routes under `/api/admin/`    |

Always destructure `{ session, businessId }` from the guard return value. Use `businessId` in every Prisma query — never trust a `businessId` from the request body for scoping.

## CSRF rules

- **GET / HEAD** — no `request` needed (safe methods skip CSRF)
- **POST / PATCH / PUT / DELETE** — always pass `{ request }` to `requireApiAccess`
- Stripe webhook at `/api/stripe/webhooks` is explicitly exempt (handled in middleware)
- Internal cron routes at `/api/internal/` are exempt (authenticated via `CRON_SECRET`)

## Rate limiting

Apply `withRateLimit` to all state-changing handlers (POST/PATCH/PUT/DELETE). Default limits:

- Standard mutations: `{ limit: 30, windowMs: 60_000 }`
- Auth-adjacent or sensitive: `{ limit: 10, windowMs: 60_000 }`

GET handlers do not need rate limiting unless they are computationally expensive.

## Zod schemas

Define schemas in `src/lib/schemas/<domain>.ts`. Parse in the route handler (never in the service layer):

```ts
const payload = yourSchema.parse(await request.json());
```

`apiError` handles `ZodError` automatically and returns a 400 with field-level `issues`.

## Response conventions

| Situation           | Response                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| Successful read     | `apiSuccess(data)` — 200                                                  |
| Successful creation | `apiSuccess({ resource }, { status: 201, message: "Resource created." })` |
| Successful update   | `apiSuccess({ resource }, { message: "Resource updated." })`              |
| Any error           | `apiError(error)` — status and message derived from error type            |

Never call `NextResponse.json(...)` directly — always use `apiSuccess` / `apiError`.

## Multi-tenant scoping

Every Prisma query must scope by `businessId` (and `locationId` where relevant). Never fetch data without a tenant scope. Example:

```ts
// CORRECT
await db.product.findMany({ where: { businessId } });

// WRONG — missing tenant scope
await db.product.findMany();
```

If a route also needs location scoping, read the active location from the cookie or from the request, not from the session (sessions don't store locationId).

## Internal / cron routes

Routes at `/api/internal/` skip CSRF and session auth. Instead, validate `CRON_SECRET`:

```ts
const secret = request.headers.get("x-cron-secret");
if (!secret || secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
