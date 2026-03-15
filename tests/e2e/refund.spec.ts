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

test("manager can open a completed sale and create a refund", async ({ page }) => {
  await signInAndOpenDashboard(page, "manager@demo.local", "DemoPass!123");
  await page.goto("/app/sales");
  await expect(page.getByRole("heading", { name: "Sales history" })).toBeVisible();

  const saleLink = page.getByRole("link", { name: /RCPT-000002/ }).first();
  const href = await saleLink.getAttribute("href");
  if (!href) {
    throw new Error("Expected seeded sale link for RCPT-000002.");
  }
  await page.goto(href);
  await expect(page.getByRole("heading", { name: "RCPT-000002" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create refund" })).toBeVisible();

  await page.getByLabel("Note").fill("Package returned");
  await page.getByRole("button", { name: "Create refund" }).click();
  await expect(page.getByText("Refund created.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("refunded partially")).toBeVisible();
});
