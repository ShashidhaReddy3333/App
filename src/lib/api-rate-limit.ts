import type { NextRequest } from "next/server";

import {
  RedisRateLimitUnavailableError,
  checkInMemoryRateLimit,
  checkRateLimit,
  getIdentifier,
  type RateLimitPreset,
} from "@/lib/rate-limit";

let hasWarnedAboutDegradedRateLimiting = false;

function warnAboutDegradedRateLimiting() {
  if (process.env.NODE_ENV === "production" && !hasWarnedAboutDegradedRateLimiting) {
    hasWarnedAboutDegradedRateLimiting = true;
    console.warn("[Rate Limit] Redis unavailable, using degraded in-memory rate limiting");
  }
}

export async function checkApiRateLimit(
  request: NextRequest,
  preset: RateLimitPreset = "api",
  suffix?: string
) {
  const identifier = getIdentifier(request, suffix);

  try {
    return await checkRateLimit(identifier, preset);
  } catch (error) {
    if (error instanceof RedisRateLimitUnavailableError) {
      warnAboutDegradedRateLimiting();
      return checkInMemoryRateLimit(identifier, preset);
    }

    throw error;
  }
}

export const rateLimit = checkApiRateLimit;
