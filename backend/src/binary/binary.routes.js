import express from "express";
import { authGuard } from "../auth/auth.middleware.js";
import { resolveBinaryTrade } from "./binary.engine.js";
import prisma from "../database/prisma.js";
import { getMarketPrice } from "../market/market.service.js";
import { getIO } from "../sockets/socket.js";

const router = express.Router();

// Open binary trade
router.post("/open", authGuard(["USER"]), async (req, res) => {
    try {
        const { symbol, direction, stake, expiry } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!["UP", "DOWN"].includes(direction)) {
            return res.status(400).json({ error: "Direction must be UP or DOWN" });
        }

        // Check wallet balance
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.balance < stake) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        if (wallet.locked) {
            return res.status(400).json({ error: "Wallet is locked" });
        }

        // Get current market price as entry
        const entryPrice = await getMarketPrice(symbol);

        // Calculate expiry time
        const expiryTime = new Date(Date.now() + expiry * 1000); // expiry in seconds

        // Create trade and lock funds in transaction
        const trade = await prisma.$transaction([
            prisma.binaryTrade.create({
                data: {
                    userId,
                    symbol,
                    direction,
                    stake,
                    entry: entryPrice,
                    expiry: expiryTime
                }
            }),
            prisma.wallet.update({
                where: { userId },
                data: {
                    balance: {
                        decrement: stake
                    }
                }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: "USER",
                    action: "BINARY_OPENED",
                    target: null, // Will be set after trade creation
                    metadata: {
                        symbol,
                        direction,
                        stake: stake.toString(),
                        entry: entryPrice.toString(),
                        expiry: expiryTime.toISOString()
                    }
                }
            })
        ]);

        // Emit socket event
        const io = getIO();
        io.to(`user:${userId}`).emit("BINARY_OPENED", {
            tradeId: trade[0].id,
            symbol,
            direction,
            stake,
            entryPrice,
            expiry: expiryTime
        });

        res.json(trade[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's binary trades
router.get("/my-trades", authGuard(["USER"]), async (req, res) => {
    try {
        const userId = req.user.id;
        const trades = await prisma.binaryTrade.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        res.json(trades);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Manual resolve (admin/system only)
router.post("/resolve/:id", authGuard(["ADMIN", "MASTER"]), async (req, res) => {
    try {
        const result = await resolveBinaryTrade(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;

