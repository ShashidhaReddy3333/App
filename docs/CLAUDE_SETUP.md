# Claude Setup

This repo includes shared Claude project assets under `.claude/` plus local-only MCP installation steps for each developer machine.

## Shared Repo Assets

- `.claude/settings.json`
  - Shared hooks for this project
  - Keeps `.claude/settings.local.json` free for local permissions and machine-specific config
- `.claude/agents/security-reviewer.md`
  - Security review prompt tailored to this repo's auth, RBAC, Stripe, and tenant-isolation code
- `.claude/agents/api-documenter.md`
  - API documentation prompt tailored to `src/app/api/**`, Zod schemas, and route guards
- `.claude/skills/prisma-migrate/SKILL.md`
  - Guided Prisma migration workflow for local and hosted environments

## Hook Behavior

The shared hooks in `.claude/settings.json` are intentionally PowerShell-safe because this workspace is commonly used on Windows.

- `PreToolUse` on `Edit|Write`
  - Blocks direct edits to `.env` and `.env.local`
  - Prints: `BLOCKED: Direct edits to .env files are not allowed. Edit .env.example instead.`
- `PostToolUse` on `Edit|Write`
  - Runs `corepack pnpm typecheck` from the repo root
  - Prints only the last 20 lines so edit feedback stays readable
  - Does not replace full CI or manual verification before merge

## Local MCP Setup

MCP registration is machine-local setup. These commands are documented here but are not committed as repo state.

Install `context7` for live library documentation:

```powershell
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

Install `playwright` MCP for interactive browser automation:

```powershell
claude mcp add playwright -- npx -y @playwright/mcp
```

## Usage Examples

Security review:

```text
Use the security-reviewer agent to audit src/app/api/stripe/webhooks/route.ts and related auth or tenant-isolation risks.
```

API documentation:

```text
Use the api-documenter agent to document src/app/api/procurement/purchase-orders/route.ts in OpenAPI 3.1 YAML.
```

Prisma migration:

```text
/prisma-migrate add a nullable supplier leadTimeDays field and backfill defaults
```

Version-specific docs lookup with `context7`:

```text
How do I model Prisma cursor pagination for purchase orders? use context7
```

Interactive E2E debugging with Playwright MCP:

```text
Use playwright MCP to reproduce the checkout failure in the seeded local app.
```

## Notes

- Keep secrets in `.env` or `.env.local`; update `.env.example` when the environment contract changes.
- Keep shared Claude behavior in `.claude/settings.json`.
- Keep machine-local permissions and personal overrides in `.claude/settings.local.json`.
