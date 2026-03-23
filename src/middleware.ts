import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getOptionalSentryDsn, isProductionRuntime } from "@/lib/env";
import { logLegacyCompatibilityHit } from "@/lib/legacy-compat";
import {
  getPortalAbsoluteUrl,
  getPortalLegacyRedirectForMainHost,
  isPortalAllowedApiPath,
  isPortalAllowedPath,
  normalizePortal,
  resolvePortalLegacyRedirect,
  resolvePortalPublicRewrite,
} from "@/lib/portal";
import { getRequestOrigin, isAllowedRequestOrigin, isSafeMethod } from "@/lib/security/csrf";

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV === "development";
  const sentryDsn = getOptionalSentryDsn();
  const sentryOrigin = isProductionRuntime() && sentryDsn ? new URL(sentryDsn).origin : "";

  // 'unsafe-inline' is required because Next.js App Router injects inline
  // scripts for hydration that cannot yet receive nonces automatically.
  // Nonce-based CSP can replace this once Next.js adds full nonce support.
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

function getSubdomain(host: string): string | null {
  const [hostname = ""] = host.split(":");
  const parts = hostname.split(".");
  const subdomain = parts[0];

  if (!subdomain) {
    return null;
  }

  if (parts.length >= 3 || (parts.length === 2 && parts.at(1) === "localhost")) {
    if (
      subdomain === "shop" ||
      subdomain === "retail" ||
      subdomain === "supply" ||
      subdomain === "admin"
    ) {
      return subdomain;
    }
  }

  return null;
}

function buildOrigin(request: NextRequest) {
  const protocol = request.nextUrl.protocol;
  const host = request.headers.get("host") ?? request.nextUrl.host;
  return `${protocol}//${host}`;
}

function withResponseHeaders(response: NextResponse, requestId: string, portal: string | null) {
  const csp = buildContentSecurityPolicy();

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-portal", portal ?? "main");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("content-security-policy", csp);
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("cross-origin-opener-policy", "same-origin");

  if (isProductionRuntime()) {
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains; preload"
    );
    response.headers.set("content-security-policy", `${csp}; upgrade-insecure-requests`);
  }

  return response;
}

function rewriteRequest(
  request: NextRequest,
  requestHeaders: Headers,
  pathname: string,
  requestId: string,
  portal: string | null
) {
  const response = NextResponse.rewrite(new URL(pathname, request.url), {
    request: {
      headers: requestHeaders,
    },
  });

  return withResponseHeaders(response, requestId, portal);
}

function continueRequest(requestHeaders: Headers, requestId: string, portal: string | null) {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return withResponseHeaders(response, requestId, portal);
}

function redirectRequest(
  target: string,
  request: NextRequest,
  requestId: string,
  portal: string | null
) {
  const response = NextResponse.redirect(new URL(target, request.url));
  return withResponseHeaders(response, requestId, portal);
}

function redirectAbsoluteRequest(target: string, requestId: string, portal: string | null) {
  const response = NextResponse.redirect(target);
  return withResponseHeaders(response, requestId, portal);
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);
  const portal = normalizePortal(subdomain);
  const pathname = request.nextUrl.pathname;
  const origin = buildOrigin(request);

  requestHeaders.set("x-portal", portal);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-portal-origin", origin);

  if (!pathname.startsWith("/api") && pathname.includes(".")) {
    return continueRequest(requestHeaders, requestId, subdomain);
  }

  if (pathname.startsWith("/portal") || pathname.startsWith("/_surfaces")) {
    return redirectRequest("/", request, requestId, subdomain);
  }

  const samePortalLegacyRedirect =
    portal !== "main" ? resolvePortalLegacyRedirect(portal, pathname) : null;
  if (samePortalLegacyRedirect) {
    logLegacyCompatibilityHit("legacy_portal_redirect_hit", {
      source: "same_portal_legacy_redirect",
      portal,
      pathname,
      targetPath: samePortalLegacyRedirect,
      host,
      requestId,
    });
    return redirectRequest(samePortalLegacyRedirect, request, requestId, subdomain);
  }

  const mainHostRedirect = getPortalLegacyRedirectForMainHost(pathname);
  if (mainHostRedirect) {
    logLegacyCompatibilityHit("legacy_portal_redirect_hit", {
      source: "main_host_legacy_redirect",
      currentPortal: portal,
      pathname,
      targetPortal: mainHostRedirect.portal,
      targetPath: mainHostRedirect.path,
      host,
      requestId,
    });
    if (portal === "main" || mainHostRedirect.portal !== portal) {
      return redirectAbsoluteRequest(
        getPortalAbsoluteUrl(mainHostRedirect.portal, mainHostRedirect.path, origin),
        requestId,
        subdomain
      );
    }
  }

  const publicRewrite = resolvePortalPublicRewrite(portal, pathname);
  if (publicRewrite) {
    return rewriteRequest(request, requestHeaders, publicRewrite, requestId, subdomain);
  }

  if (pathname.startsWith("/api")) {
    if (!isPortalAllowedApiPath(portal, pathname)) {
      return redirectRequest("/", request, requestId, subdomain);
    }
  } else if (!isPortalAllowedPath(portal, pathname)) {
    return redirectRequest("/", request, requestId, subdomain);
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
    const isAllowedOrigin = isAllowedRequestOrigin(request, requestOrigin);

    if (!isAllowedOrigin) {
      return new NextResponse(
        JSON.stringify({ message: "CSRF validation failed.", code: "FORBIDDEN" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return continueRequest(requestHeaders, requestId, subdomain);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
