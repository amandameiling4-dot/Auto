import { resolveExpiredBinaryTrades } from "../binary/binary.engine.js";

/**
 * Initialize cron jobs for system automation
 */
export function initCronJobs() {
    // Check for expired binary trades every 10 seconds
    setInterval(async () => {
        try {
            const results = await resolveExpiredBinaryTrades();
            if (results.length > 0) {
                console.log(`Resolved ${results.length} expired binary trades`);
            }
        } catch (error) {
            console.error("Error resolving expired binary trades:", error);
        }
    }, 10000); // 10 seconds

    console.log("Cron jobs initialized");
}
