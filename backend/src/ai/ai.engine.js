import { getMarketPrice } from "../market/market.service.js";

/**
 * Detect arbitrage opportunities across multiple price feeds
 * Simulated multi-feed price comparison
 */
export async function detectArbitrage(symbol) {
    // Simulate two different market feeds
    const priceA = await getMarketPrice(symbol);
    const priceB = priceA + (Math.random() - 0.5) * priceA * 0.005; // 0.5% variance

    const diff = Math.abs(priceA - priceB);
    const diffPercent = (diff / priceA) * 100;

    // If difference > 0.3%, potential arbitrage
    if (diffPercent > 0.3) {
        const buyPrice = Math.min(priceA, priceB);
        const sellPrice = Math.max(priceA, priceB);
        const expectedProfit = ((sellPrice - buyPrice) / buyPrice) * 100;

        return {
            symbol,
            buyPrice,
            sellPrice,
            difference: diff,
            differencePercent: diffPercent,
            expectedProfit,
            confidence: Math.min(diffPercent * 20, 95), // Higher diff = higher confidence
            timestamp: new Date()
        };
    }

    return null;
}

/**
 * Simulate AI arbitrage trade
 * Calculates expected profit and risk
 */
export async function simulateArbitrage(opportunity, amount) {
    const { buyPrice, sellPrice, expectedProfit } = opportunity;

    // Calculate with fees (0.1% per side)
    const FEE_RATE = 0.001;
    const buyFee = amount * FEE_RATE;
    const sellFee = amount * FEE_RATE;
    const totalFees = buyFee + sellFee;

    const grossProfit = amount * (expectedProfit / 100);
    const netProfit = grossProfit - totalFees;
    const netProfitPercent = (netProfit / amount) * 100;

    // Risk calculation
    const slippage = amount * 0.002; // 0.2% slippage risk
    const worstCaseProfit = netProfit - slippage;

    return {
        amount,
        buyPrice,
        sellPrice,
        grossProfit,
        fees: totalFees,
        netProfit,
        netProfitPercent,
        slippage,
        worstCaseProfit,
        recommendation: worstCaseProfit > 0 ? "EXECUTE" : "SKIP"
    };
}

/**
 * Scan all symbols for arbitrage opportunities
 */
export async function scanAllMarkets() {
    const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT"];
    const opportunities = [];

    for (const symbol of symbols) {
        const opp = await detectArbitrage(symbol);
        if (opp) {
            opportunities.push(opp);
        }
    }

    return opportunities;
}
