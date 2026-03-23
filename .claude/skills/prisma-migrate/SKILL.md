---
name: prisma-migrate
description: Create and apply Prisma database migrations safely, with environment awareness
disable-model-invocation: true
---

Guide the user through Prisma migration work for this project.

Workflow:

1. Ask what schema change they are making and restate it before running migration commands.
2. Inspect the current schema and migration state with `corepack pnpm prisma migrate status`.
3. For local development changes, use `corepack pnpm prisma:migrate:dev` and ask the user for a clear migration name if one was not provided.
4. For hosted preview or production databases, use `corepack pnpm prisma:migrate:deploy`.
5. After a migration succeeds, run `corepack pnpm prisma:generate` to refresh the Prisma client.
6. Suggest `corepack pnpm prisma:seed` only when the schema change requires new demo data or reference data.

Safety rules:

- Never run `corepack pnpm prisma:reset` without explicit user confirmation. It is destructive.
- Never use `migrate dev` against a hosted production database.
- Prefer checked-in migrations over `db push` for lasting schema changes.
- If the environment is unclear, stop and confirm whether the target is local Docker Postgres or a hosted database before applying anything.

Repo context:

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Local database: Docker Postgres via `docker-compose.yml`
- Prisma scripts come from `package.json`
