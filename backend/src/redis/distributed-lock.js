import { redis } from "./redis.client.js";

/**
 * Distributed lock using Redis SET NX EX
 * Prevents race conditions in critical sections
 */
export class DistributedLock {
    /**
     * Acquire a distributed lock
     * @param {string} key - Lock key (e.g., "lock:trade:123")
     * @param {number} ttl - Time to live in seconds (default: 5)
     * @param {string} value - Lock value (default: timestamp)
     * @returns {Promise<boolean>} True if lock acquired, false otherwise
     */
    static async acquire(key, ttl = 5, value = Date.now().toString()) {
        try {
            const result = await redis.set(key, value, "NX", "EX", ttl);
            return result === "OK";
        } catch (error) {
            console.error(`Failed to acquire lock ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Release a distributed lock
     * @param {string} key - Lock key
     * @param {string} value - Lock value (must match)
     * @returns {Promise<boolean>} True if lock released, false otherwise
     */
    static async release(key, value) {
        try {
            // Lua script to ensure atomic check-and-delete
            const script = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;

            const result = await redis.eval(script, 1, key, value);
            return result === 1;
        } catch (error) {
            console.error(`Failed to release lock ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Execute function with distributed lock
     * @param {string} key - Lock key
     * @param {Function} fn - Function to execute
     * @param {number} ttl - Lock TTL in seconds
     * @returns {Promise<any>} Function result
     */
    static async withLock(key, fn, ttl = 5) {
        const lockValue = Date.now().toString();
        const acquired = await this.acquire(key, ttl, lockValue);

        if (!acquired) {
            throw new Error(`Failed to acquire lock: ${key}`);
        }

        try {
            return await fn();
        } finally {
            await this.release(key, lockValue);
        }
    }
}

/**
 * Lock trade for settlement (prevents double settlement)
 * @param {string} tradeId - Trade ID
 * @returns {Promise<boolean>} True if lock acquired
 */
export async function lockTrade(tradeId) {
    const key = `lock:trade:${tradeId}`;
    const acquired = await DistributedLock.acquire(key, 10); // 10 second lock

    if (!acquired) {
        throw new Error(`Trade ${tradeId} is already locked`);
    }

    return true;
}

/**
 * Unlock trade after settlement
 * @param {string} tradeId - Trade ID
 * @param {string} lockValue - Lock value from acquisition
 * @returns {Promise<boolean>} True if unlocked
 */
export async function unlockTrade(tradeId, lockValue) {
    const key = `lock:trade:${tradeId}`;
    return await DistributedLock.release(key, lockValue);
}

/**
 * Lock wallet for balance update (prevents race conditions)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if lock acquired
 */
export async function lockWallet(userId) {
    const key = `lock:wallet:${userId}`;
    const acquired = await DistributedLock.acquire(key, 5);

    if (!acquired) {
        throw new Error(`Wallet ${userId} is already locked`);
    }

    return true;
}

/**
 * Unlock wallet after balance update
 * @param {string} userId - User ID
 * @param {string} lockValue - Lock value from acquisition
 * @returns {Promise<boolean>} True if unlocked
 */
export async function unlockWallet(userId, lockValue) {
    const key = `lock:wallet:${userId}`;
    return await DistributedLock.release(key, lockValue);
}

/**
 * Lock binary trade for resolution
 * @param {string} binaryTradeId - Binary trade ID
 * @returns {Promise<boolean>} True if lock acquired
 */
export async function lockBinaryTrade(binaryTradeId) {
    const key = `lock:binary:${binaryTradeId}`;
    const acquired = await DistributedLock.acquire(key, 10);

    if (!acquired) {
        throw new Error(`Binary trade ${binaryTradeId} is already locked`);
    }

    return true;
}
