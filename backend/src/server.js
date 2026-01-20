import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/socket.js";

const server = http.createServer(app);
initSocket(server);

server.listen(3000, () => {
    console.log("Backend running on port 3000");
});
