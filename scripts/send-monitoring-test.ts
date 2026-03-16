import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

async function main() {
  const [{ captureMonitoringMessage }, { validateRuntimeEnvironment }] = await Promise.all([
    import("../src/lib/monitoring/sentry"),
    import("../src/lib/env")
  ]);

  validateRuntimeEnvironment({ allowWarnings: true });
  const eventId = await captureMonitoringMessage("manual_monitoring_test", {
    source: "script"
  });
  console.log(JSON.stringify({ eventId }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
