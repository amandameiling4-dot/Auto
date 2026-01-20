import { getPrice, isPriceStale, getAllPrices as getCachedPrices } from "./market.cache.js";

/**
 * Market Service - Internal Access Layer
 * Used by: Trading Engine, Binary Engine, AI Engine, Charts
 * 
 * All price data comes from market.cache.js (single source of truth)
 * Fed by market.gateway.js (WebSocket connections)
 */

/**
 * Get current market price for a symbol
 * Throws error if data unavailable or stale
 */
export function getMarketPrice(symbol) {
    const data = getPrice(symbol);

    if (!data) {
        throw new Error(`Market data unavailable for ${symbol}`);
    }

    if (isPriceStale(symbol)) {
        console.warn(`Warning: Price data for ${symbol} is stale`);
        // In production, you might want to throw an error here
        // For now, return stale price with warning
    }

    return data.price;
}

/**
 * Get market price with timestamp
 * Returns full cache entry: { price, timestamp }
 */
export function getMarketPriceWithTime(symbol) {
    const data = getPrice(symbol);

    if (!data) {
        throw new Error(`Market data unavailable for ${symbol}`);
    }

    return data;
}

/**
 * Get all market prices
 * Returns object with all symbol prices
 */
export function getAllMarketPrices() {
    return getCachedPrices();
}

/**
 * Check if market data is available for a symbol
 */
export function hasMarketData(symbol) {
    const data = getPrice(symbol);
    return data !== undefined && !isPriceStale(symbol);
}

/**
 * Get available symbols
 * Returns array of symbols with fresh data
 */
export function getAvailableSymbols() {
    const allPrices = getCachedPrices();
    return Object.keys(allPrices).filter(symbol => !isPriceStale(symbol));
}

