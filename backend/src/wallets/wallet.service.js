const prisma = require('../database/prisma');
const logger = require('../utils/logger');

/**
 * Get user's wallet
 * @param {string} userId - User ID
 * @returns {Object} - Wallet details
 */
async function getMyWallet(userId) {
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: {
            id: true,
            balance: true,
            locked: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return wallet;
}

/**
 * Create wallet for user
 * @param {string} userId - User ID
 * @returns {Object} - Created wallet
 */
async function createWallet(userId) {
    const wallet = await prisma.wallet.create({
        data: {
            userId,
            balance: 0,
            locked: false
        }
    });

    logger.info(`Wallet created for user ${userId}`);

    return wallet;
}

/**
 * Lock/unlock wallet (admin/master only)
 * @param {string} userId - User ID
 * @param {boolean} locked - Lock status
 * @returns {Object} - Updated wallet
 */
async function setWalletLock(userId, locked) {
    const wallet = await prisma.wallet.update({
        where: { userId },
        data: { locked }
    });

    logger.info(`Wallet ${locked ? 'locked' : 'unlocked'} for user ${userId}`);

    return wallet;
}

/**
 * Get wallet balance
 * @param {string} userId - User ID
 * @returns {number} - Balance
 */
async function getBalance(userId) {
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return wallet.balance;
}

module.exports = {
    getMyWallet,
    createWallet,
    setWalletLock,
    getBalance
};
