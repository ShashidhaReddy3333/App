import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("manager can create and receive a purchase order", async ({ page }) => {
  await signIn(page, "manager@demo.local", "DemoPass!123");
  await expect(page).toHaveURL(/\/app\/dashboard/);

  await page.getByRole("link", { name: "Procurement" }).click();
  await expect(page.getByRole("heading", { name: "Procurement" })).toBeVisible();
  const receiveButtons = page.getByRole("button", { name: "Receive remaining stock" });
  const initialCount = await receiveButtons.count();

  await page.getByLabel("Supplier", { exact: true }).selectOption({ label: "North Foods Wholesale" });
  await page.getByLabel("Quantity").fill("10");
  await page.getByRole("button", { name: "Create purchase order" }).click();
  await expect(receiveButtons).toHaveCount(initialCount + 1);

  await receiveButtons.last().click();
  await expect(page.getByText("Goods received and inventory updated.")).toBeVisible();
});

test("supplier can manage the wholesale catalog and update order status", async ({ page }) => {
  const uniqueSuffix = Date.now().toString();

  await signIn(page, "supplier@demo.local", "DemoPass!123");
  await expect(page).toHaveURL(/\/supplier\/dashboard/);
  await expect(page.getByRole("heading", { name: "Supplier dashboard" })).toBeVisible();

  await page.goto("/supplier/catalog");
  await expect(page).toHaveURL(/\/supplier\/catalog/);
  await expect(page.getByText("Add wholesale product")).toBeVisible();
  await page.getByLabel("Name").fill(`Promo Case ${uniqueSuffix}`);
  await page.getByLabel("MOQ").fill("5");
  await page.getByLabel("Case pack size").fill("5");
  await page.getByLabel("Wholesale price").fill("13.75");
  await page.getByLabel("Lead time (days)").fill("3");
  await page.getByLabel("Delivery fee").fill("12");
  await page.getByLabel("Service area").fill("Downtown Toronto");
  await page.getByRole("button", { name: "Save wholesale product" }).click();
  await expect(page.getByText(`Promo Case ${uniqueSuffix}`)).toBeVisible();

  await page.goto("/supplier/orders");
  await expect(page).toHaveURL(/\/supplier\/orders/);
  await expect(page.getByRole("heading", { name: "Retailer purchase orders" })).toBeVisible();
  await page.getByRole("combobox").first().selectOption("accepted");
  await page.getByRole("button", { name: "Update" }).first().click();
  await expect(page.getByRole("combobox").first()).toHaveValue("accepted");
});
