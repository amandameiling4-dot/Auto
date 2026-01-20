import prisma from "../database/prisma.js";

// Market price cache (in-memory)
const priceCache = new Map();

/**
 * Get current market price for a symbol
 * In production, this would connect to external market feeds (Binance, etc.)
 */
export async function getMarketPrice(symbol) {
    // Check cache first (60 second TTL)
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.price;
    }

    // TODO: In production, fetch from real market feeds
    // For now, simulate with random prices
    const basePrice = {
        "BTC/USDT": 42000,
        "ETH/USDT": 2200,
        "BNB/USDT": 320
    }[symbol] || 1000;

    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;

    // Cache the price
    priceCache.set(symbol, {
        price,
        timestamp: Date.now()
    });

    return price;
}

/**
 * Update market price in cache
 * Called by WebSocket feed handlers
 */
export function updateMarketPrice(symbol, price) {
    priceCache.set(symbol, {
        price,
        timestamp: Date.now()
    });
}

/**
 * Get all cached prices
 */
export function getAllPrices() {
    const prices = {};
    for (const [symbol, data] of priceCache.entries()) {
        prices[symbol] = data.price;
    }
    return prices;
}
