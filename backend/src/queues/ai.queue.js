import { Queue, Worker } from "bullmq";
import { redis } from "../redis/redis.client.js";
import { scanMarketOpportunities, simulateArbitrage } from "../ai/ai.engine.js";

/**
 * AI Arbitrage Scanning Queue
 * Periodically scans markets for arbitrage opportunities
 */
export const aiQueue = new Queue("ai-arbitrage", {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "fixed",
            delay: 5000,
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100,
        },
        removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
        },
    },
});

/**
 * Schedule AI market scan
 * @param {Object} options - Scan options
 * @returns {Promise<Job>} BullMQ job
 */
export async function scheduleAIScan(options = {}) {
    const { symbols = [], minProfit = 0.005, priority = 1 } = options;

    return await aiQueue.add(
        "scan",
        {
            symbols,
            minProfit,
            timestamp: new Date().toISOString(),
        },
        {
            priority,
            jobId: `ai-scan-${Date.now()}`,
        }
    );
}

/**
 * Schedule recurring AI scans
 * @param {number} intervalMs - Scan interval in milliseconds
 * @returns {Promise<void>}
 */
export async function scheduleRecurringAIScans(intervalMs = 60000) {
    // Remove existing repeatable jobs
    const repeatableJobs = await aiQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await aiQueue.removeRepeatableByKey(job.key);
    }

    // Add new repeatable job
    await aiQueue.add(
        "scan",
        { recurring: true },
        {
            repeat: {
                every: intervalMs,
            },
            jobId: "ai-scan-recurring",
        }
    );

    console.log(`[AI Queue] Scheduled recurring scans every ${intervalMs}ms`);
}

/**
 * AI scanning worker
 * Processes market scans and identifies opportunities
 */
export const aiWorker = new Worker(
    "ai-arbitrage",
    async (job) => {
        const { symbols, minProfit } = job.data;

        console.log(`[AI Worker] Scanning markets...`);

        try {
            // Scan for opportunities
            const opportunities = await scanMarketOpportunities(symbols, minProfit);

            if (opportunities.length === 0) {
                console.log("[AI Worker] No opportunities found");
                return { opportunities: [] };
            }

            console.log(`[AI Worker] Found ${opportunities.length} opportunities`);

            // Simulate each opportunity
            const simulations = await Promise.all(
                opportunities.map((opp) => simulateArbitrage(opp))
            );

            // Filter profitable simulations
            const profitable = simulations.filter(
                (sim) => sim.recommendation === "EXECUTE" && sim.profit > 0
            );

            console.log(`[AI Worker] ✅ ${profitable.length} profitable opportunities`);

            return {
                opportunities: profitable,
                scannedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error("[AI Worker] ❌ Scan failed:", error.message);
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 1, // Single worker to avoid duplicate scans
        limiter: {
            max: 10,
            duration: 60000, // Max 10 scans per minute
        },
    }
);

// Worker event handlers
aiWorker.on("completed", (job, result) => {
    console.log(`[AI Worker] Job ${job.id} completed: ${result.opportunities.length} opps`);
});

aiWorker.on("failed", (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} failed:`, err.message);
});

aiWorker.on("error", (err) => {
    console.error("[AI Worker] Worker error:", err.message);
});

/**
 * Get AI queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getAIQueueMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
        aiQueue.getWaitingCount(),
        aiQueue.getActiveCount(),
        aiQueue.getCompletedCount(),
        aiQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}
