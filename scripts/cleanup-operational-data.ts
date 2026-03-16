import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

async function main() {
  const [{ cleanupOperationalData }, { validateRuntimeEnvironment }] = await Promise.all([
    import("../src/lib/services/operations-service"),
    import("../src/lib/env")
  ]);

  validateRuntimeEnvironment({ allowWarnings: true });
  const summary = await cleanupOperationalData();
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
