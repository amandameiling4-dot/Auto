const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../env');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload { id, email, role }
 * @returns {string} - Signed JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 * @throws {Error} - If token is invalid
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = {
    generateToken,
    verifyToken
};
