import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/socket.js";
import { initCronJobs } from "./utils/cron.js";

const server = http.createServer(app);
initSocket(server);
initCronJobs();

server.listen(3000, () => {
    console.log("Backend running on port 3000");
    console.log("Binary trade auto-resolution active");
});
