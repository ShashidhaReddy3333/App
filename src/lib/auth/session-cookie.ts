export function shouldUseSecureSessionCookie() {
  return process.env.NODE_ENV === "production";
}
