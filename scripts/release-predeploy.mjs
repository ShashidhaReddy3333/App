import { execSync } from "node:child_process";

const STEPS = [
  { name: "Runtime environment", command: "corepack pnpm env:check" },
  { name: "External service preflight", command: "corepack pnpm preflight" },
  { name: "Prisma migration status", command: "corepack pnpm prisma:migrate:status" },
  { name: "Lint", command: "corepack pnpm lint" },
  { name: "Typecheck", command: "corepack pnpm typecheck" },
  { name: "Production build", command: "corepack pnpm build" },
  { name: "Integrity report", command: "corepack pnpm ops:check-data:json" },
];

function runStep(step) {
  console.info(`\n==> ${step.name}`);
  execSync(step.command, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}

try {
  for (const step of STEPS) {
    runStep(step);
  }

  console.info("\nPredeploy checks passed.");
  console.info(
    "Post-deploy: review legacy compatibility traffic using docs/LEGACY_COMPATIBILITY_RETIREMENT.md."
  );
} catch (error) {
  console.error("\nPredeploy checks failed.");
  process.exitCode = 1;
  throw error;
}
