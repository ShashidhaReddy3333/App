---
name: stripe-webhook
description: Expert guidance for Stripe webhook handling in this project — signature verification, idempotency, event processing, adding new event types. Use when working on Stripe webhook code.
user-invocable: false
---

You are a Stripe webhook expert for this project. Apply these rules precisely whenever adding or modifying webhook handling.

## Architecture

| File                                   | Responsibility                                                     |
| -------------------------------------- | ------------------------------------------------------------------ |
| `src/app/api/stripe/webhooks/route.ts` | HTTP handler — reads raw body, verifies signature, calls processor |
| `src/lib/stripe/webhooks.ts`           | `constructEvent` + `processWebhookEvent` + `handleEvent`           |
| `src/lib/stripe/checkout.ts`           | `handleSuccessfulPayment` — fulfillment logic                      |
| `src/lib/stripe/client.ts`             | Stripe SDK singleton                                               |
| `src/lib/stripe/config.ts`             | `STRIPE_CONFIG` with webhook secret                                |

## Non-negotiable rules

**1. Always read raw body as Buffer.** Stripe signature verification requires the exact raw bytes. Never use `request.json()` or `request.text()` in the webhook route — it must be `request.arrayBuffer()` → `Buffer.from(...)`.

**2. Always verify the signature first.** Call `constructEvent(rawBody, signature)` before any business logic. If `constructEvent` throws, return 400. Never process an event whose signature hasn't been verified.

**3. Always check idempotency before processing.** The `processWebhookEvent` function checks `stripeWebhookEvent` for a prior successful `processedAt`. If already processed, return early. Stripe retries failed webhooks — your handlers must be safe to call multiple times.

**4. Return 200 for processing errors.** If `handleEvent` throws after signature verification, catch the error, log it, mark the event as failed in `stripeWebhookEvent`, and return `200 { received: true }`. If you return a 4xx/5xx, Stripe will retry indefinitely.

**5. The route is CSRF-exempt.** The middleware explicitly skips CSRF for `/api/stripe/webhooks`. Do not add `requireApiAccess` to this route — Stripe calls it without a session.

## Adding a new event type

Edit the `handleEvent` switch in `src/lib/stripe/webhooks.ts`:

```ts
case "invoice.payment_succeeded": {
  const invoice = event.data.object as Stripe.Invoice;
  // handle fulfillment...
  break;
}
```

Rules for new event handlers:

- Cast `event.data.object` to the specific Stripe type (e.g. `Stripe.Invoice`), never use `any`
- Keep business logic in a dedicated function in `src/lib/stripe/checkout.ts` or a new `src/lib/stripe/<domain>.ts` file — don't inline complex logic in the switch
- Always scope DB writes by a verified ID from the Stripe object (e.g. `metadata.orderId`, `customer`), never trust IDs from the payload body that Stripe didn't set
- The `default` case is intentionally a no-op — unknown event types are safely ignored

## Idempotency pattern

The `processWebhookEvent` function handles idempotency via the `stripeWebhookEvent` table:

1. Check if `stripeEventId` already has `processedAt` set → skip
2. If `failedAt` is set → allow retry (Stripe has retried this)
3. Otherwise → create record, then call `handleEvent`
4. On success → set `processedAt`
5. On failure → set `failedAt` + `failureReason`, then rethrow (route handler catches and returns 200)

When adding new event handlers, never bypass this pattern. Do not call `handleEvent` directly from the route.

## Body size limit

The route enforces a 1 MB limit on webhook payloads (`MAX_WEBHOOK_BODY_BYTES = 1024 * 1024`). Do not increase this without a specific reason — Stripe events are never that large in practice.

## Testing webhooks locally

Use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

The CLI provides a test webhook secret that differs from production. Set `STRIPE_WEBHOOK_SECRET` in `.env.local` to the CLI-provided secret during local development.

## Environment variables

| Variable                 | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `STRIPE_SECRET_KEY`      | Stripe API key (server-side only)            |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signing secret from Stripe dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Client-side key for Stripe.js                |

Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the client.
