import express from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.js";
import {
    startKYCVerification,
    getUserKYCStatus,
    handleKYCWebhook,
    getAdminPendingKYC,
    adminApproveKYCHandler,
    adminRejectKYCHandler,
} from "./kyc.controller.js";

const router = express.Router();

/**
 * User KYC Routes
 */

// Start KYC verification
router.post("/start", authenticate, startKYCVerification);

// Get KYC status
router.get("/status", authenticate, getUserKYCStatus);

/**
 * KYC Provider Webhook
 * No authentication required (validated by provider signature)
 */
router.post("/webhook/:provider", handleKYCWebhook);

/**
 * Admin KYC Routes
 */

// Get pending KYC verifications
router.get("/admin/pending", authenticate, requireRole(["ADMIN", "MASTER"]), getAdminPendingKYC);

// Approve KYC
router.put("/admin/:userId/approve", authenticate, requireRole(["ADMIN", "MASTER"]), adminApproveKYCHandler);

// Reject KYC
router.put("/admin/:userId/reject", authenticate, requireRole(["ADMIN", "MASTER"]), adminRejectKYCHandler);

export default router;
