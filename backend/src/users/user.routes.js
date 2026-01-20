const express = require('express');
const userController = require('./user.controller');
const { authenticate, requireUser, requireAdminOrMaster } = require('../auth/auth.middleware');

const router = express.Router();

// User routes
router.get('/me', authenticate, requireUser, userController.getMe);

// Admin/Master routes
router.get('/', authenticate, requireAdminOrMaster, userController.getAllUsers);
router.get('/:id', authenticate, requireAdminOrMaster, userController.getUserById);
router.patch('/:id/status', authenticate, requireAdminOrMaster, userController.updateStatus);

module.exports = router;
