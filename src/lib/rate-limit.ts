import { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";

import { getRedisClient, isRedisAvailable } from "@/lib/queue/redis";

const CLEANUP_INTERVAL_MS = 60_000;
const MAX_WINDOW_MS = 5 * 60_000;

type WindowEntry = {
  timestamps: number[];
};

const store = new Map<string, WindowEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export interface PresetRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export type RateLimitPreset = "auth" | "api" | "upload" | "webhook" | "public";

const LIMITS: Record<RateLimitPreset, { requests: number; windowSeconds: number }> = {
  auth: { requests: 10, windowSeconds: 60 },
  api: { requests: 120, windowSeconds: 60 },
  upload: { requests: 20, windowSeconds: 60 },
  webhook: { requests: 500, windowSeconds: 60 },
  public: { requests: 60, windowSeconds: 60 },
};

let rateLimiters: Record<RateLimitPreset, Ratelimit> | null = null;

function cleanupExpiredEntries(): void {
  const cutoff = Date.now() - MAX_WINDOW_MS;
  for (const [key, entry] of store.entries()) {
    const filtered = entry.timestamps.filter((timestamp) => timestamp > cutoff);
    if (filtered.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = filtered;
    }
  }
}

function ensureCleanupStarted(): void {
  if (cleanupTimer !== null) {
    return;
  }

  cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer === "object" && cleanupTimer !== null && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

function getRatelimiters(): Record<RateLimitPreset, Ratelimit> | null {
  if (!isRedisAvailable()) {
    return null;
  }

  if (rateLimiters) {
    return rateLimiters;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  rateLimiters = {} as Record<RateLimitPreset, Ratelimit>;
  for (const [preset, config] of Object.entries(LIMITS) as [RateLimitPreset, (typeof LIMITS)[RateLimitPreset]][]) {
    rateLimiters[preset] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
      prefix: `hp:rl:${preset}`,
    });
  }

  return rateLimiters;
}

export function rateLimit(identifier: string, options: { limit: number; windowMs: number }): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  ensureCleanupStarted();

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

  const count = entry.timestamps.length;
  const success = count < limit;
  if (success) {
    entry.timestamps.push(now);
  }

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldest = entry.timestamps[0];
  const resetAt = new Date(oldest !== undefined ? oldest + windowMs : now + windowMs);

  return { success, remaining, resetAt };
}

export async function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset = "api"
): Promise<PresetRateLimitResult> {
  const limiters = getRatelimiters();
  if (!limiters) {
    const config = LIMITS[preset];
    const result = rateLimit(identifier, { limit: config.requests, windowMs: config.windowSeconds * 1000 });
    return {
      success: result.success,
      limit: config.requests,
      remaining: result.remaining,
      reset: result.resetAt.getTime(),
    };
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

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function getIdentifier(request: NextRequest, suffix?: string): string {
  const ip = getRateLimitIdentifier(request);
  return suffix ? `${ip}:${suffix}` : ip;
}

export function _resetStoreForTesting(): void {
  store.clear();
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
