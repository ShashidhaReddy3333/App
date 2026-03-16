import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("customer can browse the storefront, checkout, and view the order", async ({ page }) => {
  await signIn(page, "customer@demo.local", "DemoPass!123");
  await expect(page).toHaveURL(/\/shop/);
  await expect(page.getByRole("heading", { name: /online ordering/i })).toBeVisible();

  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(page.getByText("Added to cart.")).toBeVisible();

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();

  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByText(/^ORD-/)).toBeVisible();
  await expect(page.getByText("Payments and status history")).toBeVisible();
});
