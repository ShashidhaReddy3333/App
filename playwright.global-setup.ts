import { execSync } from "node:child_process";

function run(command: string) {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDatabaseReady() {
  try {
    run("corepack pnpm db:health");
    return;
  } catch {
    // Fall through and try to bootstrap the local database container.
  }

  try {
    run("corepack pnpm db:up");
  } catch (error) {
    throw new Error(
      "Playwright setup could not start PostgreSQL. Start Docker Desktop or provide a reachable DATABASE_URL before running e2e tests.",
      { cause: error }
    );
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      run("corepack pnpm db:health");
      return;
    } catch {
      await sleep(2_000);
    }
  }

  throw new Error(
    "Playwright setup started PostgreSQL but the database never became ready. Check Docker health and DATABASE_URL settings."
  );
}

export default async function globalSetup() {
  await ensureDatabaseReady();
  run("corepack pnpm prisma:reset");
  run("corepack pnpm prisma:seed");
  run("corepack pnpm build");
}
