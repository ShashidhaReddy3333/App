import { expect, test } from "@playwright/test";

import { getPortalUrl, signInToPortal } from "./portal-url";

test("admin can approve a supplier request and activate portal access", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString();
  const email = `supplier-request-${suffix}@demo.local`;
  const password = "SupplierPassA123";
  const businessName = `Fresh Supply ${suffix}`;

  await page.goto(getPortalUrl("supply", "/sign-up"));
  await page.getByLabel("Contact name").fill("Taylor Supplier");
  await page.getByLabel("Supplier business").fill(businessName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("4165550123");
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Business notes").fill("Need portal access for catalog management.");
  await page.getByRole("button", { name: "Request supplier access" }).click();

  await expect(page).toHaveURL(/\/sign-up\?requested=1$/);
  await expect(
    page.getByRole("heading", { name: "Supplier access request submitted" })
  ).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await signInToPortal(adminPage, "admin", "admin@demo.local", "DemoPass!123");
  await expect(adminPage).toHaveURL(/\/admin$/);

  await adminPage.goto(getPortalUrl("admin", "/admin/supplier-requests"));
  await expect(adminPage.getByRole("heading", { name: "Supplier requests" })).toBeVisible();
  await adminPage
    .getByLabel(`Assign business for ${email}`)
    .selectOption({ label: "Shashi Mart (CA - retail store)" });
  await adminPage.getByRole("button", { name: `Approve request for ${email}` }).click();
  await expect(adminPage.getByText("Supplier request approved.")).toBeVisible();

  const supplierContext = await browser.newContext();
  const supplierPage = await supplierContext.newPage();

  await signInToPortal(supplierPage, "supply", email, password);
  await expect(supplierPage).toHaveURL(/\/dashboard$/);
  await expect(supplierPage.getByRole("heading", { name: "Supplier dashboard" })).toBeVisible();

  await supplierContext.close();
  await adminContext.close();
});
