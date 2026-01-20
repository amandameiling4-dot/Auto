import { Server } from "socket.io";
export let io: Server;

export const initSocket = (server: Server) => {
    io = server;
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
    });
};
