import { expect, test, type Page } from "@playwright/test";
import { signInToPortal } from "./portal-url";

async function signIn(page: Page, portal: "retail" | "supply", email: string, password: string) {
  await signInToPortal(page, portal, email, password);
}

test("manager can create and receive a purchase order", async ({ page }) => {
  await signIn(page, "retail", "manager@demo.local", "DemoPass!123");
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "Procurement" }).click();
  await expect(page.getByRole("heading", { name: "Procurement" })).toBeVisible();
  const receiveButtons = page.getByRole("button", { name: "Receive remaining stock" });
  const initialCount = await receiveButtons.count();

  await page
    .getByLabel("Supplier", { exact: true })
    .selectOption({ label: "North Foods Wholesale" });
  await page.getByLabel("Quantity").fill("10");
  await page.getByRole("button", { name: "Create purchase order" }).click();
  await expect(receiveButtons).toHaveCount(initialCount + 1);

  await receiveButtons.last().click();
  await expect(page.getByText("Goods received and inventory updated.")).toBeVisible();
});

test("supplier can manage the wholesale catalog and update order status", async ({ page }) => {
  const uniqueSuffix = Date.now().toString();

  await signIn(page, "supply", "supplier@demo.local", "DemoPass!123");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Supplier dashboard" })).toBeVisible();

  await page.goto("/catalog");
  await expect(page).toHaveURL(/\/catalog/);
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

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/orders/);
  await expect(page.getByRole("heading", { name: "Retailer purchase orders" })).toBeVisible();
  await page.getByRole("combobox").first().selectOption("accepted");
  await page.getByRole("button", { name: "Update" }).first().click();
  await expect(page.getByRole("combobox").first()).toHaveValue("accepted");
});
