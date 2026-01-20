import client from "prom-client";

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for OnChainWeb Platform

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [register],
});

// HTTP Request Duration
export const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register],
});

// Active WebSocket Connections
export const activeWebSocketConnections = new client.Gauge({
    name: "websocket_connections_active",
    help: "Number of active WebSocket connections",
    labelNames: ["role"],
    registers: [register],
});

// Trade Operations Counter
export const tradeOperationsCounter = new client.Counter({
    name: "trade_operations_total",
    help: "Total number of trade operations",
    labelNames: ["type", "status"],
    registers: [register],
});

// Binary Options Counter
export const binaryOptionsCounter = new client.Counter({
    name: "binary_options_total",
    help: "Total number of binary options trades",
    labelNames: ["direction", "result"],
    registers: [register],
});

// Transaction Approvals Counter
export const transactionApprovalsCounter = new client.Counter({
    name: "transaction_approvals_total",
    help: "Total number of transaction approvals",
    labelNames: ["type", "status"],
    registers: [register],
});

// Admin Actions Counter
export const adminActionsCounter = new client.Counter({
    name: "admin_actions_total",
    help: "Total number of admin actions",
    labelNames: ["action", "admin_id"],
    registers: [register],
});

// Wallet Balance Gauge (total platform balance)
export const totalWalletBalance = new client.Gauge({
    name: "wallet_balance_total",
    help: "Total wallet balance across all users",
    registers: [register],
});

// Open Trades Gauge
export const openTradesGauge = new client.Gauge({
    name: "trades_open_count",
    help: "Number of currently open trades",
    registers: [register],
});

// Market Feed Status
export const marketFeedStatus = new client.Gauge({
    name: "market_feed_status",
    help: "Market feed connection status (1=connected, 0=disconnected)",
    labelNames: ["feed_name"],
    registers: [register],
});

// Database Connection Pool
export const dbConnectionPool = new client.Gauge({
    name: "db_connection_pool_size",
    help: "Database connection pool size",
    labelNames: ["status"],
    registers: [register],
});

// Failed Login Attempts
export const failedLoginAttempts = new client.Counter({
    name: "failed_login_attempts_total",
    help: "Total number of failed login attempts",
    labelNames: ["reason"],
    registers: [register],
});

// Rate Limit Hits
export const rateLimitHits = new client.Counter({
    name: "rate_limit_hits_total",
    help: "Total number of rate limit hits",
    labelNames: ["endpoint"],
    registers: [register],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;

        httpRequestCounter.inc({
            method: req.method,
            route,
            status: res.statusCode,
        });

        httpRequestDuration.observe(
            {
                method: req.method,
                route,
                status: res.statusCode,
            },
            duration
        );
    });

    next();
};

// Metrics endpoint handler
export const metricsHandler = async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (error) {
        res.status(500).end(error.message);
    }
};

// Export register for use in other modules
export { register };
