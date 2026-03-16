import { existsSync } from "node:fs";
import process from "node:process";

import { getRuntimeCheckIssues } from "../src/lib/env";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

const issues = getRuntimeCheckIssues();

for (const issue of issues) {
  const line = `${issue.severity.toUpperCase()}: ${issue.key} - ${issue.message}`;
  if (issue.severity === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}

if (issues.some((issue) => issue.severity === "error")) {
  process.exit(1);
}

console.log("Runtime configuration OK.");
