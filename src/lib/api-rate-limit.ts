import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  RedisRateLimitUnavailableError,
  checkInMemoryRateLimit,
  checkRateLimit as checkRedisRateLimit,
  getIdentifier,
  getRateLimitIdentifier,
  rateLimit as checkInMemoryWindowRateLimit,
  type RateLimitPreset,
  type SlidingWindowRateLimitOptions,
} from "@/lib/rate-limit";

const DEFAULT_LIMITS = {
  GET: { limit: 60, windowMs: 60_000 },
  POST: { limit: 20, windowMs: 60_000 },
  PATCH: { limit: 20, windowMs: 60_000 },
  DELETE: { limit: 20, windowMs: 60_000 },
} as const;

export interface RateLimitOptions extends SlidingWindowRateLimitOptions {}

let hasWarnedAboutDegradedRateLimiting = false;

function warnAboutDegradedRateLimiting() {
  if (process.env.NODE_ENV === "production" && !hasWarnedAboutDegradedRateLimiting) {
    hasWarnedAboutDegradedRateLimiting = true;
    console.warn("[Rate Limit] Redis unavailable, using degraded in-memory rate limiting");
  }
}

function resolveRateLimitOptions(method: string, options?: RateLimitOptions): RateLimitOptions {
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

export async function checkRateLimit(
  request: Request,
  options?: RateLimitOptions
): Promise<NextResponse | null> {
  const resolved = resolveRateLimitOptions(request.method.toUpperCase(), options);
  const identifier = buildIdentifier(request);

  try {
    const result = await checkRedisRateLimit(identifier, resolved);
    if (!result.success) {
      return buildRateLimitResponse(result.limit, new Date(result.reset));
    }
  } catch (error) {
    if (!(error instanceof RedisRateLimitUnavailableError)) {
      throw error;
    }

    warnAboutDegradedRateLimiting();
    const result = checkInMemoryWindowRateLimit(identifier, resolved);
    if (!result.success) {
      return buildRateLimitResponse(resolved.limit, result.resetAt);
    }
  }

  return null;
}

export function withRateLimit<TArgs extends unknown[]>(
  handler: (request: Request, ...args: TArgs) => Promise<Response>,
  options?: RateLimitOptions
): (request: Request, ...args: TArgs) => Promise<Response> {
  return async (request: Request, ...args: TArgs) => {
    const rateLimitResponse = await checkRateLimit(request, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request, ...args);
  };
}

export async function checkApiRateLimit(
  request: NextRequest,
  preset: RateLimitPreset = "api",
  suffix?: string
) {
  const identifier = getIdentifier(request, suffix);

  try {
    return await checkRedisRateLimit(identifier, preset);
  } catch (error) {
    if (error instanceof RedisRateLimitUnavailableError) {
      warnAboutDegradedRateLimiting();
      return checkInMemoryRateLimit(identifier, preset);
    }

    throw error;
  }
}

export const rateLimit = checkApiRateLimit;
