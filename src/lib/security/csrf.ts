import { env } from "@/lib/env";

const PORTAL_SUBDOMAINS = ["shop", "retail", "supply", "admin"] as const;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getBaseHostname(hostname: string) {
  const parts = hostname.split(".");
  const [subdomain = ""] = parts;

  if (parts.length >= 3 && PORTAL_SUBDOMAINS.includes(subdomain as (typeof PORTAL_SUBDOMAINS)[number])) {
    return parts.slice(1).join(".");
  }

  if (parts.length === 2 && parts[1] === "localhost" && PORTAL_SUBDOMAINS.includes(subdomain as (typeof PORTAL_SUBDOMAINS)[number])) {
    return "localhost";
  }

  return hostname;
}

function buildOrigin(protocol: string, hostname: string, port: string) {
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}

function buildAllowedOrigins() {
  const appUrl = new URL(env.APP_URL);
  const baseHostname = getBaseHostname(appUrl.hostname);
  const origins = new Set<string>([buildOrigin(appUrl.protocol, baseHostname, appUrl.port)]);

  for (const subdomain of PORTAL_SUBDOMAINS) {
    origins.add(buildOrigin(appUrl.protocol, `${subdomain}.${baseHostname}`, appUrl.port));
  }

  return Array.from(origins);
}

export const ALLOWED_ORIGINS = buildAllowedOrigins();

export function isSafeMethod(method: string) {
  return SAFE_METHODS.has(method.toUpperCase());
}

export function getRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(requestOrigin: string | null) {
  return requestOrigin ? ALLOWED_ORIGINS.includes(requestOrigin) : false;
}
