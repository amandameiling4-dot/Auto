import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { EVENTS } from "./events.js";
import { getAllMarketPrices } from "../market/market.service.js";

let io;

export function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;

            // Join role-specific rooms
            if (decoded.role === "USER") {
                socket.join(`user:${decoded.id}`);
            } else if (decoded.role === "ADMIN") {
                socket.join("admin");
            } else if (decoded.role === "MASTER") {
                socket.join("master");
            }

            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userRole})`);

        // Send current market prices on connection
        try {
            const allPrices = getAllMarketPrices();
            socket.emit(EVENTS.PRICE_UPDATE, allPrices);
        } catch (error) {
            console.error("Error sending initial prices:", error);
        }

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    console.log("Socket.IO initialized");
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
}

/**
 * Emit price update to all connected clients
 * Called by market gateway when new price data arrives
 */
export function emitPriceUpdate(symbol, price) {
    if (!io) return;

    io.emit(EVENTS.PRICE_UPDATE, {
        symbol,
        price,
        timestamp: Date.now()
    });
}

/**
 * Emit balance update to specific user
 */
export function emitBalanceUpdate(userId, data) {
    if (!io) return;

    io.to(`user:${userId}`).emit(EVENTS.BALANCE_UPDATED, {
        userId,
        ...data,
        timestamp: new Date()
    });
}

/**
 * Emit trade event to specific user
 */
export function emitTradeEvent(eventName, userId, data) {
    if (!io) return;

    io.to(`user:${userId}`).emit(eventName, {
        userId,
        ...data,
        timestamp: new Date()
    });
}

/**
 * Emit admin action to master room
 */
export function emitAdminAction(adminId, action, target, metadata) {
    if (!io) return;

    io.to("master").emit(EVENTS.ADMIN_ACTION, {
        adminId,
        action,
        target,
        metadata,
        timestamp: new Date()
    });
}

/**
 * Emit system alert to all users
 */
export function emitSystemAlert(type, message, severity = "INFO") {
    if (!io) return;

    io.emit(EVENTS.SYSTEM_ALERT, {
        type,
        message,
        severity,
        timestamp: new Date()
    });
}

/**
 * Get connected client count
 */
export function getConnectionStats() {
    if (!io) return { total: 0, rooms: {} };

    return {
        total: io.sockets.sockets.size,
        rooms: {
            admin: io.sockets.adapter.rooms.get("admin")?.size || 0,
            master: io.sockets.adapter.rooms.get("master")?.size || 0
        }
    };
}

