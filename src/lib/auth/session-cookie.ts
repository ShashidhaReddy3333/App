import { env } from "@/lib/env";

export function shouldUseSecureSessionCookie() {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieDomain() {
  const hostname = new URL(env.APP_URL).hostname.toLowerCase();

  if (hostname === "human-pulse.com" || hostname.endsWith(".human-pulse.com")) {
    return ".human-pulse.com";
  }

  return undefined;
}
