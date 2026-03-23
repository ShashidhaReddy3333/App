import { expect, test } from "@playwright/test";

import { getPortalUrl } from "./portal-url";

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("main-host sign-in acts as a portal chooser", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(
    page.getByRole("heading", { name: "Sign in through the right Human Pulse portal" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Customer Portal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Retail Portal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Supplier Portal" })).toBeVisible();
});

test("customer portal rejects retailer credentials with portal-specific guidance", async ({
  page,
}) => {
  await page.goto(getPortalUrl("shop", "/sign-in"));
  await page.getByLabel("Email").fill("owner@demo.local");
  await page.getByLabel("Password").fill("DemoPass!123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText(
      "This account does not belong in the shop portal. Use the retail portal instead."
    )
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create customer account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Retail sign in instead" })).toBeVisible();
});

test("main-host dashboard path no longer cross-redirects into a portal", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(new RegExp(`^${escapeForRegex(getPortalUrl("main", "/"))}`));
  await expect(
    page.getByRole("heading", {
      name: "Human Pulse is a connected business ecosystem, not one generic app for everyone.",
    })
  ).toBeVisible();
});
