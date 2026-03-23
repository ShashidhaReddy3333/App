---
name: frontend-design
description: Expert guidance for building UI components and pages in this Next.js 15 + shadcn/ui + Tailwind project. Use when asked to create or update components, pages, layouts, or styles.
user-invocable: false
---

You are a frontend design expert for this Next.js 15 App Router project. Apply these conventions whenever building or editing UI.

## Tech stack

- **Framework**: Next.js 15 App Router (RSC-first — default to Server Components, add `"use client"` only when needed)
- **Component library**: shadcn/ui (Radix UI primitives + CVA + `cn()` utility)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Icons**: `lucide-react`
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Tables**: TanStack React Table via the project's `<DataTable>` wrapper
- **Toasts**: `sonner` (via `toast.success()`, `toast.error()`)
- **Charts**: Recharts

## Tailwind and theming

Always use CSS variable tokens — never raw colors. Key tokens:

| Token                                    | Use                              |
| ---------------------------------------- | -------------------------------- |
| `bg-background` / `text-foreground`      | Page background and primary text |
| `bg-card` / `text-card-foreground`       | Card surfaces                    |
| `bg-primary` / `text-primary-foreground` | Brand action color               |
| `bg-destructive` / `text-white`          | Danger actions                   |
| `text-muted-foreground`                  | Secondary/subdued text           |
| `border-border`                          | Standard borders                 |
| `bg-[hsl(var(--surface-low))]`           | Subtle raised surfaces           |
| `text-success` / `text-warning`          | Status colors                    |

Custom brand tokens: `uber-black`, `uber-green`, `uber-grey`.

Custom shadows: `shadow-panel`, `shadow-panel-hover`, `shadow-float`.

## Component conventions

### UI primitives (`src/components/ui/`)

- Built with `cva` + `VariantProps` + `cn()` — follow the button pattern exactly
- `forwardRef` on all interactive elements
- Accept `className` as last override via `cn()`
- `asChild` prop (via Radix `Slot`) where composition is needed

### Feature components (`src/components/`)

- One component per file, named with PascalCase matching the filename
- Server Components by default; add `"use client"` only for interactivity, event handlers, or hooks
- Import from `@/components/ui/*` for primitives — never re-implement buttons, inputs, etc.

### Page layout

Follow the `PageHeader` pattern for all app pages:

```tsx
<PageHeader
  title="..."
  description="..."
  breadcrumbs={[{ label: "Section", href: "/app/section" }]}
  actions={<Button>...</Button>}
/>
```

Standard page shell:

```tsx
<div className="space-y-6">
  <PageHeader ... />
  <div className="...content...">
    {/* main content */}
  </div>
</div>
```

### Cards

Use `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>` from `@/components/ui/card`. Apply `shadow-panel` for lift.

### Typography scale

- Page title: `text-3xl font-semibold tracking-[-0.03em] sm:text-4xl`
- Section label (caps): `section-label` class (defined in globals.css)
- Muted/secondary text: `text-sm text-muted-foreground leading-6`
- Breadcrumb nav: `text-[0.72rem] font-bold uppercase tracking-[0.18em] text-muted-foreground`

### Buttons

Use the `<Button>` primitive. Available variants: `default`, `secondary`, `ghost`, `outline`, `destructive`, `uber-green`. Sizes: `default`, `sm`, `lg`, `icon`.

### Forms

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// 1. Define Zod schema in src/lib/schemas/
// 2. useForm({ resolver: zodResolver(schema) })
// 3. Use <Input>, <Label>, <Select> from @/components/ui/
// 4. Show errors inline: {errors.field?.message}
// 5. On success: toast.success("..."); router.push("...")
// 6. On error: toast.error(err.message ?? "Something went wrong")
```

### Status display

Use `<StatusBadge>` from `@/components/status-badge` for order/procurement/session statuses. Never roll custom badge colors.

### Empty states

Use `<StateCard>` from `@/components/state-card` for empty lists, errors, and zero-data screens.

### Loading skeletons

Use `<PageSkeleton>` for full-page loads. For inline loading, use `<Skeleton>` from `@/components/ui/skeleton`.

### Tables

Use the project's `<DataTable>` wrapper (`@/components/data-table`) with TanStack column definitions. Do not build raw `<table>` elements for data grids.

## Routing and navigation

- All app routes live under `src/app/(app)/` (authenticated shell)
- Customer portal routes: `src/app/(customer)/`
- Public routes: `src/app/(public)/`
- Use typed `Route` from `next` for `href` props: `href={"/app/dashboard" as Route}`
- Use `useRouter()` from `next/navigation` (not `next/router`) in client components

## Accessibility

- All interactive elements need visible focus styles (`focus-visible:ring-2 focus-visible:ring-ring`)
- Form inputs must have associated `<Label htmlFor="...">` or `aria-label`
- Icon-only buttons need `aria-label`
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<header>`, not generic `<div>` stacks
