const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./users/user.routes');
const walletRoutes = require('./wallets/wallet.routes');
const txRoutes = require('./transactions/tx.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/wallets', walletRoutes);
app.use('/transactions', txRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Error:', err.message);

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
