import { NextResponse } from "next/server";

import { getRateLimitIdentifier, rateLimit } from "@/lib/rate-limit";

const DEFAULT_LIMITS = {
  GET: { limit: 60, windowMs: 60_000 },
  POST: { limit: 20, windowMs: 60_000 },
  PATCH: { limit: 20, windowMs: 60_000 },
  DELETE: { limit: 20, windowMs: 60_000 },
} as const;

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

function resolveRateLimitOptions(method: string, options?: RateLimitOptions) {
  const defaults = DEFAULT_LIMITS[method as keyof typeof DEFAULT_LIMITS] ?? DEFAULT_LIMITS.POST;
  return {
    limit: options?.limit ?? defaults.limit,
    windowMs: options?.windowMs ?? defaults.windowMs,
  };
}

function buildIdentifier(request: Request): string {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const identifier = getRateLimitIdentifier(request);
  return `${method}:${url.pathname}:${identifier}`;
}

function buildRateLimitResponse(limit: number, resetAt: Date) {
  const retryAfterSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  return NextResponse.json(
    { message: "Too many requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    }
  );
}

export function checkRateLimit(request: Request, options?: RateLimitOptions): NextResponse | null {
  const resolved = resolveRateLimitOptions(request.method.toUpperCase(), options);
  const result = rateLimit(buildIdentifier(request), resolved);

  if (!result.success) {
    return buildRateLimitResponse(resolved.limit, result.resetAt);
  }

  return null;
}

export function withRateLimit<TArgs extends unknown[]>(
  handler: (request: Request, ...args: TArgs) => Promise<Response>,
  options?: RateLimitOptions
): (request: Request, ...args: TArgs) => Promise<Response> {
  return async (request: Request, ...args: TArgs) => {
    const rateLimitResponse = checkRateLimit(request, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request, ...args);
  };
}
