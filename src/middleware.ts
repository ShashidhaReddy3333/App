import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getOptionalSentryDsn, isProductionRuntime } from "@/lib/env";
import { ALLOWED_ORIGINS, getRequestOrigin, isSafeMethod } from "@/lib/security/csrf";

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV === "development";
  const sentryDsn = getOptionalSentryDsn();
  const sentryOrigin = isProductionRuntime() && sentryDsn ? new URL(sentryDsn).origin : "";
  const scriptSources = ["'self'", "'unsafe-inline'"];

  if (isDev) {
    scriptSources.push("'unsafe-eval'");
  }

  scriptSources.push("https://js.stripe.com");
  if (sentryOrigin) {
    scriptSources.push(sentryOrigin);
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.stripe.com https://public.blob.vercel-storage.com",
    "font-src 'self'",
    `connect-src 'self' https://api.stripe.com https://r.stripe.com${sentryOrigin ? ` ${sentryOrigin}` : ""}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");
}

const SUBDOMAIN_CONFIG: Record<
  string,
  {
    allowedPrefixes: string[];
    defaultPath: string;
  }
> = {
  shop: {
    allowedPrefixes: [
      "/shop",
      "/customer",
      "/cart",
      "/orders",
      "/sign-in",
      "/sign-up",
      "/customer/sign-up",
      "/forgot-password",
      "/reset-password",
      "/api",
      "/marketplace",
    ],
    defaultPath: "/shop",
  },
  retail: {
    allowedPrefixes: [
      "/app",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/api",
    ],
    defaultPath: "/app/dashboard",
  },
  supply: {
    allowedPrefixes: [
      "/supplier",
      "/sign-in",
      "/sign-up",
      "/supplier/sign-up",
      "/forgot-password",
      "/reset-password",
      "/api",
    ],
    defaultPath: "/supplier/dashboard",
  },
  admin: {
    allowedPrefixes: ["/admin", "/sign-in", "/api"],
    defaultPath: "/admin",
  },
};

function getSubdomain(host: string): string | null {
  const [hostname = ""] = host.split(":");
  const parts = hostname.split(".");
  const subdomain = parts[0];

  if (!subdomain) {
    return null;
  }

  if (parts.length >= 3 || (parts.length === 2 && parts.at(1) === "localhost")) {
    if (subdomain in SUBDOMAIN_CONFIG) {
      return subdomain;
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

  const config = subdomain ? SUBDOMAIN_CONFIG[subdomain] : undefined;
  if (subdomain && config) {
    requestHeaders.set("x-portal", subdomain);

    if (pathname === "/") {
      return NextResponse.redirect(new URL(config.defaultPath, request.url));
    }

    const isAllowed = config.allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL(config.defaultPath, request.url));
    }
  }

  const method = request.method.toUpperCase();
  const shouldSkipCsrf =
    pathname.startsWith("/api/internal/") ||
    pathname === "/api/stripe/webhooks" ||
    pathname.startsWith("/api/stripe/webhooks") ||
    pathname === "/api/health" ||
    pathname === "/api/readiness";

  if (!isSafeMethod(method) && !shouldSkipCsrf) {
    const requestOrigin = getRequestOrigin(request);
    const isAllowedRequestOrigin = requestOrigin ? ALLOWED_ORIGINS.includes(requestOrigin) : false;

    if (!isAllowedRequestOrigin) {
      return new NextResponse(JSON.stringify({ error: "CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains; preload"
    );
    response.headers.set(
      "content-security-policy",
      `${buildContentSecurityPolicy()}; upgrade-insecure-requests`
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
