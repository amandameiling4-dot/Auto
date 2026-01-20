/**
 * Socket.IO Event Definitions
 * Centralized event names for type safety and consistency
 */

export const EVENTS = {
    // Market data events
    PRICE_UPDATE: "PRICE_UPDATE",
    MARKET_STATUS: "MARKET_STATUS",

    // Trade events
    TRADE_OPENED: "TRADE_OPENED",
    TRADE_CLOSED: "TRADE_CLOSED",
    TRADE_FORCE_CLOSED: "TRADE_FORCE_CLOSED",

    // Binary options events
    BINARY_OPENED: "BINARY_OPENED",
    BINARY_RESOLVED: "BINARY_RESOLVED",

    // Wallet events
    BALANCE_UPDATED: "BALANCE_UPDATED",
    WALLET_LOCKED: "WALLET_LOCKED",
    WALLET_UNLOCKED: "WALLET_UNLOCKED",

    // Transaction events
    TX_CREATED: "TX_CREATED",
    TX_STATUS_UPDATED: "TX_STATUS_UPDATED",
    TX_APPROVED: "TX_APPROVED",
    TX_REJECTED: "TX_REJECTED",

    // Admin events
    ADMIN_ACTION: "ADMIN_ACTION",
    USER_FROZEN: "USER_FROZEN",
    USER_UNFROZEN: "USER_UNFROZEN",

    // System events
    SYSTEM_ALERT: "SYSTEM_ALERT",
    MAINTENANCE_MODE: "MAINTENANCE_MODE",

    // AI events
    AI_TRADE_EXECUTED: "AI_TRADE_EXECUTED",
    AI_OPPORTUNITY_FOUND: "AI_OPPORTUNITY_FOUND"
};

/**
 * Event payload type definitions (for documentation)
 */
export const EVENT_PAYLOADS = {
    PRICE_UPDATE: {
        symbol: "string",
        price: "number",
        timestamp: "number"
    },

    BALANCE_UPDATED: {
        userId: "string",
        newBalance: "number",
        change: "number",
        reason: "string",
        timestamp: "Date"
    },

    TRADE_OPENED: {
        tradeId: "string",
        userId: "string",
        symbol: "string",
        type: "string", // LONG or SHORT
        amount: "number",
        entryPrice: "number",
        timestamp: "Date"
    },

    BINARY_RESOLVED: {
        tradeId: "string",
        result: "string", // WIN or LOSS
        entryPrice: "number",
        exitPrice: "number",
        payout: "number",
        timestamp: "Date"
    },

    ADMIN_ACTION: {
        adminId: "string",
        action: "string",
        target: "string",
        metadata: "object",
        timestamp: "Date"
    },

    SYSTEM_ALERT: {
        type: "string", // INFO, WARNING, CRITICAL
        message: "string",
        severity: "string",
        timestamp: "Date"
    }
};
