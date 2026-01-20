const prisma = require('../database/prisma');
const logger = require('../utils/logger');

/**
 * Get current user profile with wallet
 * @param {string} userId - User ID
 * @returns {Object} - User with wallet
 */
async function getMyProfile(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            wallet: {
                select: {
                    id: true,
                    balance: true,
                    locked: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Get all users (admin/master only)
 * @returns {Array} - List of users
 */
async function getAllUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            wallet: {
                select: {
                    balance: true,
                    locked: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return users;
}

/**
 * Get user by ID (admin/master only)
 * @param {string} userId - User ID
 * @returns {Object} - User details
 */
async function getUserById(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            wallet: true,
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Update user status (admin/master only)
 * @param {string} userId - User ID
 * @param {string} status - ACTIVE | FROZEN | SUSPENDED
 * @param {string} actorId - ID of admin/master performing action
 * @returns {Object} - Updated user
 */
async function updateUserStatus(userId, status, actorId) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            updatedAt: true
        }
    });

    logger.info(`User ${userId} status updated to ${status} by ${actorId}`);

    return user;
}

module.exports = {
    getMyProfile,
    getAllUsers,
    getUserById,
    updateUserStatus
};
