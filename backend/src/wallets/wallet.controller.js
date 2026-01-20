const walletService = require('./wallet.service');
const logger = require('../utils/logger');

/**
 * GET /wallets/my
 * Get current user's wallet
 */
async function getMyWallet(req, res, next) {
    try {
        const wallet = await walletService.getMyWallet(req.user.id);
        res.json(wallet);
    } catch (error) {
        logger.error('Get wallet error:', error.message);
        next(error);
    }
}

/**
 * PATCH /wallets/:userId/lock
 * Lock/unlock user wallet (admin/master)
 */
async function setLock(req, res, next) {
    try {
        const { locked } = req.body;
        const wallet = await walletService.setWalletLock(req.params.userId, locked);
        res.json(wallet);
    } catch (error) {
        logger.error('Set wallet lock error:', error.message);
        next(error);
    }
}

module.exports = {
    getMyWallet,
    setLock
};
