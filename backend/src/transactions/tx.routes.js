const express = require('express');
const txController = require('./tx.controller');
const { authenticate, requireUser, requireAdminOrMaster } = require('../auth/auth.middleware');

const router = express.Router();

// User routes
router.get('/my', authenticate, requireUser, txController.getMyTransactions);
router.post('/withdrawal', authenticate, requireUser, txController.createWithdrawal);

// Admin/Master routes
router.get('/pending', authenticate, requireAdminOrMaster, txController.getPending);
router.post('/deposit', authenticate, requireAdminOrMaster, txController.createDeposit);
router.post('/:id/approve', authenticate, requireAdminOrMaster, txController.approve);
router.post('/:id/reject', authenticate, requireAdminOrMaster, txController.reject);

module.exports = router;
