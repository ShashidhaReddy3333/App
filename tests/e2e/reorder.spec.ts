import { expect, test, type Page } from "@playwright/test";
import { signInToPortal } from "./portal-url";

async function signIn(page: Page, email: string, password: string) {
  await signInToPortal(page, "retail", email, password);
}

test("inventory staff sees reorder tools and is blocked from checkout", async ({ page }) => {
  await signIn(page, "inventory@demo.local", "DemoPass!123");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("link", { name: "Reorder" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Checkout" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Suppliers" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sessions" })).toHaveCount(0);

  await page.getByRole("link", { name: "Reorder" }).click();
  await expect(page.getByRole("heading", { name: "Reorder list" })).toBeVisible();
  await expect(page.getByText("Cooking Oil")).toBeVisible();

  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/forbidden/);
  await expect(page.getByText("Access restricted")).toBeVisible();

  await page.goto("/suppliers");
  await expect(page).toHaveURL(/\/forbidden/);
  await expect(page.getByText("Access restricted")).toBeVisible();
});
