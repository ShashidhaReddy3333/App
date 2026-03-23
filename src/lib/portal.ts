import type { UserRole } from "@prisma/client";
import { headers } from "next/headers";

import { env } from "@/lib/env";

export type Portal = "main" | "shop" | "retail" | "supply" | "admin";

type PrefixRewrite = {
  from: string;
  to: string;
};

type PortalPresentation = {
  label: string;
  theme: Portal;
  signInTitle: string;
  signInDescription: string;
  signInMetadataTitle: string;
  signInCardTitle: string;
  signInCardDescription: string;
  signInSubmitLabel: string;
  signUpLabel: string | null;
  signUpHref: string | null;
  forbiddenTitle: string;
  forbiddenDescription: string;
};

type PortalDefinition = {
  presentation: PortalPresentation;
  allowedRoles: readonly UserRole[];
  postSignInPath: string;
  workspaceHomePath: string;
  allowedPrefixes: readonly string[];
  allowedApiPrefixes: readonly string[];
  publicRewrites: readonly PrefixRewrite[];
  cleanToLegacyRewrites: readonly PrefixRewrite[];
  legacyToCleanRewrites: readonly PrefixRewrite[];
};

const SHARED_AUTH_API_PREFIXES = [
  "/api/auth/sign-out",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/csrf-token",
  "/api/auth/resend-verification",
] as const;

const UNIVERSAL_ALLOWED_PREFIXES = ["/privacy", "/terms", "/offline"] as const;
const UNIVERSAL_ALLOWED_API_PREFIXES = [
  "/api/health",
  "/api/readiness",
  "/api/internal/",
  "/api/stripe/webhooks",
] as const;

const PORTAL_AUTH_API_PREFIXES = [
  "/api/auth/customer/sign-in",
  "/api/auth/customer/sign-up",
  "/api/auth/retail/sign-in",
  "/api/auth/retail/sign-up",
  "/api/auth/supplier/sign-in",
  "/api/auth/supplier/sign-up",
  "/api/auth/admin/sign-in",
] as const;

function buildInternalRewrites(
  portal: Exclude<Portal, "admin">,
  prefixes: readonly string[]
): readonly PrefixRewrite[] {
  return prefixes.map((prefix) => ({
    from: prefix,
    to: prefix === "/" ? `/portal/${portal}` : `/portal/${portal}${prefix}`,
  }));
}

const MAIN_PUBLIC_REWRITES = [
  { from: "/", to: "/" },
  { from: "/sign-in", to: "/sign-in" },
] as const satisfies readonly PrefixRewrite[];
const MAIN_PUBLIC_PREFIXES = [
  "/",
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  ...UNIVERSAL_ALLOWED_PREFIXES,
] as const;
const MAIN_ALLOWED_API_PREFIXES = [
  ...UNIVERSAL_ALLOWED_API_PREFIXES,
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/customer-sign-up",
  "/api/auth/supplier-sign-up",
  "/api/auth/sign-out",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/csrf-token",
  "/api/auth/resend-verification",
] as const;

