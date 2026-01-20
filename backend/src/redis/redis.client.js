import Redis from "ioredis";
import { ENV } from "../env.js";

// Redis client singleton
let redisClient = null;

/**
 * Get Redis client instance (singleton pattern)
 * @returns {Redis} Redis client
 */
export function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis(ENV.REDIS_URL || "redis://localhost:6379", {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                console.error("Redis connection error:", err.message);
                return true;
            },
        });

        redisClient.on("connect", () => {
            console.log("✅ Redis connected");
        });

        redisClient.on("error", (err) => {
            console.error("❌ Redis error:", err.message);
        });

        redisClient.on("ready", () => {
            console.log("🚀 Redis ready");
        });
    }

    return redisClient;
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log("Redis disconnected");
    }
}

// Export singleton instance
export const redis = getRedisClient();
