import { prisma } from "../database/prisma.js";
import { sendKYCApprovalEmail, sendKYCRejectionEmail } from "../queues/email.queue.js";

/**
 * KYC Service
 * Handles KYC verification workflow
 */

/**
 * Start KYC process for user
 * @param {string} userId - User ID
 * @param {string} provider - KYC provider (SUMSUB, ONFIDO, VERIFF)
 * @returns {Promise<Object>} KYC record
 */
export async function startKYC(userId, provider = "SUMSUB") {
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, kycStatus: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.kycStatus === "APPROVED") {
        throw new Error("KYC already approved");
    }

    if (user.kycStatus === "PENDING") {
        throw new Error("KYC verification already in progress");
    }

    // Create or update KYC record
    const kyc = await prisma.kYC.upsert({
        where: { userId },
        create: {
            userId,
            status: "PENDING",
            provider,
        },
        update: {
            status: "PENDING",
            provider,
            updatedAt: new Date(),
        },
    });

    // Update user KYC status
    await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
    });

    console.log(`[KYC] Started KYC verification for user ${userId} with ${provider}`);

    return kyc;
}

/**
 * Perform KYC check (simulate external provider call)
 * @param {string} userId - User ID
 * @param {Object} kycData - KYC data (documents, etc.)
 * @returns {Promise<Object>} Verification result
 */
export async function performKYCCheck(userId, kycData) {
    // TODO: Integrate with actual KYC provider API
    // For now, simulate a check

    console.log(`[KYC] Performing KYC check for user ${userId}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate approval/rejection (80% approval rate)
    const approved = Math.random() > 0.2;

    return {
        status: approved ? "APPROVED" : "REJECTED",
        metadata: {
            provider: kycData.provider || "SUMSUB",
            providerId: `ext-${Date.now()}`,
            documents: kycData.documents || [],
            verifiedAt: new Date().toISOString(),
        },
    };
}

/**
 * Update KYC status
 * @param {string} userId - User ID
 * @param {string} status - New status (APPROVED, REJECTED)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Updated KYC record
 */
export async function updateKYCStatus(userId, status, metadata = {}) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Update KYC record
    const kyc = await prisma.kYC.update({
        where: { userId },
        data: {
            status,
            providerId: metadata.providerId,
            documents: metadata.documents,
            approvedAt: status === "APPROVED" ? new Date() : null,
            rejectedAt: status === "REJECTED" ? new Date() : null,
            updatedAt: new Date(),
        },
    });

    // Update user KYC status
    await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: status },
    });

    // Send notification email
    if (status === "APPROVED") {
        await sendKYCApprovalEmail(user.email, user.email.split("@")[0]);
        console.log(`[KYC] ✅ KYC approved for user ${userId}`);
    } else if (status === "REJECTED") {
        await sendKYCRejectionEmail(user.email, user.email.split("@")[0], "Document verification failed");
        console.log(`[KYC] ❌ KYC rejected for user ${userId}`);
    }

    return kyc;
}

/**
 * Get KYC status for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} KYC record
 */
export async function getKYCStatus(userId) {
    return await prisma.kYC.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    kycStatus: true,
                },
            },
        },
    });
}

/**
 * Admin: Approve KYC manually
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID who approved
 * @param {string} notes - Admin notes
 * @returns {Promise<Object>} Updated KYC record
 */
export async function adminApproveKYC(userId, adminId, notes = "") {
    const kyc = await prisma.kYC.update({
        where: { userId },
        data: {
            status: "APPROVED",
            reviewedBy: adminId,
            notes,
            approvedAt: new Date(),
            updatedAt: new Date(),
        },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "APPROVED" },
    });

    // Log audit trail
    await prisma.auditLog.create({
        data: {
            actorId: adminId,
            actorRole: "ADMIN",
            action: "KYC_APPROVED",
            target: userId,
            metadata: { notes },
        },
    });

    console.log(`[KYC] Admin ${adminId} approved KYC for user ${userId}`);

    return kyc;
}

/**
 * Admin: Reject KYC manually
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID who rejected
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated KYC record
 */
export async function adminRejectKYC(userId, adminId, reason) {
    const kyc = await prisma.kYC.update({
        where: { userId },
        data: {
            status: "REJECTED",
            reviewedBy: adminId,
            notes: reason,
            rejectedAt: new Date(),
            updatedAt: new Date(),
        },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "REJECTED" },
    });

    // Log audit trail
    await prisma.auditLog.create({
        data: {
            actorId: adminId,
            actorRole: "ADMIN",
            action: "KYC_REJECTED",
            target: userId,
            metadata: { reason },
        },
    });

    console.log(`[KYC] Admin ${adminId} rejected KYC for user ${userId}: ${reason}`);

    return kyc;
}

/**
 * Check if user can withdraw (KYC requirement)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user can withdraw
 */
export async function canUserWithdraw(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { kycStatus: true, status: true },
    });

    if (!user) {
        return false;
    }

    // User must have approved KYC and be active
    return user.kycStatus === "APPROVED" && user.status === "ACTIVE";
}

/**
 * Get all pending KYC verifications (Admin view)
 * @returns {Promise<Array>} Pending KYC records
 */
export async function getPendingKYCVerifications() {
    return await prisma.kYC.findMany({
        where: { status: "PENDING" },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });
}
