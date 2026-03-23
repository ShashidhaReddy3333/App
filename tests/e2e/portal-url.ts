import type { Page } from "@playwright/test";

type Portal = "main" | "shop" | "retail" | "supply" | "admin";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const KNOWN_PORTALS = new Set(["shop", "retail", "supply", "admin"]);

function getRootHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return "localhost";
  }

  const [first, ...rest] = normalized.split(".");
  if (first && rest.length > 0 && KNOWN_PORTALS.has(first)) {
    return rest.join(".");
  }

  return normalized;
}

export function getPortalUrl(portal: Portal, path = "/") {
  const base = new URL(APP_URL);
  if (portal === "main") {
    return new URL(path, base).toString();
  }
  const rootHostname = getRootHostname(base.hostname);
  const hostname =
    rootHostname === "localhost" ? `${portal}.localhost` : `${portal}.${rootHostname}`;
  const origin = `${base.protocol}//${hostname}${base.port ? `:${base.port}` : ""}`;

  return new URL(path, origin).toString();
}

export async function signInToPortal(page: Page, portal: Portal, email: string, password: string) {
  await page.goto(getPortalUrl(portal, "/sign-in"));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
