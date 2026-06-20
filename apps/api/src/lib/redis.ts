import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}

// Initialize Redis Connection (maxRetriesPerRequest must be null for BullMQ)
export const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
