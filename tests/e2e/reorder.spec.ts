import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("inventory staff sees reorder tools and is blocked from checkout", async ({ page }) => {
  await signIn(page, "inventory@demo.local", "DemoPass!123");

  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByRole("link", { name: "Reorder" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Checkout" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sessions" })).toHaveCount(0);

  await page.getByRole("link", { name: "Reorder" }).click();
  await expect(page.getByRole("heading", { name: "Reorder list" })).toBeVisible();
  await expect(page.getByText("Cooking Oil")).toBeVisible();

  await page.goto("/app/checkout");
  await expect(page).toHaveURL(/\/app\/forbidden/);
  await expect(page.getByText("Access restricted")).toBeVisible();
});
