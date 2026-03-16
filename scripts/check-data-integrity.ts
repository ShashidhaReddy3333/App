import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

async function main() {
  const [{ db }, { validateRuntimeEnvironment }] = await Promise.all([import("../src/lib/db"), import("../src/lib/env")]);

  validateRuntimeEnvironment({ allowWarnings: true });

  const balances = await db.inventoryBalance.findMany({
    include: {
      product: true,
      location: true
    }
  });

  const issues: string[] = [];
  for (const balance of balances) {
    const onHand = Number(balance.onHandQuantity);
    const reserved = Number(balance.reservedQuantity);
    const available = Number(balance.availableQuantity);
    if (reserved < 0 || onHand < 0 || available < 0) {
      issues.push(`Negative inventory detected for ${balance.product.name} at ${balance.location.name}.`);
    }
    if (Number((onHand - reserved).toFixed(3)) !== Number(available.toFixed(3))) {
      issues.push(`Availability mismatch for ${balance.product.name} at ${balance.location.name}: onHand=${onHand}, reserved=${reserved}, available=${available}.`);
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(issue);
    }
    process.exit(1);
  }

  console.log("Inventory integrity OK.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