const SHOP_PUBLIC_REWRITES = buildInternalRewrites("shop", [
  "/",
  "/shop",
  "/cart",
  "/orders",
  "/marketplace",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

const RETAIL_PUBLIC_REWRITES = buildInternalRewrites("retail", [
  "/",
  "/dashboard",
  "/onboarding",
  "/checkout",
  "/sales",
  "/orders",
  "/refunds",
  "/products",
  "/suppliers",
  "/reorder",
  "/procurement",
  "/reports",
  "/locations",
  "/staff",
  "/notifications",
  "/sessions",
  "/ops",
  "/accept-invite",
  "/forbidden",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

const SUPPLY_PUBLIC_REWRITES = buildInternalRewrites("supply", [
  "/",
  "/dashboard",
  "/catalog",
  "/orders",
  "/forbidden",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

const ADMIN_PUBLIC_REWRITES = [
  { from: "/", to: "/admin" },
] as const satisfies readonly PrefixRewrite[];

const PORTAL_DEFINITIONS: Record<Portal, PortalDefinition> = {
  main: {
    presentation: {
      label: "Human Pulse",
      theme: "main",
      signInTitle: "Choose your portal",
      signInDescription:
        "Human Pulse runs three purpose-built web experiences. Open the right portal to sign in or create an account.",
      signInMetadataTitle: "Choose Portal | Human Pulse",
      signInCardTitle: "Portal access",
      signInCardDescription:
        "Select the customer, retailer, or supplier portal. Each portal has its own sign-in and onboarding flow.",
      signInSubmitLabel: "Continue",
      signUpLabel: null,
      signUpHref: null,
      forbiddenTitle: "Access restricted",
      forbiddenDescription:
        "This route belongs to a dedicated Human Pulse portal. Open the matching portal to continue.",
    },
    allowedRoles: [],
    postSignInPath: "/",
    workspaceHomePath: "/",
    allowedPrefixes: MAIN_PUBLIC_PREFIXES,
    allowedApiPrefixes: MAIN_ALLOWED_API_PREFIXES,
    publicRewrites: MAIN_PUBLIC_REWRITES,
    cleanToLegacyRewrites: [],
    legacyToCleanRewrites: [],
  },
  shop: {
    presentation: {
      label: "Customer Portal",
      theme: "shop",
      signInTitle: "Sign in to the customer portal",
      signInDescription:
        "Track orders, reorder favorites, and move through checkout faster with your Human Pulse customer account.",
      signInMetadataTitle: "Customer Sign In | Human Pulse",
      signInCardTitle: "Customer access",
      signInCardDescription:
        "Use your customer account to browse, manage your cart, and follow order updates.",
      signInSubmitLabel: "Sign in to shop",
      signUpLabel: "Create customer account",
      signUpHref: "/sign-up",
      forbiddenTitle: "Customer access required",
      forbiddenDescription:
        "This portal is reserved for customer accounts. Use the retailer or supplier portal if you manage a business.",
    },
    allowedRoles: ["customer"],
    postSignInPath: "/shop",
    workspaceHomePath: "/",
    allowedPrefixes: [
      "/",
      "/shop",
      "/cart",
      "/orders",
      "/marketplace",
      "/stores",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      ...UNIVERSAL_ALLOWED_PREFIXES,
    ],
    allowedApiPrefixes: [
      ...SHARED_AUTH_API_PREFIXES,
      ...PORTAL_AUTH_API_PREFIXES,
      "/api/customer/cart",
      "/api/customer/checkout",
      "/api/customer/orders",
      "/api/marketplace",
      ...UNIVERSAL_ALLOWED_API_PREFIXES,
    ],
    publicRewrites: SHOP_PUBLIC_REWRITES,
    cleanToLegacyRewrites: [],
    legacyToCleanRewrites: [
      { from: "/customer/sign-up", to: "/sign-up" },
      { from: "/stores", to: "/marketplace" },
    ],
  },
  retail: {
    presentation: {
      label: "Retail Portal",
      theme: "retail",
      signInTitle: "Sign in to the retail portal",
      signInDescription:
        "Open the Human Pulse operating workspace for checkout, products, inventory, staff, procurement, and reporting.",
      signInMetadataTitle: "Retail Sign In | Human Pulse",
      signInCardTitle: "Retail access",
      signInCardDescription:
        "Use an owner, manager, cashier, or inventory account to run store operations.",
      signInSubmitLabel: "Sign in to retail",
      signUpLabel: "Create retail account",
      signUpHref: "/sign-up",
      forbiddenTitle: "Retail access required",
      forbiddenDescription:
        "This portal is reserved for retailer teams. Customer and supplier accounts must use their own portals.",
    },
    allowedRoles: ["owner", "manager", "cashier", "inventory_staff"],
    postSignInPath: "/dashboard",
    workspaceHomePath: "/dashboard",
    allowedPrefixes: [
      "/",
      "/dashboard",
      "/onboarding",
      "/checkout",
      "/sales",
      "/orders",
      "/refunds",
      "/products",
      "/suppliers",
      "/reorder",
      "/procurement",
      "/reports",
      "/locations",
      "/staff",
      "/notifications",
      "/sessions",
      "/ops",
      "/accept-invite",
      "/forbidden",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      ...UNIVERSAL_ALLOWED_PREFIXES,
    ],
    allowedApiPrefixes: [
      ...SHARED_AUTH_API_PREFIXES,
      ...PORTAL_AUTH_API_PREFIXES,
      "/api/checkout",
      "/api/customers/search",
      "/api/dashboard",
      "/api/inventory/adjustments",
      "/api/inventory/transfers",
      "/api/locations",
      "/api/notifications",
      "/api/onboarding/complete",
      "/api/orders",
      "/api/procurement",
      "/api/products",
      "/api/reports",
      "/api/reorder-list",
      "/api/sales",
      "/api/sessions",
      "/api/staff",
      "/api/stripe/connect",
      "/api/stripe/checkout",
      "/api/suppliers",
      "/api/upload",
      ...UNIVERSAL_ALLOWED_API_PREFIXES,
    ],
    publicRewrites: RETAIL_PUBLIC_REWRITES,
    cleanToLegacyRewrites: [],
    legacyToCleanRewrites: [],
  },
  supply: {
    presentation: {
      label: "Supplier Portal",
      theme: "supply",
      signInTitle: "Sign in to the supplier portal",
      signInDescription:
        "Manage wholesale products, receive retailer purchase orders, and keep fulfillment status current.",
      signInMetadataTitle: "Supplier Sign In | Human Pulse",
      signInCardTitle: "Supplier access",
      signInCardDescription:
        "Use your supplier-linked account to manage catalog, orders, and fulfillment communication.",
      signInSubmitLabel: "Sign in to supply",
      signUpLabel: "Request supplier access",
      signUpHref: "/sign-up",
      forbiddenTitle: "Supplier access required",
      forbiddenDescription:
        "This portal is reserved for supplier accounts. Customer and retailer accounts must use their own portals.",
    },
    allowedRoles: ["supplier"],
    postSignInPath: "/dashboard",
    workspaceHomePath: "/dashboard",
    allowedPrefixes: [
      "/",
      "/dashboard",
      "/catalog",
      "/orders",
      "/forbidden",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      ...UNIVERSAL_ALLOWED_PREFIXES,
    ],
    allowedApiPrefixes: [
      ...SHARED_AUTH_API_PREFIXES,
      ...PORTAL_AUTH_API_PREFIXES,
      "/api/supplier",
      ...UNIVERSAL_ALLOWED_API_PREFIXES,
    ],
    publicRewrites: SUPPLY_PUBLIC_REWRITES,
    cleanToLegacyRewrites: [],
    legacyToCleanRewrites: [],
  },
  admin: {
    presentation: {
      label: "Admin Portal",
      theme: "admin",
      signInTitle: "Sign in to the admin portal",
      signInDescription:
        "Access platform-wide businesses, users, disputes, and announcements from the internal admin surface.",
      signInMetadataTitle: "Admin Sign In | Human Pulse",
      signInCardTitle: "Administrator access",
      signInCardDescription:
        "Platform administrator accounts can review businesses, users, disputes, and internal platform state.",
      signInSubmitLabel: "Sign in to admin",
      signUpLabel: null,
      signUpHref: null,
      forbiddenTitle: "Administrator access required",
      forbiddenDescription:
        "This portal is limited to platform administrators. Customer, retailer, and supplier accounts cannot enter here.",
    },
    allowedRoles: ["platform_admin"],
    postSignInPath: "/admin",
    workspaceHomePath: "/admin",
    allowedPrefixes: ["/", "/admin", "/sign-in", ...UNIVERSAL_ALLOWED_PREFIXES],
    allowedApiPrefixes: [
      ...SHARED_AUTH_API_PREFIXES,
      ...PORTAL_AUTH_API_PREFIXES,
      "/api/admin/announcements",
      "/api/admin/businesses",
      "/api/admin/disputes",
      "/api/admin/email-smoke-test",
      "/api/admin/metrics",
      "/api/admin/supplier-requests",
      "/api/admin/users",
      ...UNIVERSAL_ALLOWED_API_PREFIXES,
    ],
    publicRewrites: ADMIN_PUBLIC_REWRITES,
    cleanToLegacyRewrites: [],
    legacyToCleanRewrites: [],
  },
};

type HostResolution = {
  protocol: string;
  hostname: string;
  port: string;
};

function pathMatchesPrefix(pathname: string, prefix: string) {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function resolveRewrite(pathname: string, rewrites: readonly PrefixRewrite[]) {
  const ordered = [...rewrites].sort((left, right) => right.from.length - left.from.length);

  for (const rewrite of ordered) {
    if (!pathMatchesPrefix(pathname, rewrite.from)) {
      continue;
    }

    if (rewrite.from === "/") {
      return rewrite.to;
    }

    const suffix = pathname.slice(rewrite.from.length);
    return `${rewrite.to}${suffix}`;
  }

  return null;
}

function stripKnownPortalPrefix(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (normalized.startsWith("www.")) {
    return normalized.slice(4);
  }

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return "localhost";
  }

  const [first, ...rest] = normalized.split(".");
  if (rest.length === 0) {
    return normalized;
  }

  if (first === "shop" || first === "retail" || first === "supply" || first === "admin") {
    return rest.join(".");
  }

  return normalized;
}

function resolveOriginSource(currentOrigin?: string) {
  return currentOrigin ?? env.APP_URL;
}

function parseOriginSource(currentOrigin?: string): HostResolution {
  const url = new URL(resolveOriginSource(currentOrigin));
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
  };
}

function buildPortalHostname(portal: Portal, hostname: string) {
  const rootHostname = stripKnownPortalPrefix(hostname);

  if (rootHostname === "localhost") {
    return portal === "main" ? "localhost" : `${portal}.localhost`;
  }

  if (portal === "main") {
    return rootHostname;
  }

  return `${portal}.${rootHostname}`;
}

function buildOrigin(protocol: string, hostname: string, port: string) {
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}

export function normalizePortal(value: string | null | undefined): Portal {
  if (value === "shop" || value === "retail" || value === "supply" || value === "admin") {
    return value;
  }

  return "main";
}

export function getPortalDefinition(portal: Portal) {
  return PORTAL_DEFINITIONS[portal];
}

export function getPortalPresentation(portal: Portal) {
  return getPortalDefinition(portal).presentation;
}

export function getPortalForRole(role: UserRole): Portal {
  if (role === "customer") {
    return "shop";
  }
  if (role === "supplier") {
    return "supply";
  }
  if (role === "platform_admin") {
    return "admin";
  }

  return "retail";
}

export function isRoleAllowedInPortal(portal: Portal, role: UserRole) {
  if (portal === "main") {
    return false;
  }

  return getPortalDefinition(portal).allowedRoles.includes(role);
}

export function getPortalPostSignInPath(portal: Portal, role: UserRole) {
  if (portal === "main") {
    return getLegacyPostSignInPath(role);
  }

  return getPortalDefinition(portal).postSignInPath;
}

export function getLegacyPostSignInPath(role: UserRole) {
  if (role === "customer") {
    return "/shop";
  }
  if (role === "supplier") {
    return "/dashboard";
  }
  if (role === "platform_admin") {
    return "/admin";
  }

  return "/dashboard";
}

export function getPortalWorkspaceHomePath(portal: Portal) {
  return getPortalDefinition(portal).workspaceHomePath;
}

export async function getCurrentPortal(): Promise<Portal> {
  const headerStore = await headers();
  return normalizePortal(headerStore.get("x-portal"));
}

export async function getCurrentRequestOrigin() {
  const headerStore = await headers();
  const explicitOrigin = headerStore.get("x-portal-origin");

  if (explicitOrigin) {
    return explicitOrigin;
  }

  const host = headerStore.get("host");
  if (host) {
    return buildOrigin("https:", host.split(":")[0] ?? host, host.split(":")[1] ?? "");
  }

  return resolveOriginSource();
}

export function getPortalOrigin(portal: Portal, currentOrigin?: string) {
  const parsed = parseOriginSource(currentOrigin);
  const hostname = buildPortalHostname(portal, parsed.hostname);
  return buildOrigin(parsed.protocol, hostname, parsed.port);
}

export function getPortalAbsoluteUrl(portal: Portal, path = "/", currentOrigin?: string) {
  return new URL(path, getPortalOrigin(portal, currentOrigin)).toString();
}

export function resolvePortalPublicRewrite(portal: Portal, pathname: string) {
  return resolveRewrite(pathname, getPortalDefinition(portal).publicRewrites);
}

export function resolvePortalLegacyRewrite(portal: Portal, pathname: string) {
  return resolveRewrite(pathname, getPortalDefinition(portal).cleanToLegacyRewrites);
}

export function resolvePortalLegacyRedirect(portal: Portal, pathname: string) {
  return resolveRewrite(pathname, getPortalDefinition(portal).legacyToCleanRewrites);
}

export function isPortalAllowedPath(portal: Portal, pathname: string) {
  return getPortalDefinition(portal).allowedPrefixes.some((prefix) =>
    pathMatchesPrefix(pathname, prefix)
  );
}

export function isPortalAllowedApiPath(portal: Portal, pathname: string) {
  return getPortalDefinition(portal).allowedApiPrefixes.some((prefix) =>
    prefix === "/api"
      ? pathname.startsWith("/api/") || pathname === "/api"
      : pathMatchesPrefix(pathname, prefix)
  );
}

export function getPortalLegacyRedirectForMainHost(pathname: string, portal: Portal = "main") {
  if (portal !== "main") {
    return null;
  }

  if (pathname === "/sign-up" || pathname === "/accept-invite") {
    return { portal: "retail" as const, path: pathname };
  }
  if (pathMatchesPrefix(pathname, "/admin")) {
    return { portal: "admin" as const, path: pathname };
  }
  if (pathMatchesPrefix(pathname, "/customer/sign-up")) {
    return {
      portal: "shop" as const,
      path: pathname.replace("/customer/sign-up", "/sign-up") || "/sign-up",
    };
  }

  return null;
}
