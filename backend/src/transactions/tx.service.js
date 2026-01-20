const prisma = require('../database/prisma');
const logger = require('../utils/logger');

/**
 * Get user's transactions
 * @param {string} userId - User ID
 * @param {Object} filters - { status, type, limit }
 * @returns {Array} - List of transactions
 */
async function getMyTransactions(userId, filters = {}) {
    const { status, type, limit = 50 } = filters;

    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
    });

    return transactions;
}

/**
 * Create withdrawal request (user initiates DEBIT)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to withdraw
 * @param {Object} metadata - Additional data
 * @returns {Object} - Created transaction
 */
async function createWithdrawalRequest(userId, amount, metadata = {}) {
    // Check wallet exists and not locked
    const wallet = await prisma.wallet.findUnique({
        where: { userId }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    if (wallet.locked) {
        throw new Error('Wallet is locked');
    }

    if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
    }

    // Create DEBIT transaction with PENDING status
    const transaction = await prisma.transaction.create({
        data: {
            userId,
            type: 'WITHDRAWAL',
            amount,
            status: 'PENDING',
            metadata: {
                ...metadata,
                requestedAt: new Date().toISOString()
            }
        }
    });

    logger.info(`Withdrawal request created: ${transaction.id} for user ${userId}`);

    return transaction;
}

/**
 * Create deposit (admin/master)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deposit
 * @param {string} actorId - Admin/master ID
 * @returns {Object} - Created transaction
 */
async function createDeposit(userId, amount, actorId) {
    const transaction = await prisma.transaction.create({
        data: {
            userId,
            type: 'DEPOSIT',
            amount,
            status: 'APPROVED',
            metadata: {
                approvedBy: actorId,
                approvedAt: new Date().toISOString()
            }
        }
    });

    // Update wallet balance
    await prisma.wallet.update({
        where: { userId },
        data: {
            balance: {
                increment: amount
            }
        }
    });

    logger.info(`Deposit created: ${transaction.id} for user ${userId} by ${actorId}`);

    return transaction;
}

/**
 * Approve transaction (admin/master)
 * @param {string} txId - Transaction ID
 * @param {string} actorId - Admin/master ID
 * @returns {Object} - Updated transaction
 */
async function approveTransaction(txId, actorId) {
    const tx = await prisma.transaction.findUnique({
        where: { id: txId }
    });

    if (!tx) {
        throw new Error('Transaction not found');
    }

    if (tx.status !== 'PENDING') {
        throw new Error(`Cannot approve transaction with status ${tx.status}`);
    }

    // Update transaction status
    const updated = await prisma.transaction.update({
        where: { id: txId },
        data: {
            status: 'APPROVED',
            metadata: {
                ...tx.metadata,
                approvedBy: actorId,
                approvedAt: new Date().toISOString()
            }
        }
    });

    // If withdrawal, deduct from wallet
    if (tx.type === 'WITHDRAWAL' || tx.type === 'DEBIT') {
        await prisma.wallet.update({
            where: { userId: tx.userId },
            data: {
                balance: {
                    decrement: tx.amount
                }
            }
        });
    }

    // If deposit/credit, add to wallet
    if (tx.type === 'DEPOSIT' || tx.type === 'CREDIT') {
        await prisma.wallet.update({
            where: { userId: tx.userId },
            data: {
                balance: {
                    increment: tx.amount
                }
            }
        });
    }

    logger.info(`Transaction ${txId} approved by ${actorId}`);

    return updated;
}

/**
 * Reject transaction (admin/master)
 * @param {string} txId - Transaction ID
 * @param {string} actorId - Admin/master ID
 * @param {string} reason - Rejection reason
 * @returns {Object} - Updated transaction
 */
async function rejectTransaction(txId, actorId, reason) {
    const tx = await prisma.transaction.findUnique({
        where: { id: txId }
    });

    if (!tx) {
        throw new Error('Transaction not found');
    }

    if (tx.status !== 'PENDING') {
        throw new Error(`Cannot reject transaction with status ${tx.status}`);
    }

    const updated = await prisma.transaction.update({
        where: { id: txId },
        data: {
            status: 'REJECTED',
            metadata: {
                ...tx.metadata,
                rejectedBy: actorId,
                rejectedAt: new Date().toISOString(),
                reason
            }
        }
    });

    logger.info(`Transaction ${txId} rejected by ${actorId}`);

    return updated;
}

/**
 * Get all pending transactions (admin/master)
 * @returns {Array} - List of pending transactions
 */
async function getPendingTransactions() {
    const transactions = await prisma.transaction.findMany({
        where: { status: 'PENDING' },
        include: {
            user: {
                select: {
                    id: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    return transactions;
}

module.exports = {
    getMyTransactions,
    createWithdrawalRequest,
    createDeposit,
    approveTransaction,
    rejectTransaction,
    getPendingTransactions
};
