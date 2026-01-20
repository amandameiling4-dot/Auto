import express from "express";
import { helmetConfig, getCorsConfig } from "./middleware/security.js";
import {
    apiLimiter,
    authLimiter,
    tradeLimiter,
    binaryLimiter,
    adminLimiter
} from "./middleware/rateLimiter.js";
import { metricsMiddleware, metricsHandler } from "./metrics.js";

import authRoutes from "./auth/auth.routes.js";
import userRoutes from "./users/user.routes.js";
import walletRoutes from "./wallets/wallet.routes.js";
import tradeRoutes from "./trading/trade.routes.js";
import transactionRoutes from "./transactions/transaction.routes.js";
import binaryRoutes from "./binary/binary.routes.js";
import aiRoutes from "./ai/ai.routes.js";
import adminRoutes from "./admin/admin.routes.js";
import masterRoutes from "./master/master.routes.js";
import kycRoutes from "./kyc/kyc.routes.js";

const app = express();

// Metrics endpoint (before other middleware to avoid rate limiting)
app.get("/metrics", metricsHandler);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmetConfig);
app.use(getCorsConfig());
app.use(express.json());

// Metrics tracking middleware (track all HTTP requests)
app.use(metricsMiddleware);

// General API rate limiting
app.use(apiLimiter);

// Routes with specific rate limiters
app.use("/auth", authLimiter, authRoutes);
app.use("/users", userRoutes);
app.use("/wallets", walletRoutes);
app.use("/trades", tradeLimiter, tradeRoutes);
app.use("/transactions", transactionRoutes);
app.use("/binary", binaryLimiter, binaryRoutes);
app.use("/ai", aiRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/master", masterRoutes);
app.use("/kyc", kycRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/master", masterRoutes);

export default app;
