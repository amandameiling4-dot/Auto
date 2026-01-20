const authService = require('./auth.service');
const logger = require('../utils/logger');

/**
 * POST /auth/register
 * Register new user
 */
async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        logger.error('Register error:', error.message);
        next(error);
    }
}

/**
 * POST /auth/login
 * Login user
 */
async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (error) {
        logger.error('Login error:', error.message);
        next(error);
    }
}

/**
 * POST /auth/admin/register
 * Register new admin
 */
async function registerAdmin(req, res, next) {
    try {
        const result = await authService.registerAdmin(req.body);
        res.status(201).json(result);
    } catch (error) {
        logger.error('Admin register error:', error.message);
        next(error);
    }
}

/**
 * POST /auth/admin/login
 * Login admin
 */
async function loginAdmin(req, res, next) {
    try {
        const result = await authService.loginAdmin(req.body);
        res.json(result);
    } catch (error) {
        logger.error('Admin login error:', error.message);
        next(error);
    }
}

/**
 * GET /auth/me
 * Get current user info
 */
async function me(req, res) {
    res.json({ user: req.user });
}

module.exports = {
    register,
    login,
    registerAdmin,
    loginAdmin,
    me
};
