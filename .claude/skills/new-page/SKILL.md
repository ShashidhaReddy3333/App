---
name: new-page
description: Scaffold a new Next.js App Router page in this project — correct shell selection, auth guard, PageHeader, loading skeleton, breadcrumbs. Use when asked to create a new page or route segment.
user-invocable: false
---

You are a page scaffolding expert for this Next.js 15 App Router project. Apply these conventions precisely.

## Portal shells

This project has four distinct portals, each with its own shell and guards:

| Portal              | Route prefix           | Layout                                | Guard                              |
| ------------------- | ---------------------- | ------------------------------------- | ---------------------------------- |
| Staff/business app  | `/app/`                | `src/app/app/layout.tsx` → `AppShell` | `requireAppSession()`              |
| Customer storefront | `/shop/`, `/customer/` | `src/app/(customer)/`                 | `requireAnySession()` + role check |
| Supplier portal     | `/supplier/`           | `src/app/supplier/layout.tsx`         | `requireRole("supplier")`          |
| Platform admin      | `/admin/`              | `src/app/admin/layout.tsx`            | `requireRole("platform_admin")`    |

## File structure for a new staff app page

Create three files:

```
src/app/app/<section>/page.tsx        ← main page (Server Component)
src/app/app/<section>/loading.tsx     ← loading fallback
```

No need for a `layout.tsx` unless the section introduces its own sub-navigation or nested shell — the parent `src/app/app/layout.tsx` handles auth and `AppShell`.

## Standard page template (`src/app/app/<section>/page.tsx`)

```tsx
import { PageHeader } from "@/components/page-header";
import { requireAppSession } from "@/lib/auth/guards";
// import { requirePermission } from "@/lib/auth/guards"; // use instead if role-gating is needed
import { yourQueryService } from "@/lib/services/<domain>-query-service";

export default async function <Section>Page() {
  const session = await requireAppSession();
  // const session = await requirePermission("permission_key"); // role-gated alternative

  const data = await yourQueryService(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title="<Section Title>"
        description="<One sentence describing what this page does.>"
        breadcrumbs={[{ label: "<Section>", href: "/app/<section>" }]}
        // actions={<Button>Primary action</Button>}
      />
      {/* page content */}
    </div>
  );
}
```

## Loading fallback (`loading.tsx`)

Always create a `loading.tsx` alongside every `page.tsx`:

```tsx
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton />;
}
```

## Auth guard selection

| Requirement                                                 | Guard to use                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Any authenticated business user                             | `requireAppSession()`                                            |
| Specific permission (e.g. only staff with "reports" access) | `requirePermission("reports")`                                   |
| Specific role (e.g. owner only)                             | `requireRole("owner")` or `requireRoles(["owner", "manager"])`   |
| Customer portal                                             | `requireAnySession()` + check `session.user.role === "customer"` |
| Supplier portal                                             | `requireRole("supplier")`                                        |
| Admin panel                                                 | `requireRole("platform_admin")`                                  |

All guards are in `src/lib/auth/guards.ts`. They redirect to the appropriate sign-in or forbidden page automatically.

## Permission-gated pages

When only some roles can access a page, use `requirePermission` (which checks `hasPermission` from `src/lib/auth/permissions.ts`):

```tsx
const session = await requirePermission("procurement");
```

For owner-only dashboards or settings pages use `requireRole("owner")`.

## PageHeader breadcrumbs

Breadcrumbs represent the path from Dashboard down to the current page:

```tsx
// Top-level section (one crumb)
breadcrumbs={[{ label: "Products" }]}

// Nested page (parent is a link, current is not)
breadcrumbs={[
  { label: "Procurement", href: "/app/procurement" },
  { label: "Purchase Order #123" },
]}
```

## Server Component vs Client Component split

Keep `page.tsx` as a Server Component — fetch data there, pass it as props to any client components that need interactivity. Don't add `"use client"` to the page file.

Extract interactive parts (forms, filters, modals) into separate `<SectionForm>.tsx` or `<SectionActions>.tsx` client components under `src/components/`.

## Data fetching

Call service functions directly in the page — no `fetch()` wrappers or API calls from Server Components. Service functions import from `@/lib/db` and run server-side:

```tsx
const orders = await listOrders(session.user.businessId!);
```

Always include `businessId` scope. For location-scoped data, read the active location from the cookie using `getBusinessLocationContext(businessId)` from `@/lib/server/location-context`.

## Empty states and loading inline

- Zero-data screens: `<StateCard>` / `<EmptyState>` from `@/components/state-card`
- Full-page skeleton: `<PageSkeleton>` (in `loading.tsx`)
- Inline skeleton rows: `<Skeleton>` from `@/components/ui/skeleton`
