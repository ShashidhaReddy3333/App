import { existsSync } from "node:fs";
import process from "node:process";

import Stripe from "stripe";

import { db } from "../src/lib/db";
import { getRuntimeCheckIssues, requiresPersistentRateLimiting } from "../src/lib/env";
import { getRedisClient, isRedisAvailable } from "../src/lib/queue/redis";
import { STRIPE_CONFIG } from "../src/lib/stripe/config";

type CheckStatus = "PASS" | "FAIL" | "WARN";

type CheckResult = {
  name: string;
  status: CheckStatus;
  detail: string;
};

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile?.(file);
  }
}

async function runChecks() {
  const results: CheckResult[] = [];
  const runtimeIssues = getRuntimeCheckIssues();
  const blockingEnvIssues = runtimeIssues.filter((issue) => issue.severity === "error");

  results.push({
    name: "Environment variables",
    status: blockingEnvIssues.length === 0 ? "PASS" : "FAIL",
    detail:
      blockingEnvIssues.length === 0
        ? "Required runtime variables are present."
        : blockingEnvIssues.map((issue) => `${issue.key}: ${issue.message}`).join(" | "),
  });

  const runtimeWarnings = runtimeIssues.filter((issue) => issue.severity === "warning");
  if (runtimeWarnings.length > 0) {
    results.push({
      name: "Runtime warnings",
      status: "WARN",
      detail: runtimeWarnings.map((issue) => `${issue.key}: ${issue.message}`).join(" | "),
    });
  }

  try {
    await db.$queryRaw`SELECT 1`;
    results.push({
      name: "Database",
      status: "PASS",
      detail: "Database query succeeded.",
    });
  } catch (error) {
    results.push({
      name: "Database",
      status: "FAIL",
      detail: error instanceof Error ? error.message : "Database query failed.",
    });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    results.push({
      name: "Stripe",
      status: "FAIL",
      detail: "STRIPE_SECRET_KEY is not set.",
    });
  } else {
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: STRIPE_CONFIG.apiVersion,
      });
      await stripe.balance.retrieve();
      results.push({
        name: "Stripe",
        status: "PASS",
        detail: "Stripe API key is valid.",
      });
    } catch (error) {
      results.push({
        name: "Stripe",
        status: "FAIL",
        detail: error instanceof Error ? error.message : "Stripe API request failed.",
      });
    }
  }

  if (!isRedisAvailable()) {
    results.push({
      name: "Redis",
      status: requiresPersistentRateLimiting() ? "FAIL" : "WARN",
      detail: requiresPersistentRateLimiting()
        ? "Redis is required in production for durable rate limiting, but it is not configured."
        : "Redis is not configured.",
    });
  } else {
    try {
      const redis = getRedisClient();
      if (!redis) {
        throw new Error("Redis client could not be created.");
      }
      await redis.ping();
      results.push({
        name: "Redis",
        status: "PASS",
        detail: "Redis responded to ping.",
      });
    } catch (error) {
      results.push({
        name: "Redis",
        status: "FAIL",
        detail: error instanceof Error ? error.message : "Redis check failed.",
      });
    }
  }

  return results;
}

function printResults(results: CheckResult[]) {
  for (const result of results) {
    const line = `${result.status} ${result.name}: ${result.detail}`;
    if (result.status === "FAIL") {
      console.error(line);
      continue;
    }

    if (result.status === "WARN") {
      console.warn(line);
      continue;
    }

    console.info(line);
  }
}

async function main() {
  try {
    const results = await runChecks();
    printResults(results);

    if (results.some((result) => result.status === "FAIL")) {
      process.exitCode = 1;
      return;
    }

    console.info("Preflight checks passed.");
  } finally {
    await db.$disconnect().catch(() => undefined);
  }
}

void main();
