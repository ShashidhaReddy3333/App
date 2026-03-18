const rateStore = new Map<string, { count: number; resetAt: number }>();

// Clean expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateStore) {
    if (value.resetAt <= now) rateStore.delete(key);
  }
}, 60_000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export function rateLimit(
  identifier: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: new Date(now + options.windowMs),
    };
  }

  entry.count++;
  if (entry.count > options.limit) {
    return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
