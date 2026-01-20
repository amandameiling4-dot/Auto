import prisma from "../database/prisma.js";
import { getMarketPrice } from "../market/market.service.js";
import { getIO } from "../sockets/socket.js";

/**
 * Opens a new binary options trade
 */
export async function openBinary(userId, symbol, direction, stake, expiry) {
    await prisma.binaryTrade.create({
        data: { userId, symbol, direction, stake, expiry }
    });
}

/**
 * Resolves a binary options trade that has reached expiry
 */
export async function resolveBinary(tradeId) {
    const t = await prisma.binaryTrade.findUnique({ where: { id: tradeId } });
    const price = getMarketPrice(t.symbol);
    const win =
        (t.direction === "UP" && price > t.entry) ||
        (t.direction === "DOWN" && price < t.entry);

    await prisma.binaryTrade.update({
        where: { id: tradeId },
        data: { result: win ? "WIN" : "LOSS" }
    });

    if (win) {
        await prisma.wallet.update({
            where: { userId: t.userId },
            data: { balance: { increment: t.stake * 1.8 } }
        });
    }
}

/**
 * Resolve binary trade at expiry
 * System-driven, not user-triggered
 * Determines WIN/LOSS based on actual market price
 */
export async function resolveBinaryTrade(tradeId) {
    const trade = await prisma.binaryTrade.findUnique({
        where: { id: tradeId },
        include: { user: true }
    });

    if (!trade) {
        throw new Error("Binary trade not found");
    }

    if (trade.result) {
        throw new Error("Trade already resolved");
    }

    // Get current market price at expiry
    const exitPrice = await getMarketPrice(trade.symbol);

    // Determine win/loss based on direction
    let win = false;
    if (trade.direction === "UP" && exitPrice > trade.entry) {
        win = true;
    } else if (trade.direction === "DOWN" && exitPrice < trade.entry) {
        win = true;
    }

    // Calculate payout (85% profit on win, 0 on loss)
    const PAYOUT_RATE = 0.85;
    const payout = win ? trade.stake + (trade.stake * PAYOUT_RATE) : 0;

    // Update trade and wallet in transaction
    await prisma.$transaction([
        // Update binary trade
        prisma.binaryTrade.update({
            where: { id: tradeId },
            data: {
                result: win ? "WIN" : "LOSS",
                exit: exitPrice,
                payout,
                resolvedAt: new Date()
            }
        }),

        // Update wallet balance if win
        ...(win ? [
            prisma.wallet.update({
                where: { userId: trade.userId },
                data: {
                    balance: {
                        increment: payout
                    }
                }
            })
        ] : []),

        // Log in audit
        prisma.auditLog.create({
            data: {
                actorId: "SYSTEM",
                actorRole: "SYSTEM",
                action: "BINARY_RESOLVED",
                target: tradeId,
                metadata: {
                    userId: trade.userId,
                    symbol: trade.symbol,
                    direction: trade.direction,
                    entry: trade.entry.toString(),
                    exit: exitPrice.toString(),
                    result: win ? "WIN" : "LOSS",
                    payout: payout.toString()
                }
            }
        })
    ]);

    // Emit socket event to user
    const io = getIO();
    io.to(`user:${trade.userId}`).emit("BINARY_RESOLVED", {
        tradeId,
        result: win ? "WIN" : "LOSS",
        entryPrice: trade.entry,
        exitPrice,
        payout,
        timestamp: new Date()
    });

    // Update user balance in real-time
    if (win) {
        const updatedWallet = await prisma.wallet.findUnique({
            where: { userId: trade.userId }
        });

        io.to(`user:${trade.userId}`).emit("BALANCE_UPDATED", {
            userId: trade.userId,
            newBalance: updatedWallet.balance,
            change: payout,
            reason: "Binary trade win",
            timestamp: new Date()
        });
    }

    return {
        tradeId,
        result: win ? "WIN" : "LOSS",
        exitPrice,
        payout
    };
}

/**
 * Scan for expired binary trades and resolve them
 * Should be called by a cron job or timer service
 */
export async function resolveExpiredBinaryTrades() {
    const expiredTrades = await prisma.binaryTrade.findMany({
        where: {
            expiry: {
                lte: new Date()
            },
            result: null
        }
    });

    const results = [];
    for (const trade of expiredTrades) {
        try {
            const result = await resolveBinaryTrade(trade.id);
            results.push(result);
        } catch (error) {
            console.error(`Failed to resolve binary trade ${trade.id}:`, error);
        }
    }

    return results;
}
