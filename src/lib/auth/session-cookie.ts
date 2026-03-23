export function shouldUseSecureSessionCookie() {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieDomain() {
  // Portal sessions are intentionally host-only so customer, retailer, and supplier
  // accounts do not bleed across subdomains in the same browser.
  return undefined;
}
