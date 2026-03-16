import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("corepack pnpm db:health", {
    stdio: "inherit",
    env: process.env
  });

  execSync("corepack pnpm prisma:reset", {
    stdio: "inherit",
    env: process.env
  });

  execSync("corepack pnpm prisma:seed", {
    stdio: "inherit",
    env: process.env
  });

  execSync("corepack pnpm build", {
    stdio: "inherit",
    env: process.env
  });
}
