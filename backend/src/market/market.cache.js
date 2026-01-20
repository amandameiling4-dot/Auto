/**
 * Market Price Cache - Single Source of Truth
 * All price data flows through this cache
 * Used by: Trading Engine, Binary Engine, AI Engine, Charts
 */

const marketCache = new Map();

/**
 * Set price in cache with timestamp
 * Called by market gateway when receiving feed data
 */
export function setPrice(symbol, price) {
    marketCache.set(symbol, {
        price: parseFloat(price),
        timestamp: Date.now()
    });
}

/**
 * Get price data for a symbol
 * Returns: { price: number, timestamp: number } or undefined
 */
export function getPrice(symbol) {
    return marketCache.get(symbol);
}

/**
 * Get all cached prices
 * Returns: { symbol: { price, timestamp } }
 */
export function getAllPrices() {
    const prices = {};
    for (const [symbol, data] of marketCache.entries()) {
        prices[symbol] = data;
    }
    return prices;
}

/**
 * Check if price data is stale
 * Returns true if price is older than 60 seconds
 */
export function isPriceStale(symbol, maxAge = 60000) {
    const data = getPrice(symbol);
    if (!data) return true;
    return Date.now() - data.timestamp > maxAge;
}

/**
 * Clear all cached prices
 * Used for testing or system reset
 */
export function clearCache() {
    marketCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const stats = {
        totalSymbols: marketCache.size,
        staleCount: 0,
        symbols: []
    };

    for (const [symbol, data] of marketCache.entries()) {
        const age = Date.now() - data.timestamp;
        const isStale = age > 60000;

        if (isStale) stats.staleCount++;

        stats.symbols.push({
            symbol,
            price: data.price,
            age: Math.floor(age / 1000), // seconds
            stale: isStale
        });
    }

    return stats;
}
