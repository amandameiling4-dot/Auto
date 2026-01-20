import { io } from "socket.io-client";
import { API } from "./api";

// Global socket instance
let socket = null;

/**
 * Initialize socket connection with JWT token
 */
export const initSocket = (token) => {
    if (socket) {
        socket.disconnect();
    }

    socket = io(API, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
    });

    return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = () => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Custom React hook for live market prices
 */
export const useMarketPrices = (callback) => {
    const handlePriceUpdate = (data) => {
        if (callback) callback(data);
    };

    if (socket) {
        socket.on("PRICE_UPDATE", handlePriceUpdate);
    }

    return () => {
        if (socket) {
            socket.off("PRICE_UPDATE", handlePriceUpdate);
        }
    };
};

/**
 * Custom React hook for balance updates
 */
export const useBalanceUpdates = (callback) => {
    const handleBalanceUpdate = (data) => {
        if (callback) callback(data);
    };

    if (socket) {
        socket.on("BALANCE_UPDATED", handleBalanceUpdate);
    }

    return () => {
        if (socket) {
            socket.off("BALANCE_UPDATED", handleBalanceUpdate);
        }
    };
};

/**
 * Custom React hook for trade events
 */
export const useTradeEvents = (onOpened, onClosed) => {
    if (socket) {
        if (onOpened) socket.on("TRADE_OPENED", onOpened);
        if (onClosed) socket.on("TRADE_CLOSED", onClosed);
    }

    return () => {
        if (socket) {
            if (onOpened) socket.off("TRADE_OPENED", onOpened);
            if (onClosed) socket.off("TRADE_CLOSED", onClosed);
        }
    };
};

/**
 * Custom React hook for binary option events
 */
export const useBinaryEvents = (onOpened, onResolved) => {
    if (socket) {
        if (onOpened) socket.on("BINARY_OPENED", onOpened);
        if (onResolved) socket.on("BINARY_RESOLVED", onResolved);
    }

    return () => {
        if (socket) {
            if (onOpened) socket.off("BINARY_OPENED", onOpened);
            if (onResolved) socket.off("BINARY_RESOLVED", onResolved);
        }
    };
};

/**
 * Custom React hook for system alerts
 */
export const useSystemAlerts = (callback) => {
    if (socket) {
        socket.on("SYSTEM_ALERT", callback);
    }

    return () => {
        if (socket) {
            socket.off("SYSTEM_ALERT", callback);
        }
    };
};
