# Human Pulse Commerce

Commerce Operating System — a single-retailer platform with five surfaces in one codebase:
**Shop** (customer storefront), **Retail** (POS & operations), **Supply** (supplier portal),
**Admin** (platform management), and **Main** (unified auth hub).

## Tech Stack

Next.js 15.3 · React 19 · TypeScript 5.8 (strict) · Prisma 6.6 + PostgreSQL · Tailwind CSS 3.4 ·
shadcn/ui (Radix) · Stripe · Vercel · Upstash Redis · Resend · pnpm 10.11+

## Portal Architecture

Portals are resolved by subdomain in `src/middleware.ts` and set `data-portal` on `<body>` for theming.

| Portal | Subdomain    | Allowed Roles                            |
| ------ | ------------ | ---------------------------------------- |
| shop   | shop.\*      | customer                                 |
| retail | retail.\*    | owner, manager, cashier, inventory_staff |
| supply | supply.\*    | supplier                                 |
| admin  | (path-based) | platform_admin                           |
| main   | default      | all (unified sign-in)                    |

## Directory Structure

```
src/
  app/
    portal/{retail,shop,supply}/  # Portal page routes
    admin/                        # Admin pages
    api/                          # Route handlers
    _surfaces/                    # Shared internal routes
  components/
    ui/                           # shadcn/ui primitives
    forms/                        # Form components
  lib/
    auth/                         # Session, guards, permissions
    services/                     # Domain services (CQRS pattern)
    schemas/                      # Zod validation schemas
    hooks/                        # React hooks
    server/                       # Server-side utilities
    client/                       # Client-side utilities (csrfFetch, requestJson)
    security/                     # CSRF, rate limiting
    domain/                       # Business rules
  types/                          # TypeScript type definitions
prisma/                           # Schema + migrations
tests/
  unit/                           # Vitest unit tests
  integration/                    # Vitest integration tests
  e2e/                            # Playwright E2E tests
  components/                     # Component tests (@testing-library/react)
```

## Service Layer (CQRS)

Business logic lives in `src/lib/services/`. Each domain has:

- `*-service.ts` — facade (re-exports commands + queries)
- `*-command-service.ts` — write operations
- `*-query-service.ts` — read operations

**Always scope queries by `businessId`** to enforce multi-tenant isolation.

## Auth Guards

Use the right guard for each context:

| Guard                          | Use For                                | File                    |
| ------------------------------ | -------------------------------------- | ----------------------- |
| `requireAnySession()`          | Pages needing any logged-in user       | `lib/auth/guards.ts`    |
| `requireAppSession()`          | Pages needing a business-attached user | `lib/auth/guards.ts`    |
| `requirePermission(p)`         | Pages needing a specific permission    | `lib/auth/guards.ts`    |
| `requireRole(role)`            | Pages needing a specific role          | `lib/auth/guards.ts`    |
| `requireApiAccess(p)`          | API routes (includes CSRF check)       | `lib/auth/api-guard.ts` |
| `requirePlatformAdminAccess()` | Admin API routes                       | `lib/auth/api-guard.ts` |

## Theming

Colors are CSS variables in `src/app/globals.css`, switched by `body[data-portal]`.
Never use raw color values — always use design tokens: `bg-primary`, `text-muted-foreground`,
`border-border`, `bg-surface`, etc. Custom utility classes: `.page-shell`, `.gradient-panel`,
`.metric-card`, `.data-row`, `.surface-shell`, `.section-label`, `.status-badge-*`.

## Naming Conventions

- **Files:** kebab-case (`purchase-order-form.tsx`)
- **Components:** PascalCase exports (`PurchaseOrderForm`)
- **Utilities/hooks:** camelCase (`useEventSource`, `formatDateTime`)
- **Constants:** UPPER_SNAKE_CASE (`ACTIVE_BUSINESS_LOCATION_COOKIE`)
- **Types:** PascalCase (`EnhancedDashboardMetrics`)

## Coding Standards

- TypeScript strict mode — no `any` types
- Functional components with hooks only
- No inline styles — use Tailwind utilities or CSS variable classes
- No `console.log` in production code (use `logEvent` from `lib/observability.ts`)
- Validate all API inputs with Zod schemas from `lib/schemas/`
- Use `apiSuccess()` / `apiError()` from `lib/http.ts` for API responses
- Use `withSerializableRetry()` from `lib/db.ts` for high-concurrency transactions
- Prefer `motion-safe:` prefix for transitions and animations

## Testing

```bash
pnpm test:unit        # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
pnpm test:coverage    # Unit tests with coverage
pnpm typecheck        # TypeScript validation
pnpm lint             # ESLint
```

- Unit tests: `tests/unit/*.test.ts` — service logic, domain rules, helpers
- Component tests: `tests/components/*.test.tsx` — UI components with @testing-library
- Integration tests: `tests/integration/*.test.ts` — multi-service flows
- E2E tests: `tests/e2e/*.spec.ts` — full user journeys (Playwright)
- Mock only at system boundaries (external APIs, email). Never mock the database in integration tests.

## Forbidden

- Never commit `.env` files or secrets
- Never use `any` type — use `unknown` and narrow
- Never use inline styles
- Never bypass CSRF (`--no-verify`, skipping guards)
- Never push directly to master without review
