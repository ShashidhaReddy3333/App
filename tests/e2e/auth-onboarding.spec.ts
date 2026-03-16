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

test("owner can sign in, reach products, and create a product", async ({ page, browser }) => {
  const uniqueSuffix = Date.now().toString();
  const productName = `Demo Product ${uniqueSuffix}`;
  const sku = `DEMO-${uniqueSuffix}`;
  const inviteEmail = `staff-${uniqueSuffix}@demo.local`;

  await signInAndOpenDashboard(page, "owner@demo.local", "DemoPass!123");
  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText(/String must contain at least 2 character/).first()).toBeVisible();

  await page.getByLabel("Name").fill(productName);
  await page.getByLabel("Category", { exact: true }).fill("demo");
  await page.getByLabel("SKU").fill(sku);
  await page.getByLabel("Purchase price").fill("5");
  await page.getByLabel("Selling price").fill("8.99");
  await page.getByLabel("Par level").fill("10");
  await page.getByLabel("Opening stock").fill("12");
  await page.getByRole("button", { name: "Save product" }).click();

  await expect(page.getByRole("cell", { name: productName, exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Staff" }).click();
  await expect(page.getByRole("heading", { name: "Staff management" })).toBeVisible();
  await page.getByLabel("Email").fill(inviteEmail);
  await page.getByLabel("Role").selectOption("manager");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText("Invite created.")).toBeVisible();
  await expect(page.getByText(inviteEmail)).toBeVisible();

  const cashierContext = await browser.newContext();
  const cashierPage = await cashierContext.newPage();
  await signInAndOpenDashboard(cashierPage, "cashier@demo.local", "DemoPass!123");
  await cashierContext.close();

  await page.getByRole("link", { name: "Sessions" }).click();
  await expect(page.getByRole("heading", { name: "Session management" })).toBeVisible();
  const initialCards = await page.getByRole("button", { name: "Revoke" }).count();
  await expect(page.getByText("Casey Cashier")).toBeVisible();
  await page.getByRole("button", { name: "Revoke" }).first().click();
  await expect(page.getByText("Session revoked.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Revoke" })).toHaveCount(initialCards - 1);
});
