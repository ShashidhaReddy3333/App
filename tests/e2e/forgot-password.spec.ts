import { expect, test } from "@playwright/test";

test("forgot password shows a visible success state", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("owner@demo.local");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.locator("p.text-sm.text-primary")).toContainText("If the account exists, a reset link is ready.");
});
