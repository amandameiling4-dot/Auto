import { io } from "socket.io-client";
import { API } from "./api";

// Global socket instance
let socket = null;

/**
 * Initialize socket connection with JWT token for admin
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
        console.log("✅ Admin Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Admin Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
        console.error("Admin socket connection error:", error.message);
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
