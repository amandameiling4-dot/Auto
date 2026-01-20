const txService = require('./tx.service');
const logger = require('../utils/logger');

/**
 * GET /transactions/my
 * Get current user's transactions
 */
async function getMyTransactions(req, res, next) {
    try {
        const transactions = await txService.getMyTransactions(req.user.id, req.query);
        res.json(transactions);
    } catch (error) {
        logger.error('Get transactions error:', error.message);
        next(error);
    }
}

/**
 * POST /transactions/withdrawal
 * Create withdrawal request
 */
async function createWithdrawal(req, res, next) {
    try {
        const { amount, ...metadata } = req.body;
        const transaction = await txService.createWithdrawalRequest(
            req.user.id,
            amount,
            metadata
        );
        res.status(201).json(transaction);
    } catch (error) {
        logger.error('Create withdrawal error:', error.message);
        next(error);
    }
}

/**
 * POST /transactions/deposit
 * Create deposit (admin/master)
 */
async function createDeposit(req, res, next) {
    try {
        const { userId, amount } = req.body;
        const transaction = await txService.createDeposit(userId, amount, req.user.id);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error('Create deposit error:', error.message);
        next(error);
    }
}

/**
 * GET /transactions/pending
 * Get pending transactions (admin/master)
 */
async function getPending(req, res, next) {
    try {
        const transactions = await txService.getPendingTransactions();
        res.json(transactions);
    } catch (error) {
        logger.error('Get pending transactions error:', error.message);
        next(error);
    }
}

/**
 * POST /transactions/:id/approve
 * Approve transaction (admin/master)
 */
async function approve(req, res, next) {
    try {
        const transaction = await txService.approveTransaction(req.params.id, req.user.id);
        res.json(transaction);
    } catch (error) {
        logger.error('Approve transaction error:', error.message);
        next(error);
    }
}

/**
 * POST /transactions/:id/reject
 * Reject transaction (admin/master)
 */
async function reject(req, res, next) {
    try {
        const { reason } = req.body;
        const transaction = await txService.rejectTransaction(
            req.params.id,
            req.user.id,
            reason
        );
        res.json(transaction);
    } catch (error) {
        logger.error('Reject transaction error:', error.message);
        next(error);
    }
}

module.exports = {
    getMyTransactions,
    createWithdrawal,
    createDeposit,
    getPending,
    approve,
    reject
};
