import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signInAndOpenDashboard(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test("owner can sign in, reach products, and create a product", async ({ page }) => {
  const uniqueSuffix = Date.now().toString();
  const productName = `Demo Product ${uniqueSuffix}`;
  const sku = `DEMO-${uniqueSuffix}`;

  await signInAndOpenDashboard(page, "owner@demo.local", "DemoPass!123");
  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  await page.getByLabel("Name").fill(productName);
  await page.getByLabel("Category", { exact: true }).fill("demo");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Purchase price").fill("5");
  await page.getByLabel("Selling price").fill("8.99");
  await page.getByLabel("Par level").fill("10");
  await page.getByLabel("Opening stock").fill("12");
  await page.getByRole("button", { name: "Save product" }).click();

  await expect(page.getByRole("cell", { name: productName, exact: true })).toBeVisible();
});
