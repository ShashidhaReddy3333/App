import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { redisClient?: Redis };

export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (globalForRedis.redisClient) {
    return globalForRedis.redisClient;
  }

  const client = new Redis({ url, token });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redisClient = client;
  }

  return client;
}

export function isRedisAvailable(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
