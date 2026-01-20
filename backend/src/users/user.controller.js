const userService = require('./user.service');
const logger = require('../utils/logger');

/**
 * GET /users/me
 * Get current user profile
 */
async function getMe(req, res, next) {
    try {
        const user = await userService.getMyProfile(req.user.id);
        res.json(user);
    } catch (error) {
        logger.error('Get profile error:', error.message);
        next(error);
    }
}

/**
 * GET /users
 * Get all users (admin/master)
 */
async function getAllUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        logger.error('Get users error:', error.message);
        next(error);
    }
}

/**
 * GET /users/:id
 * Get user by ID (admin/master)
 */
async function getUserById(req, res, next) {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json(user);
    } catch (error) {
        logger.error('Get user error:', error.message);
        next(error);
    }
}

/**
 * PATCH /users/:id/status
 * Update user status (admin/master)
 */
async function updateStatus(req, res, next) {
    try {
        const { status } = req.body;
        const user = await userService.updateUserStatus(
            req.params.id,
            status,
            req.user.id
        );
        res.json(user);
    } catch (error) {
        logger.error('Update status error:', error.message);
        next(error);
    }
}

module.exports = {
    getMe,
    getAllUsers,
    getUserById,
    updateStatus
};
