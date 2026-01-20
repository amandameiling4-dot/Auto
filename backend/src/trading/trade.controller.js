import { openTrade, closeTrade } from "./trade.engine.js";
import prisma from "../database/prisma.js";

export async function createTrade(req, res) {
    try {
        const { symbol, amount } = req.body;
        await openTrade(req.user.id, symbol, amount);
        res.json({ message: "Trade opened successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function closeTradeById(req, res) {
    try {
        const { id } = req.params;
        await closeTrade(id);
        res.json({ message: "Trade closed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function getMyTrades(req, res) {
    try {
        const trades = await prisma.trade.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" }
        });
        res.json(trades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
