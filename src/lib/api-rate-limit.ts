import { NextResponse } from "next/server";
import { rateLimit, getRateLimitIdentifier } from "./rate-limit";

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitOptions> = {
  GET: { limit: 60, windowMs: 60_000 },
  POST: { limit: 20, windowMs: 60_000 },
  PATCH: { limit: 20, windowMs: 60_000 },
  DELETE: { limit: 20, windowMs: 60_000 },
};

export function checkRateLimit(request: Request, options?: RateLimitOptions): NextResponse | null {
  const method = request.method;
  const url = new URL(request.url);
  const identifier = getRateLimitIdentifier(request);
  const key = `${method}:${url.pathname}:${identifier}`;

  const opts = {
    limit: options?.limit ?? DEFAULT_LIMITS[method]?.limit ?? 60,
    windowMs: options?.windowMs ?? DEFAULT_LIMITS[method]?.windowMs ?? 60_000,
  };

  const result = rateLimit(key, opts);

  if (!result.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(opts.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
        },
      }
    );
  }

  return null;
}
