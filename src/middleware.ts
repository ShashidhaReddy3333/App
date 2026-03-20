import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getOptionalSentryDsn, isProductionRuntime } from "@/lib/env";

function buildContentSecurityPolicy() {
  const sentryDsn = getOptionalSentryDsn();
  const connectSources = ["'self'"];

  if (isProductionRuntime()) {
    if (sentryDsn) {
      connectSources.push(new URL(sentryDsn).origin);
    }
  } else {
    connectSources.push("https:", "ws:", "wss:");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isProductionRuntime() ? "" : " 'unsafe-eval'"}`,
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'"
  ].join("; ");
}

/**
 * Subdomain routing map:
 *   shop.human-pulse.com   → Customer portal  (/shop, /customer, /cart, /orders)
 *   retail.human-pulse.com → Retailer portal   (/app)
 *   supply.human-pulse.com → Supplier portal   (/supplier)
 *
 * Each subdomain redirects to the correct portal landing page when visiting "/".
 * Cross-portal routes are blocked with a redirect to the correct subdomain.
 */

const SUBDOMAIN_CONFIG: Record<string, {
  allowedPrefixes: string[];
  defaultPath: string;
}> = {
  shop: {
    allowedPrefixes: ["/shop", "/customer", "/cart", "/orders", "/sign-in", "/sign-up", "/customer/sign-up", "/forgot-password", "/reset-password", "/api"],
    defaultPath: "/shop",
  },
  retail: {
    allowedPrefixes: ["/app", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/api"],
    defaultPath: "/app/dashboard",
  },
  supply: {
    allowedPrefixes: ["/supplier", "/sign-in", "/sign-up", "/supplier/sign-up", "/forgot-password", "/reset-password", "/api"],
    defaultPath: "/supplier/dashboard",
  },
};

function getSubdomain(host: string): string | null {
  // Remove port if present
  const [hostname = ""] = host.split(":");

  // Match subdomains like shop.human-pulse.com
  // Also support local dev: shop.localhost
  const parts = hostname.split(".");
  const sub = parts[0];
  if (!sub) return null;

  if (parts.length >= 3 || (parts.length === 2 && parts.at(1) === "localhost")) {
    if (sub in SUBDOMAIN_CONFIG) {
      return sub;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);
  const pathname = request.nextUrl.pathname;

  // Subdomain-based routing
  const config = subdomain ? SUBDOMAIN_CONFIG[subdomain] : undefined;
  if (subdomain && config) {

    // Set a header so pages can detect which portal they're on
    requestHeaders.set("x-portal", subdomain);

    // Redirect root to the portal's default page
    if (pathname === "/") {
      return NextResponse.redirect(new URL(config.defaultPath, request.url));
    }

    // Block access to routes outside this portal's scope
    const isAllowed = config.allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );

    if (!isAllowed) {
      return NextResponse.redirect(new URL(config.defaultPath, request.url));
    }
  }

  // Pass current pathname to server components via header
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-portal", subdomain ?? "main");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("content-security-policy", buildContentSecurityPolicy());
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("cross-origin-opener-policy", "same-origin");

  if (isProductionRuntime()) {
    response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
    response.headers.set("content-security-policy", `${buildContentSecurityPolicy()}; upgrade-insecure-requests`);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
