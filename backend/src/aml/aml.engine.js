import { prisma } from "../database/prisma.js";
import { sendAccountFrozenEmail } from "../queues/email.queue.js";

/**
 * AML (Anti-Money Laundering) Rules Engine
 * Monitors and detects suspicious activity patterns
 */

/**
 * AML Check Types
 */
const AML_CHECK_TYPES = {
    VELOCITY: "VELOCITY", // High transaction velocity
    ANOMALY: "ANOMALY", // Unusual trade patterns
    SANCTIONS: "SANCTIONS", // Sanctions list check
    COUNTRY: "COUNTRY", // Country restrictions
    ABUSE: "ABUSE", // Admin abuse patterns
};

/**
 * AML Severity Levels
 */
const AML_SEVERITY = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
};

/**
 * AML Result Types
 */
const AML_RESULT = {
    PASS: "PASS",
    FAIL: "FAIL",
    REVIEW: "REVIEW",
};

/**
 * AML Configuration (thresholds)
 */
const AML_CONFIG = {
    MAX_DAILY_DEPOSITS: 50000, // $50k per day
    MAX_DAILY_WITHDRAWALS: 50000,
    MAX_TRADE_SIZE: 100000, // $100k per trade
    MAX_TRADES_PER_HOUR: 100,
    SUSPICIOUS_VELOCITY_THRESHOLD: 10, // 10 transactions per minute
    BANNED_COUNTRIES: ["KP", "IR", "SY"], // North Korea, Iran, Syria
};

/**
 * Run all AML checks for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} AML check results
 */
export async function runAMLChecks(userId) {
    console.log(`[AML] Running AML checks for user ${userId}`);

    const results = {
        userId,
        checks: [],
        overallResult: AML_RESULT.PASS,
        highestSeverity: AML_SEVERITY.LOW,
    };

    try {
        // Run all checks in parallel
        const [velocityCheck, anomalyCheck, tradeVolumeCheck] = await Promise.all([
            checkVelocity(userId),
            checkTradeAnomaly(userId),
            checkTradeVolume(userId),
        ]);

        results.checks.push(velocityCheck, anomalyCheck, tradeVolumeCheck);

        // Determine overall result
        const failedChecks = results.checks.filter((c) => c.result === AML_RESULT.FAIL);
        const reviewChecks = results.checks.filter((c) => c.result === AML_RESULT.REVIEW);

        if (failedChecks.length > 0) {
            results.overallResult = AML_RESULT.FAIL;
            results.highestSeverity = Math.max(
                ...failedChecks.map((c) => severityToNumber(c.severity))
            );
        } else if (reviewChecks.length > 0) {
            results.overallResult = AML_RESULT.REVIEW;
            results.highestSeverity = Math.max(
                ...reviewChecks.map((c) => severityToNumber(c.severity))
            );
        }

        // Save check results
        for (const check of results.checks) {
            await prisma.aMLCheck.create({
                data: {
                    userId,
                    checkType: check.type,
                    severity: check.severity,
                    result: check.result,
                    metadata: check.metadata,
                    notes: check.notes,
                },
            });
        }

        // If critical failure, freeze user
        if (results.overallResult === AML_RESULT.FAIL && results.highestSeverity === AML_SEVERITY.CRITICAL) {
            await freezeUserForAML(userId, "Critical AML violation detected");
        }

        console.log(`[AML] Completed checks for user ${userId}: ${results.overallResult}`);

        return results;
    } catch (error) {
        console.error(`[AML] Error running checks for user ${userId}:`, error.message);
        throw error;
    }
}

/**
 * Check transaction velocity (deposits/withdrawals per time window)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Check result
 */
async function checkVelocity(userId) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count transactions in last minute
    const recentTxCount = await prisma.transaction.count({
        where: {
            userId,
            createdAt: { gte: oneMinuteAgo },
        },
    });

    // Sum daily deposits
    const dailyDeposits = await prisma.transaction.aggregate({
        where: {
            userId,
            type: "DEPOSIT",
            status: "COMPLETED",
            createdAt: { gte: oneDayAgo },
        },
        _sum: { amount: true },
    });

    const totalDailyDeposits = Number(dailyDeposits._sum.amount || 0);

    // Determine result
    let result = AML_RESULT.PASS;
    let severity = AML_SEVERITY.LOW;

    if (recentTxCount > AML_CONFIG.SUSPICIOUS_VELOCITY_THRESHOLD) {
        result = AML_RESULT.FAIL;
        severity = AML_SEVERITY.CRITICAL;
    } else if (totalDailyDeposits > AML_CONFIG.MAX_DAILY_DEPOSITS) {
        result = AML_RESULT.REVIEW;
        severity = AML_SEVERITY.HIGH;
    }

    return {
        type: AML_CHECK_TYPES.VELOCITY,
        result,
        severity,
        metadata: {
            recentTxCount,
            totalDailyDeposits,
            threshold: AML_CONFIG.SUSPICIOUS_VELOCITY_THRESHOLD,
        },
        notes: result === AML_RESULT.PASS ? null : "High transaction velocity detected",
    };
}

