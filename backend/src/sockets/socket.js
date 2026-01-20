import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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
