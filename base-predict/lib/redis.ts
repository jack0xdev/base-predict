import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazy singletons — avoids build-time crash when env vars are missing
let _redis: Redis | null = null;
let _predictLimiter: Ratelimit | null = null;
let _readLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

/** Rate limiter: 5 predictions per minute per wallet */
export function getPredictLimiter(): Ratelimit {
  if (!_predictLimiter) {
    _predictLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "rl:predict",
    });
  }
  return _predictLimiter;
}

/** Rate limiter: 60 reads per minute per IP */
export function getReadLimiter(): Ratelimit {
  if (!_readLimiter) {
    _readLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "rl:read",
    });
  }
  return _readLimiter;
}

// Convenience proxy accessors so existing code using `predictLimiter` still works
export const predictLimiter = new Proxy({} as Ratelimit, {
  get(_, prop) {
    return (getPredictLimiter() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const readLimiter = new Proxy({} as Ratelimit, {
  get(_, prop) {
    return (getReadLimiter() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ---------- Cache helpers ----------

/** Get a cached value, returning null on miss */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

/** Set a cached value with TTL in seconds */
export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: ttl });
  } catch {
    // Cache write failure is non-fatal
  }
}

/** Delete one or more cache keys */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    await getRedis().del(...keys);
  } catch {
    // Non-fatal
  }
}
