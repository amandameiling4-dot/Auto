import { Queue, Worker } from "bullmq";
import { redis } from "../redis/redis.client.js";
import { performKYCCheck, updateKYCStatus } from "../kyc/kyc.service.js";

/**
 * KYC Verification Queue
 * Processes KYC document verification asynchronously
 */
export const kycQueue = new Queue("kyc-verification", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: {
            age: 604800, // Keep completed jobs for 7 days
            count: 1000,
        },
        removeOnFail: {
            age: 2592000, // Keep failed jobs for 30 days
        },
    },
});

/**
 * Schedule KYC verification
 * @param {string} userId - User ID
 * @param {Object} kycData - KYC data (documents, provider info)
 * @returns {Promise<Job>} BullMQ job
 */
export async function scheduleKYCVerification(userId, kycData) {
    return await kycQueue.add(
        "verify",
        {
            userId,
            kycData,
            submittedAt: new Date().toISOString(),
        },
        {
            jobId: `kyc-${userId}`,
            priority: 2, // Higher priority
        }
    );
}

/**
 * Schedule KYC webhook processing
 * @param {string} userId - User ID
 * @param {Object} webhookData - Webhook payload from provider
 * @returns {Promise<Job>} BullMQ job
 */
export async function scheduleKYCWebhook(userId, webhookData) {
    return await kycQueue.add(
        "webhook",
        {
            userId,
            webhookData,
            receivedAt: new Date().toISOString(),
        },
        {
            jobId: `kyc-webhook-${userId}-${Date.now()}`,
            priority: 1, // Highest priority
        }
    );
}

/**
 * KYC verification worker
 * Processes KYC verifications and webhooks
 */
export const kycWorker = new Worker(
    "kyc-verification",
    async (job) => {
        const { userId, kycData, webhookData } = job.data;

        if (job.name === "verify") {
            console.log(`[KYC Worker] Verifying KYC for user ${userId}`);

            try {
                // Perform KYC check (call external provider API)
                const result = await performKYCCheck(userId, kycData);

                // Update KYC status
                await updateKYCStatus(userId, result.status, result.metadata);

                console.log(`[KYC Worker] ✅ KYC verified for user ${userId}: ${result.status}`);

                return { success: true, status: result.status };
            } catch (error) {
                console.error(`[KYC Worker] ❌ KYC verification failed for user ${userId}:`, error.message);
                throw error;
            }
        } else if (job.name === "webhook") {
            console.log(`[KYC Worker] Processing KYC webhook for user ${userId}`);

            try {
                // Process webhook from KYC provider
                const status = webhookData.status; // APPROVED or REJECTED
                const metadata = {
                    provider: webhookData.provider,
                    providerId: webhookData.providerId,
                    verificationId: webhookData.verificationId,
                    documents: webhookData.documents,
                };

                // Update KYC status
                await updateKYCStatus(userId, status, metadata);

                console.log(`[KYC Worker] ✅ Webhook processed for user ${userId}: ${status}`);

                return { success: true, status };
            } catch (error) {
                console.error(`[KYC Worker] ❌ Webhook processing failed for user ${userId}:`, error.message);
                throw error;
            }
        }
    },
    {
        connection: redis,
        concurrency: 5, // Process up to 5 KYC checks in parallel
        limiter: {
            max: 20,
            duration: 60000, // Max 20 KYC checks per minute
        },
    }
);

// Worker event handlers
kycWorker.on("completed", (job) => {
    console.log(`[KYC Worker] Job ${job.id} completed`);
});

kycWorker.on("failed", (job, err) => {
    console.error(`[KYC Worker] Job ${job?.id} failed:`, err.message);
});

kycWorker.on("error", (err) => {
    console.error("[KYC Worker] Worker error:", err.message);
});

/**
 * Get KYC queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getKYCQueueMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
        kycQueue.getWaitingCount(),
        kycQueue.getActiveCount(),
        kycQueue.getCompletedCount(),
        kycQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}
