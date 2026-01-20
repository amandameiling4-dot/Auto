const { verifyToken } = require('../utils/token');
const logger = require('../utils/logger');

/**
 * Authenticate request - verify JWT token
 * Attaches user to req.user
 */
function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Verify token
        const decoded = verifyToken(token);

        // Attach user to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        logger.error('Authentication failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Require specific roles
 * @param {Array<string>} allowedRoles - ['USER', 'ADMIN', 'MASTER']
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Access denied for ${req.user.email} (${req.user.role})`);
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
}

/**
 * Require USER role only
 */
function requireUser(req, res, next) {
    return requireRole(['USER'])(req, res, next);
}

/**
 * Require ADMIN role
 */
function requireAdmin(req, res, next) {
    return requireRole(['ADMIN'])(req, res, next);
}

/**
 * Require MASTER role
 */
function requireMaster(req, res, next) {
    return requireRole(['MASTER'])(req, res, next);
}

/**
 * Require ADMIN or MASTER role
 */
function requireAdminOrMaster(req, res, next) {
    return requireRole(['ADMIN', 'MASTER'])(req, res, next);
}

module.exports = {
    authenticate,
    requireRole,
    requireUser,
    requireAdmin,
    requireMaster,
    requireAdminOrMaster
};