/**
 * Check for unusual trade patterns
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Check result
 */
async function checkTradeAnomaly(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count trades in last hour
    const recentTradesCount = await prisma.trade.count({
        where: {
            userId,
            createdAt: { gte: oneHourAgo },
        },
    });

    // Get average trade size
    const avgTrade = await prisma.trade.aggregate({
        where: { userId },
        _avg: { amount: true },
    });

    const avgAmount = Number(avgTrade._avg.amount || 0);

    let result = AML_RESULT.PASS;
    let severity = AML_SEVERITY.LOW;

    if (recentTradesCount > AML_CONFIG.MAX_TRADES_PER_HOUR) {
        result = AML_RESULT.REVIEW;
        severity = AML_SEVERITY.MEDIUM;
    }

    return {
        type: AML_CHECK_TYPES.ANOMALY,
        result,
        severity,
        metadata: {
            recentTradesCount,
            avgAmount,
            threshold: AML_CONFIG.MAX_TRADES_PER_HOUR,
        },
        notes: result === AML_RESULT.PASS ? null : "Unusual trading activity detected",
    };
}

/**
 * Check trade volume limits
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Check result
 */
async function checkTradeVolume(userId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Sum daily trade volume
    const dailyVolume = await prisma.trade.aggregate({
        where: {
            userId,
            createdAt: { gte: oneDayAgo },
        },
        _sum: { amount: true },
    });

    const totalVolume = Number(dailyVolume._sum.amount || 0);

    let result = AML_RESULT.PASS;
    let severity = AML_SEVERITY.LOW;

    if (totalVolume > AML_CONFIG.MAX_TRADE_SIZE * 5) {
        result = AML_RESULT.REVIEW;
        severity = AML_SEVERITY.HIGH;
    }

    return {
        type: AML_CHECK_TYPES.VELOCITY,
        result,
        severity,
        metadata: {
            totalVolume,
            threshold: AML_CONFIG.MAX_TRADE_SIZE,
        },
        notes: result === AML_RESULT.PASS ? null : "High trade volume detected",
    };
}

/**
 * Freeze user for AML violation
 * @param {string} userId - User ID
 * @param {string} reason - Freeze reason
 * @returns {Promise<void>}
 */
async function freezeUserForAML(userId, reason) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { status: "FROZEN" },
        select: { email: true },
    });

    // Lock wallet
    await prisma.wallet.update({
        where: { userId },
        data: { locked: true },
    });

    // Log audit trail
    await prisma.auditLog.create({
        data: {
            actorId: "SYSTEM",
            actorRole: "SYSTEM",
            action: "USER_FROZEN_AML",
            target: userId,
            metadata: { reason },
        },
    });

    // Send notification email
    await sendAccountFrozenEmail(user.email, reason);

    console.log(`[AML] ⚠️ User ${userId} frozen for AML violation: ${reason}`);
}

/**
 * Convert severity string to number for comparison
 * @param {string} severity - Severity level
 * @returns {number} Severity number
 */
function severityToNumber(severity) {
    const map = {
        [AML_SEVERITY.LOW]: 1,
        [AML_SEVERITY.MEDIUM]: 2,
        [AML_SEVERITY.HIGH]: 3,
        [AML_SEVERITY.CRITICAL]: 4,
    };
    return map[severity] || 0;
}

/**
 * Get AML check history for user
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} AML checks
 */
export async function getAMLCheckHistory(userId, limit = 50) {
    return await prisma.aMLCheck.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

/**
 * Get all unresolved AML checks (Admin view)
 * @returns {Promise<Array>} Unresolved AML checks
 */
export async function getUnresolvedAMLChecks() {
    return await prisma.aMLCheck.findMany({
        where: {
            result: { in: ["FAIL", "REVIEW"] },
            resolvedAt: null,
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Admin: Resolve AML check
 * @param {string} checkId - AML check ID
 * @param {string} adminId - Admin ID
 * @param {string} notes - Resolution notes
 * @returns {Promise<Object>} Updated AML check
 */
export async function resolveAMLCheck(checkId, adminId, notes) {
    const check = await prisma.aMLCheck.update({
        where: { id: checkId },
        data: {
            resolvedBy: adminId,
            resolvedAt: new Date(),
            notes,
        },
    });

    await prisma.auditLog.create({
        data: {
            actorId: adminId,
            actorRole: "ADMIN",
            action: "AML_RESOLVED",
            target: check.userId,
            metadata: { checkId, notes },
        },
    });

    console.log(`[AML] Admin ${adminId} resolved AML check ${checkId}`);

    return check;
}
