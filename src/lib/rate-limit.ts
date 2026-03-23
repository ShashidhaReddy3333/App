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

export interface SlidingWindowRateLimitOptions {
  limit: number;
  windowMs: number;
}

export type RateLimitPreset = "auth" | "api" | "upload" | "webhook" | "public";

const LIMITS: Record<RateLimitPreset, { requests: number; windowSeconds: number }> = {
  auth: { requests: 10, windowSeconds: 60 },
  api: { requests: 120, windowSeconds: 60 },
  upload: { requests: 20, windowSeconds: 60 },
  webhook: { requests: 500, windowSeconds: 60 },
  public: { requests: 60, windowSeconds: 60 },
};

let presetRateLimiters: Record<RateLimitPreset, Ratelimit> | null = null;
const customRateLimiters = new Map<string, Ratelimit>();

type RedisLimiterResult = {
  success: boolean;
  limit?: number;
  remaining: number;
  reset: number;
};

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

function resolvePresetOptions(preset: RateLimitPreset): SlidingWindowRateLimitOptions {
  const config = LIMITS[preset];
  return {
    limit: config.requests,
    windowMs: config.windowSeconds * 1000,
  };
}

function getOrCreateCustomLimiter(options: SlidingWindowRateLimitOptions): Ratelimit | null {
  if (!isRedisAvailable()) {
    return null;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const key = `${options.limit}:${options.windowMs}`;
  const existing = customRateLimiters.get(key);
  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, `${Math.ceil(options.windowMs / 1000)} s`),
    prefix: `hp:rl:custom:${key}`,
  });

  customRateLimiters.set(key, limiter);
  return limiter;
}

export class RedisRateLimitUnavailableError extends Error {
  constructor() {
    super(
      process.env.NODE_ENV === "production"
        ? "Redis-backed rate limiting is required in production and is currently unavailable."
        : "Redis-backed rate limiting is unavailable."
    );
    this.name = "RedisRateLimitUnavailableError";
  }
}

export function isInMemoryRateLimitFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

function getPresetRatelimiters(): Record<RateLimitPreset, Ratelimit> | null {
  if (!isRedisAvailable()) {
    return null;
  }

  if (presetRateLimiters) {
    return presetRateLimiters;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  presetRateLimiters = {} as Record<RateLimitPreset, Ratelimit>;
  for (const [preset, config] of Object.entries(LIMITS) as [
    RateLimitPreset,
    (typeof LIMITS)[RateLimitPreset],
  ][]) {
    presetRateLimiters[preset] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
      prefix: `hp:rl:${preset}`,
    });
  }

  return presetRateLimiters;
}

export function rateLimit(
  identifier: string,
  options: SlidingWindowRateLimitOptions
): RateLimitResult {
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

  const success = entry.timestamps.length < limit;
  if (success) {
    entry.timestamps.push(now);
  }

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldest = entry.timestamps[0];
  const resetAt = new Date(oldest !== undefined ? oldest + windowMs : now + windowMs);

  return { success, remaining, resetAt };
}

export function checkInMemoryRateLimit(
  identifier: string,
  preset: RateLimitPreset
): PresetRateLimitResult {
  const options = resolvePresetOptions(preset);
  const result = rateLimit(identifier, options);

  return {
    success: result.success,
    limit: options.limit,
    remaining: result.remaining,
    reset: result.resetAt.getTime(),
  };
}

export async function checkRateLimit(
  identifier: string,
  presetOrOptions: RateLimitPreset | SlidingWindowRateLimitOptions = "api"
): Promise<PresetRateLimitResult> {
  const limiter =
    typeof presetOrOptions === "string"
      ? getPresetRatelimiters()?.[presetOrOptions]
      : getOrCreateCustomLimiter(presetOrOptions);

  if (!limiter) {
    throw new RedisRateLimitUnavailableError();
  }

  const result = (await limiter.limit(identifier)) as RedisLimiterResult;
  const options =
    typeof presetOrOptions === "string" ? resolvePresetOptions(presetOrOptions) : presetOrOptions;

  return {
    success: result.success,
    limit: result.limit ?? options.limit,
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
  customRateLimiters.clear();
  presetRateLimiters = null;

  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
