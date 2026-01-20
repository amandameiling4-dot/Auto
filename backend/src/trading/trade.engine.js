import prisma from "../database/prisma.js";
import { getMarketPrice } from "../market/market.service.js";

export async function openTrade(userId, symbol, amount) {
    const price = getMarketPrice(symbol);
    await prisma.trade.create({
        data: { userId, symbol, amount, entry: price, status: "OPEN" }
    });
}

export async function closeTrade(tradeId) {
    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    const exit = getMarketPrice(trade.symbol);
    const pnl = (exit - trade.entry) * trade.amount;

    await prisma.$transaction([
        prisma.trade.update({
            where: { id: tradeId },
            data: { exit, status: "CLOSED" }
        }),
        prisma.wallet.update({
            where: { userId: trade.userId },
            data: { balance: { increment: pnl } }
        })
    ]);
}
