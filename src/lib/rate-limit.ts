import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient, isRedisAvailable } from "@/lib/queue/redis";
import type { NextRequest } from "next/server";

// This in-memory store is a degraded fallback only. In serverless production
// environments it resets on cold starts, so counters are not durable without Redis.
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();
let hasWarnedAboutMissingRedisAtStartup = false;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export type RateLimitPreset = "auth" | "api" | "upload" | "webhook" | "public";

const LIMITS: Record<RateLimitPreset, { requests: number; windowSeconds: number }> = {
  auth: { requests: 10, windowSeconds: 60 },       // 10 attempts per minute
  api: { requests: 120, windowSeconds: 60 },        // 120 req/min
  upload: { requests: 20, windowSeconds: 60 },      // 20 uploads/min
  webhook: { requests: 500, windowSeconds: 60 },    // Stripe sends many webhooks
  public: { requests: 60, windowSeconds: 60 },      // Public marketplace
};

let _ratelimiters: Record<RateLimitPreset, Ratelimit> | null = null;

export class RedisRateLimitUnavailableError extends Error {
  constructor() {
    super("Redis-backed rate limiting is unavailable.");
    this.name = "RedisRateLimitUnavailableError";
  }
}

if (process.env.NODE_ENV === "production" && !isRedisAvailable() && !hasWarnedAboutMissingRedisAtStartup) {
  hasWarnedAboutMissingRedisAtStartup = true;
  console.warn("[Rate Limit] Redis is not configured in production; rate limiting is degraded and in-memory counters reset on serverless cold starts");
}

function getRatelimiters(): Record<RateLimitPreset, Ratelimit> | null {
  if (!isRedisAvailable()) return null;
  if (_ratelimiters) return _ratelimiters;

  const redis = getRedisClient();
  if (!redis) return null;

  _ratelimiters = {} as Record<RateLimitPreset, Ratelimit>;

  for (const [preset, config] of Object.entries(LIMITS) as [RateLimitPreset, typeof LIMITS[RateLimitPreset]][]) {
    _ratelimiters[preset] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
      prefix: `hp:rl:${preset}`,
    });
  }

  return _ratelimiters;
}

/**
 * In-memory fallback rate limiter for environments without Redis.
 */
export function checkInMemoryRateLimit(key: string, preset: RateLimitPreset): RateLimitResult {
  const config = LIMITS[preset];
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = inMemoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: config.requests, remaining: config.requests - 1, reset: now + windowMs };
  }

  if (entry.count >= config.requests) {
    return { success: false, limit: config.requests, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Check rate limit for a given identifier and preset using Redis-backed counters.
 */
export async function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset = "api"
): Promise<RateLimitResult> {
  const limiters = getRatelimiters();

  if (!limiters) {
    throw new RedisRateLimitUnavailableError();
  }

  const limiter = limiters[preset];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Extract a rate-limit identifier from a Next.js request.
 * Uses IP address, falling back to a generic identifier.
 */
export function getIdentifier(req: NextRequest, suffix?: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return suffix ? `${ip}:${suffix}` : ip;
}
