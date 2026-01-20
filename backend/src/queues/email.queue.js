import { Queue, Worker } from "bullmq";
import { redis } from "../redis/redis.client.js";

/**
 * Email Notification Queue
 * Sends email notifications asynchronously
 */
export const emailQueue = new Queue("email-notifications", {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 5000,
        },
        removeOnFail: {
            age: 604800, // Keep failed jobs for 7 days
        },
    },
});

/**
 * Schedule email notification
 * @param {string} to - Recipient email
 * @param {string} template - Email template name
 * @param {Object} data - Template data
 * @param {number} priority - Priority (1=high, 3=low)
 * @returns {Promise<Job>} BullMQ job
 */
export async function scheduleEmail(to, template, data, priority = 3) {
    return await emailQueue.add(
        "send",
        {
            to,
            template,
            data,
            queuedAt: new Date().toISOString(),
        },
        {
            priority,
            jobId: `email-${to}-${template}-${Date.now()}`,
        }
    );
}

/**
 * Send welcome email
 * @param {string} email - User email
 * @param {string} name - User name
 */
export async function sendWelcomeEmail(email, name) {
    return await scheduleEmail(email, "welcome", { name }, 2);
}

/**
 * Send KYC approval email
 * @param {string} email - User email
 * @param {string} name - User name
 */
export async function sendKYCApprovalEmail(email, name) {
    return await scheduleEmail(email, "kyc-approved", { name }, 1);
}

/**
 * Send KYC rejection email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} reason - Rejection reason
 */
export async function sendKYCRejectionEmail(email, name, reason) {
    return await scheduleEmail(email, "kyc-rejected", { name, reason }, 1);
}

/**
 * Send withdrawal approval email
 * @param {string} email - User email
 * @param {string} amount - Withdrawal amount
 */
export async function sendWithdrawalApprovalEmail(email, amount) {
    return await scheduleEmail(email, "withdrawal-approved", { amount }, 1);
}

/**
 * Send account frozen email
 * @param {string} email - User email
 * @param {string} reason - Freeze reason
 */
export async function sendAccountFrozenEmail(email, reason) {
    return await scheduleEmail(email, "account-frozen", { reason }, 1);
}

/**
 * Email worker
 * Processes email sending jobs
 */
export const emailWorker = new Worker(
    "email-notifications",
    async (job) => {
        const { to, template, data } = job.data;

        console.log(`[Email Worker] Sending ${template} email to ${to}`);

        try {
            // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
            // For now, just log the email
            console.log(`[Email Worker] Email content:`, {
                to,
                template,
                data,
            });

            // Simulate email sending delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log(`[Email Worker] ✅ Email sent to ${to}`);

            return { success: true, to, template };
        } catch (error) {
            console.error(`[Email Worker] ❌ Failed to send email to ${to}:`, error.message);
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 10, // Process up to 10 emails in parallel
        limiter: {
            max: 100,
            duration: 60000, // Max 100 emails per minute
        },
    }
);

// Worker event handlers
emailWorker.on("completed", (job) => {
    console.log(`[Email Worker] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`[Email Worker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on("error", (err) => {
    console.error("[Email Worker] Worker error:", err.message);
});

/**
 * Get email queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getEmailQueueMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}
