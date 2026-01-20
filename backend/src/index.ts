import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initSocket } from "./socket";
import { ENV } from "./env";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

initSocket(io);

server.listen(ENV.PORT, () => {
    console.log(`Backend running on port ${ENV.PORT}`);
});
