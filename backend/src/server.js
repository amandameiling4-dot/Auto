import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/socket.js";
import { initCronJobs } from "./utils/cron.js";
import { connectMarketFeed } from "./market/market.gateway.js";
import { initQueues } from "./queues/index.js";

const server = http.createServer(app);
initSocket(server);
initCronJobs();
connectMarketFeed();

// Initialize Redis-backed job queues
initQueues().catch((error) => {
    console.error("Failed to initialize job queues:", error);
    process.exit(1);
});

server.listen(3000, () => {
    console.log("Backend running on port 3000");
    console.log("Binary trade auto-resolution active");
    console.log("Real-time market feed connected");
    console.log("Redis job queues initialized");
});
