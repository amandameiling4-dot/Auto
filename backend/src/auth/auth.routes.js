const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('./auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Admin routes
router.post('/admin/register', authController.registerAdmin);
router.post('/admin/login', authController.loginAdmin);

// Protected route
router.get('/me', authenticate, authController.me);

module.exports = router;
