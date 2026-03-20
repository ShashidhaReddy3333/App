import { cookies } from "next/headers";
import crypto from "node:crypto";

import { shouldUseSecureSessionCookie } from "@/lib/auth/session-cookie";

const CSRF_COOKIE = "bma_csrf";

function hashCsrfToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a CSRF token, stores its SHA-256 hash in an httpOnly cookie,
 * and returns the raw token (to be sent to the client).
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashCsrfToken(token);
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE, tokenHash, {
    httpOnly: true,
    sameSite: "strict",
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Validates the CSRF token sent via the X-CSRF-Token header against
 * the hashed value stored in the cookie. Returns true if valid.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get("X-CSRF-Token");
  if (!headerToken) return false;

  const cookieStore = await cookies();
  const storedHash = cookieStore.get(CSRF_COOKIE)?.value;
  if (!storedHash) return false;

  const headerHash = hashCsrfToken(headerToken);
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}
