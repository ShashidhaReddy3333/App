import { expect, test, type Page } from "@playwright/test";
import { signInToPortal } from "./portal-url";

async function signIn(page: Page, email: string, password: string) {
  await signInToPortal(page, "retail", email, password);
}

async function signInAndOpenDashboard(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

function parseCurrency(value: string) {
  const match = value.match(/([0-9]+\.[0-9]{2})/);
  if (!match) {
    throw new Error(`Unable to parse currency from: ${value}`);
  }
  return Number(match[1]);
}

test("cashier can reserve a cart and complete a split-payment sale", async ({ page }) => {
  await signInAndOpenDashboard(page, "cashier@demo.local", "DemoPass!123");
  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page.getByRole("heading", { name: "Checkout", exact: true })).toBeVisible();
  await expect(page.getByLabel("Product").first()).toContainText("Rice Bag");

  await page.getByRole("button", { name: "Reserve cart" }).click();
  await expect(page).toHaveURL(/saleId=/);
  await expect(page.getByRole("heading", { name: "Pending cart" })).toBeVisible();

  const totalDueValue = await page
    .getByText("Total due")
    .locator("xpath=following-sibling::*[1]")
    .textContent();
  const totalDue = parseCurrency(totalDueValue ?? "");
  const firstPaymentAmount = Number((totalDue / 2).toFixed(2));
  const secondPaymentAmount = Number((totalDue - firstPaymentAmount).toFixed(2));

  await page.getByLabel("Amount").first().fill(firstPaymentAmount.toFixed(2));
  await page.getByRole("button", { name: "Add payment" }).click();
  await page.getByLabel("Method").nth(1).selectOption("credit_card");
  await page.getByLabel("Provider").nth(1).selectOption("manual");
  await page.getByLabel("Amount").nth(1).fill("0");
  await page.getByLabel("Amount").nth(1).fill(secondPaymentAmount.toFixed(2));

  await page.getByRole("button", { name: "Complete sale" }).click();
  await expect(page.getByText("Sale completed.")).toBeVisible();
  if (!page.url().match(/\/sales\//)) {
    const saleId = new URL(page.url()).searchParams.get("saleId");
    if (!saleId) {
      throw new Error("Expected saleId query parameter after completing sale.");
    }
    await page.goto(`/sales/${saleId}`);
  }
  await expect(page).toHaveURL(/\/sales\//);
  await expect(page.getByRole("heading", { name: "Receipt" })).toBeVisible();
  await expect(page.getByText("Payments")).toBeVisible();
  await expect(page.getByText("credit card")).toBeVisible();
});
