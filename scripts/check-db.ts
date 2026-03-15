import { existsSync } from "node:fs";
import process from "node:process";

import { PrismaClient, Prisma } from "@prisma/client";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

const RETRY_COUNT = 15;
const RETRY_DELAY_MS = 2_000;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env first.`);
  }
  return value;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
      try {
        await client.$connect();
        await client.$queryRaw`SELECT 1`;
        break;
      } catch (error) {
        if (attempt === RETRY_COUNT) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    console.log("Database connection OK.");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error(`Database is unreachable. Check DATABASE_URL and ensure PostgreSQL is running.\n${error.message}`);
    }
    throw error;
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
