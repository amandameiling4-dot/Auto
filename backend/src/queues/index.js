/**
 * QUEUE INITIALIZATION MODULE
 * 
 * Initializes all BullMQ worker processes for async job processing:
 * - Binary options expiry resolution
 * - AI arbitrage market scanning
 * - KYC document verification
 * - Email notifications
 * 
 * All queues use Redis as the job storage backend.
 */

import { binaryWorker, getBinaryQueueMetrics } from "./binary.queue.js";
import { aiWorker, getAIQueueMetrics, scheduleRecurringAIScans } from "./ai.queue.js";
import { kycWorker, getKYCQueueMetrics } from "./kyc.queue.js";
import { emailWorker, getEmailQueueMetrics } from "./email.queue.js";

/**
 * Initialize all queue workers
 * Called on server startup
 */
export async function initQueues() {
    try {
        console.log("🚀 Initializing BullMQ job queues...");

        // All workers are already initialized by importing them
        // Workers automatically start processing jobs from their queues

        console.log("✅ Binary options resolution worker started");
        console.log("✅ AI arbitrage scanning worker started");
        console.log("✅ KYC verification worker started");
        console.log("✅ Email notification worker started");

        // Start recurring AI market scans (every 60 seconds)
        await scheduleRecurringAIScans(60000);
        console.log("✅ Recurring AI scans scheduled (every 60s)");

        console.log("🎉 All queue workers initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing queues:", error);
        throw error;
    }
}

/**
 * Get metrics for all queues
 * Used for monitoring and dashboards
 */
export async function getAllQueueMetrics() {
    try {
        const [binary, ai, kyc, email] = await Promise.all([
            getBinaryQueueMetrics(),
            getAIQueueMetrics(),
            getKYCQueueMetrics(),
            getEmailQueueMetrics(),
        ]);

        return {
            binary,
            ai,
            kyc,
            email,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error fetching queue metrics:", error);
        throw error;
    }
}

/**
 * Gracefully shut down all queue workers
 * Called during server shutdown
 */
export async function shutdownQueues() {
    try {
        console.log("🛑 Shutting down queue workers...");

        await Promise.all([
            binaryWorker.close(),
            aiWorker.close(),
            kycWorker.close(),
            emailWorker.close(),
        ]);

        console.log("✅ All queue workers shut down gracefully");
    } catch (error) {
        console.error("❌ Error shutting down queues:", error);
        throw error;
    }
}
