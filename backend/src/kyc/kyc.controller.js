import {
    startKYC,
    getKYCStatus,
    adminApproveKYC,
    adminRejectKYC,
    getPendingKYCVerifications,
} from "./kyc.service.js";
import { scheduleKYCVerification, scheduleKYCWebhook } from "../queues/kyc.queue.js";

/**
 * Start KYC verification
 * POST /kyc/start
 */
export async function startKYCVerification(req, res) {
    try {
        const userId = req.user.id; // From JWT middleware
        const { provider } = req.body;

        // Start KYC process
        const kyc = await startKYC(userId, provider);

        // Schedule async verification
        await scheduleKYCVerification(userId, {
            provider,
            documents: req.body.documents || [],
        });

        res.status(200).json({
            success: true,
            message: "KYC verification started",
            kyc,
        });
    } catch (error) {
        console.error("[KYC Controller] Start KYC error:", error.message);
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get KYC status for current user
 * GET /kyc/status
 */
export async function getUserKYCStatus(req, res) {
    try {
        const userId = req.user.id;

        const kyc = await getKYCStatus(userId);

        if (!kyc) {
            return res.status(200).json({
                success: true,
                status: "NOT_STARTED",
                message: "KYC not started",
            });
        }

        res.status(200).json({
            success: true,
            kyc,
        });
    } catch (error) {
        console.error("[KYC Controller] Get KYC status error:", error.message);
        res.status(500).json({ error: error.message });
    }
}

/**
 * KYC provider webhook handler
 * POST /kyc/webhook/:provider
 */
export async function handleKYCWebhook(req, res) {
    try {
        const { provider } = req.params;
        const webhookData = req.body;

        console.log(`[KYC Webhook] Received webhook from ${provider}`);

        // Extract user ID from webhook (provider-specific)
        const userId = webhookData.userId || webhookData.externalUserId;

        if (!userId) {
            return res.status(400).json({ error: "Missing user ID in webhook" });
        }

        // Schedule webhook processing
        await scheduleKYCWebhook(userId, {
            provider,
            ...webhookData,
        });

        res.status(200).json({ success: true, message: "Webhook received" });
    } catch (error) {
        console.error("[KYC Controller] Webhook error:", error.message);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Admin: Get pending KYC verifications
 * GET /admin/kyc/pending
 */
export async function getAdminPendingKYC(req, res) {
    try {
        const pending = await getPendingKYCVerifications();

        res.status(200).json({
            success: true,
            count: pending.length,
            pending,
        });
    } catch (error) {
        console.error("[KYC Controller] Get pending KYC error:", error.message);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Admin: Approve KYC
 * PUT /admin/kyc/:userId/approve
 */
export async function adminApproveKYCHandler(req, res) {
    try {
        const { userId } = req.params;
        const adminId = req.user.id;
        const { notes } = req.body;

        const kyc = await adminApproveKYC(userId, adminId, notes);

        res.status(200).json({
            success: true,
            message: "KYC approved",
            kyc,
        });
    } catch (error) {
        console.error("[KYC Controller] Admin approve KYC error:", error.message);
        res.status(400).json({ error: error.message });
    }
}

/**
 * Admin: Reject KYC
 * PUT /admin/kyc/:userId/reject
 */
export async function adminRejectKYCHandler(req, res) {
    try {
        const { userId } = req.params;
        const adminId = req.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Rejection reason required" });
        }

        const kyc = await adminRejectKYC(userId, adminId, reason);

        res.status(200).json({
            success: true,
            message: "KYC rejected",
            kyc,
        });
    } catch (error) {
        console.error("[KYC Controller] Admin reject KYC error:", error.message);
        res.status(400).json({ error: error.message });
    }
}
