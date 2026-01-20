import prisma from "../database/prisma.js";

/**
 * Create a new transaction (deposit/withdrawal request)
 */
export async function createTransaction(userId, type, amount, metadata = {}) {
    return prisma.transaction.create({
        data: {
            userId,
            type,
            amount,
            status: "PENDING",
            metadata
        }
    });
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(userId, filters = {}) {
    const where = { userId };

    if (filters.type) {
        where.type = filters.type;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    return prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0
    });
}

/**
 * Get pending transactions (for admin approval)
 */
export async function getPendingTransactions() {
    return prisma.transaction.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "asc" }
    });
}
