import WebSocket from "ws";
import { setPrice } from "./market.cache.js";
import { emitPriceUpdate } from "../sockets/socket.js";

/**
 * External Market Feed Gateway
 * Connects to external WebSocket price feeds
 * Auto-reconnects on disconnect
 */

let wsConnection = null;
let reconnectTimeout = null;
let isConnecting = false;

/**
 * Connect to external market feed
 * In production, replace with real feed URL (Binance, Coinbase, etc.)
 */
export function connectMarketFeed() {
    if (isConnecting) return;

    isConnecting = true;
    console.log("Connecting to market feed...");

    // TODO: In production, use real WebSocket feed
    // Example: wss://stream.binance.com:9443/ws/btcusdt@trade
    // For now, simulate with mock data

    // Simulate WebSocket connection
    simulateMarketFeed();

    // Uncomment for real feed:
    // const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
    // 
    // ws.on("open", () => {
    //   console.log("Market feed connected");
    //   isConnecting = false;
    //   wsConnection = ws;
    // });
    // 
    // ws.on("message", (data) => {
    //   try {
    //     const parsed = JSON.parse(data);
    //     // Binance format: { s: "BTCUSDT", p: "43120.12" }
    //     const symbol = parsed.s.replace("USDT", "/USDT");
    //     const price = parseFloat(parsed.p);
    //     
    //     // Update cache
    //     setPrice(symbol, price);
    //     
    //     // Broadcast to connected clients
    //     emitPriceUpdate(symbol, price);
    //   } catch (error) {
    //     console.error("Error parsing market data:", error);
    //   }
    // });
    // 
    // ws.on("error", (error) => {
    //   console.error("Market feed error:", error);
    //   isConnecting = false;
    // });
    // 
    // ws.on("close", () => {
    //   console.log("Market feed disconnected. Reconnecting in 3s...");
    //   wsConnection = null;
    //   isConnecting = false;
    //   
    //   // Auto-reconnect after 3 seconds
    //   clearTimeout(reconnectTimeout);
    //   reconnectTimeout = setTimeout(connectMarketFeed, 3000);
    // });
}

/**
 * Simulate market feed for development/testing
 * Generates realistic price movements
 */
function simulateMarketFeed() {
    console.log("Simulating market feed (development mode)");
    isConnecting = false;

    const symbols = [
        { name: "BTC/USDT", base: 42000, volatility: 0.001 },
        { name: "ETH/USDT", base: 2200, volatility: 0.0015 },
        { name: "BNB/USDT", base: 320, volatility: 0.002 }
    ];

    // Initialize with base prices
    symbols.forEach(({ name, base }) => {
        setPrice(name, base);
    });

    // Update prices every 2 seconds
    setInterval(() => {
        symbols.forEach(({ name, base, volatility }) => {
            const currentPrice = getPrice(name)?.price || base;

            // Random walk with mean reversion
            const change = (Math.random() - 0.5) * currentPrice * volatility;
            const meanReversion = (base - currentPrice) * 0.01;
            const newPrice = currentPrice + change + meanReversion;

            // Update cache
            setPrice(name, newPrice);

            // Broadcast to clients
            try {
                emitPriceUpdate(name, newPrice);
            } catch (error) {
                // Socket.IO not initialized yet
            }
        });
    }, 2000); // Update every 2 seconds
}

/**
 * Get current price from cache
 * Helper function for simulation
 */
function getPrice(symbol) {
    const { getPrice: getCachedPrice } = await import("./market.cache.js");
    return getCachedPrice(symbol);
}

/**
 * Disconnect from market feed
 */
export function disconnectMarketFeed() {
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }

    clearTimeout(reconnectTimeout);
    isConnecting = false;

    console.log("Market feed disconnected");
}

/**
 * Get connection status
 */
export function getConnectionStatus() {
    return {
        connected: wsConnection !== null,
        connecting: isConnecting
    };
}
