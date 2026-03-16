import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

async function main() {
  const [{ cleanupExpiredReservations }, { validateRuntimeEnvironment }] = await Promise.all([
    import("../src/lib/services/sales-service"),
    import("../src/lib/env")
  ]);

  validateRuntimeEnvironment({ allowWarnings: true });
  await cleanupExpiredReservations();
  console.log("Expired reservations cleaned up.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
