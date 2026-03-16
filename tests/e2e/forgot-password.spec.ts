import { expect, test } from "@playwright/test";

test("forgot password exposes the demo token in demo mode", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("owner@demo.local");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.locator("p.text-sm.text-primary")).toContainText("In demo mode");
  await expect(page.getByText("Demo reset token:")).toBeVisible();
});
