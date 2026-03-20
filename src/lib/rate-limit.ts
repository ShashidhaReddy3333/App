import { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";

import { getRedisClient, isRedisAvailable } from "@/lib/queue/redis";

type RateLimitStoreEntry = { count: number; resetAt: number };

const rateStore = new Map<string, RateLimitStoreEntry>();
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateStore) {
    if (value.resetAt <= now) {
      rateStore.delete(key);
    }
  }
}, 60_000);

cleanupTimer.unref?.();

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

function getOrCreateEntry(key: string, windowMs: number): RateLimitStoreEntry {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || entry.resetAt <= now) {
    const nextEntry = { count: 0, resetAt: now + windowMs };
    rateStore.set(key, nextEntry);
    return nextEntry;
  }

  return entry;
}

function inMemoryPresetRateLimit(key: string, preset: RateLimitPreset): PresetRateLimitResult {
  const config = LIMITS[preset];
  const entry = getOrCreateEntry(key, config.windowSeconds * 1000);
  entry.count += 1;

  if (entry.count > config.requests) {
    return { success: false, limit: config.requests, remaining: 0, reset: entry.resetAt };
  }

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: entry.resetAt,
  };
}

export function rateLimit(identifier: string, options: { limit: number; windowMs: number }): RateLimitResult {
  const entry = getOrCreateEntry(identifier, options.windowMs);
  entry.count += 1;

  if (entry.count > options.limit) {
    return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

export async function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset = "api"
): Promise<PresetRateLimitResult> {
  const limiters = getRatelimiters();
  if (!limiters) {
    return inMemoryPresetRateLimit(identifier, preset);
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
