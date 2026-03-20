import { rateLimit } from "@/lib/rate-limit";

const DEFAULT_LIMITS = {
  GET: { limit: 60, windowMs: 60_000 },
  POST: { limit: 20, windowMs: 60_000 },
  PATCH: { limit: 20, windowMs: 60_000 },
  DELETE: { limit: 20, windowMs: 60_000 },
} as const;

export interface RateLimitOptions {
  limit: number;
  windowMs?: number;
}

export function withRateLimit<TArgs extends unknown[]>(
  handler: (request: Request, ...args: TArgs) => Promise<Response>,
  options?: RateLimitOptions
): (request: Request, ...args: TArgs) => Promise<Response> {
  return async (request: Request, ...args: TArgs): Promise<Response> => {
    const method = request.method.toUpperCase();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const url = new URL(request.url);
    const identifier = `${ip}:${method}:${url.pathname}`;

    const methodDefaults =
      DEFAULT_LIMITS[method as keyof typeof DEFAULT_LIMITS] ?? DEFAULT_LIMITS.POST;
    const limit = options?.limit ?? methodDefaults.limit;
    const windowMs = options?.windowMs ?? methodDefaults.windowMs;

    const result = rateLimit(identifier, { limit, windowMs });
    if (!result.success) {
      const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      return new Response(JSON.stringify({ message: "Too many requests.", code: "RATE_LIMIT_EXCEEDED" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.max(1, retryAfterSeconds)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
        },
      });
    }

    return handler(request, ...args);
  };
}
