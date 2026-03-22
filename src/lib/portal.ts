import { headers } from "next/headers";

export type Portal = "main" | "shop" | "retail" | "supply" | "admin";

type PortalPresentation = {
  label: string;
  signInTitle: string;
  signInDescription: string;
  signInMetadataTitle: string;
  forbiddenTitle: string;
  forbiddenDescription: string;
};

const PORTAL_PRESENTATION: Record<Portal, PortalPresentation> = {
  main: {
    label: "Human Pulse",
    signInTitle: "Sign into your business",
    signInDescription:
      "Use email and password to access the store dashboard, checkout, reports, and staff tools.",
    signInMetadataTitle: "Sign In | Human Pulse",
    forbiddenTitle: "Access restricted",
    forbiddenDescription:
      "Your current account cannot open this area. Sign in with the correct role or return to your default dashboard.",
  },
  shop: {
    label: "Customer Shop",
    signInTitle: "Sign in to the customer shop",
    signInDescription:
      "Access your cart, orders, and checkout history for the Human Pulse storefront.",
    signInMetadataTitle: "Customer Sign In | Human Pulse",
    forbiddenTitle: "Customer access required",
    forbiddenDescription:
      "This storefront is available to customer accounts. Sign in with a customer profile to continue.",
  },
  retail: {
    label: "Retail Portal",
    signInTitle: "Sign in to the retail dashboard",
    signInDescription:
      "Open checkout, inventory, reports, and day-to-day store operations for your business.",
    signInMetadataTitle: "Retail Sign In | Human Pulse",
    forbiddenTitle: "Retail access required",
    forbiddenDescription:
      "This portal is reserved for retailer staff accounts. Use an owner, manager, or staff account to continue.",
  },
  supply: {
    label: "Supplier Portal",
    signInTitle: "Sign in to the supplier portal",
    signInDescription:
      "Manage wholesale products, review retailer purchase orders, and track supplier activity.",
    signInMetadataTitle: "Supplier Sign In | Human Pulse",
    forbiddenTitle: "Supplier access required",
    forbiddenDescription:
      "This portal is reserved for supplier accounts. Sign in with a supplier-linked account to continue.",
  },
  admin: {
    label: "Admin Portal",
    signInTitle: "Sign in to the admin portal",
    signInDescription:
      "Access platform-wide business, user, dispute, and announcement management tools.",
    signInMetadataTitle: "Admin Sign In | Human Pulse",
    forbiddenTitle: "Administrator access required",
    forbiddenDescription:
      "This portal is limited to platform administrators. Sign in with an administrator account to continue.",
  },
};

export function normalizePortal(value: string | null | undefined): Portal {
  if (value === "shop" || value === "retail" || value === "supply" || value === "admin") {
    return value;
  }

  return "main";
}

export async function getCurrentPortal(): Promise<Portal> {
  const headerStore = await headers();
  return normalizePortal(headerStore.get("x-portal"));
}

export function getPortalPresentation(portal: Portal) {
  return PORTAL_PRESENTATION[portal];
}
