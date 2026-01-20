import { Queue, Worker } from "bullmq";
import { redis } from "../redis/redis.client.js";
import { resolveBinaryTrade } from "../binary/binary.engine.js";
import { DistributedLock } from "../redis/distributed-lock.js";

/**
 * Binary Options Expiry Resolution Queue
 * Automatically resolves binary options at expiry time
 */
export const binaryQueue = new Queue("binary-resolution", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 604800, // Keep failed jobs for 7 days
        },
    },
});

/**
 * Schedule binary trade for automatic resolution at expiry
 * @param {string} tradeId - Binary trade ID
 * @param {Date} expiryTime - Expiry timestamp
 * @returns {Promise<Job>} BullMQ job
 */
export async function scheduleBinaryResolution(tradeId, expiryTime) {
    const delayMs = new Date(expiryTime).getTime() - Date.now();

    if (delayMs < 0) {
        throw new Error("Expiry time is in the past");
    }

    return await binaryQueue.add(
        "resolve",
        { tradeId, expiryTime: expiryTime.toISOString() },
        { delay: delayMs, jobId: `binary-${tradeId}` }
    );
}

/**
 * Binary resolution worker
 * Processes binary trade resolutions at expiry
 */
export const binaryWorker = new Worker(
    "binary-resolution",
    async (job) => {
        const { tradeId } = job.data;

        console.log(`[Binary Worker] Resolving trade ${tradeId}`);

        // Use distributed lock to prevent double resolution
        const lockKey = `lock:binary:${tradeId}`;
        const lockValue = Date.now().toString();

        try {
            const acquired = await DistributedLock.acquire(lockKey, 10, lockValue);

            if (!acquired) {
                throw new Error(`Trade ${tradeId} is already being resolved`);
            }

            // Resolve the binary trade
            const result = await resolveBinaryTrade(tradeId);

            // Release lock
            await DistributedLock.release(lockKey, lockValue);

            console.log(`[Binary Worker] ✅ Resolved trade ${tradeId}: ${result.result}`);

            return { success: true, result };
        } catch (error) {
            console.error(`[Binary Worker] ❌ Failed to resolve trade ${tradeId}:`, error.message);

            // Release lock on error
            await DistributedLock.release(lockKey, lockValue);

            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 10, // Process up to 10 resolutions in parallel
        limiter: {
            max: 50, // Max 50 jobs per duration
            duration: 1000, // Per second
        },
    }
);

// Worker event handlers
binaryWorker.on("completed", (job) => {
    console.log(`[Binary Worker] Job ${job.id} completed`);
});

binaryWorker.on("failed", (job, err) => {
    console.error(`[Binary Worker] Job ${job?.id} failed:`, err.message);
});

binaryWorker.on("error", (err) => {
    console.error("[Binary Worker] Worker error:", err.message);
});

/**
 * Get binary queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getBinaryQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        binaryQueue.getWaitingCount(),
        binaryQueue.getActiveCount(),
        binaryQueue.getCompletedCount(),
        binaryQueue.getFailedCount(),
        binaryQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
}
