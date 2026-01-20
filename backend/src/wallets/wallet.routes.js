const express = require('express');
const walletController = require('./wallet.controller');
const { authenticate, requireUser, requireAdminOrMaster } = require('../auth/auth.middleware');

const router = express.Router();

// User routes
router.get('/my', authenticate, requireUser, walletController.getMyWallet);

// Admin/Master routes
router.patch('/:userId/lock', authenticate, requireAdminOrMaster, walletController.setLock);

module.exports = router;
