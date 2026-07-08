import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();

/**
 * Sliding-window limiter, one instance per named bucket. Only the two
 * highest-traffic, load-bearing routes get one: eval-run creation and the
 * guardrail-check endpoint (see project plan §3).
 */
function getLimiter(bucket: string, limit: number, windowSeconds: number): Ratelimit {
  const key = `${bucket}:${limit}:${windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `sentineleval:ratelimit:${bucket}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export async function checkRateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number) {
  const limiter = getLimiter(bucket, limit, windowSeconds);
  return limiter.limit(identifier);
}
