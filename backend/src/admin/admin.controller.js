import prisma from "../database/prisma.js";
import { emitBalanceUpdate, emitAdminAction, emitTradeEvent } from "../sockets/socket.js";
import { EVENTS } from "../sockets/events.js";

/**
 * Approve transaction (admin manual approval)
 */
export async function approveTx(req, res) {
    try {
        const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
        if (tx.status !== "PENDING") return res.sendStatus(400);

        await prisma.$transaction([
            prisma.transaction.update({
                where: { id: tx.id },
                data: { status: "APPROVED" }
            }),
            prisma.wallet.update({
                where: { userId: tx.userId },
                data: { balance: { decrement: tx.amount } }
            })
        ]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * List all users with wallet and trade information
 */
export async function listUsers(req, res) {
    try {
        const users = await prisma.user.findMany({
            include: {
                wallet: true,
                _count: {
                    select: {
                        trades: { where: { status: "OPEN" } },
                        transactions: { where: { status: "PENDING" } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Freeze user account
 * User can login but cannot trade or withdraw
 */
export async function freezeUser(req, res) {
    try {
        const { reason } = req.body;
        const userId = req.params.id;
        const adminId = req.user.id;

        if (!reason) {
            return res.status(400).json({ error: "Reason required" });
        }

        // Update user status and lock wallet in transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { status: "FROZEN" }
            }),
            prisma.wallet.update({
                where: { userId },
                data: { locked: true }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "USER_FROZEN",
                    target: userId,
                    metadata: { reason }
                }
            })
        ]);

        // Emit to master panel
        emitAdminAction(adminId, "USER_FROZEN", userId, { reason });

        res.json({ success: true, message: "User frozen" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Unfreeze user account
 */
export async function unfreezeUser(req, res) {
    try {
        const { reason } = req.body;
        const userId = req.params.id;
        const adminId = req.user.id;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { status: "ACTIVE" }
            }),
            prisma.wallet.update({
                where: { userId },
                data: { locked: false }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "USER_UNFROZEN",
                    target: userId,
                    metadata: { reason }
                }
            })
        ]);

        emitAdminAction(adminId, "USER_UNFROZEN", userId, { reason });

        res.json({ success: true, message: "User unfrozen" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Lock user wallet (prevents trading/withdrawals)
 */
export async function lockWallet(req, res) {
    try {
        const { reason } = req.body;
        const userId = req.params.id;
        const adminId = req.user.id;

        await prisma.$transaction([
            prisma.wallet.update({
                where: { userId },
                data: { locked: true }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "WALLET_LOCKED",
                    target: userId,
                    metadata: { reason }
                }
            })
        ]);

        emitAdminAction(adminId, "WALLET_LOCKED", userId, { reason });

        res.json({ success: true, message: "Wallet locked" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Unlock user wallet
 */
export async function unlockWallet(req, res) {
    try {
        const { reason } = req.body;
        const userId = req.params.id;
        const adminId = req.user.id;

        await prisma.$transaction([
            prisma.wallet.update({
                where: { userId },
                data: { locked: false }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "WALLET_UNLOCKED",
                    target: userId,
                    metadata: { reason }
                }
            })
        ]);

        emitAdminAction(adminId, "WALLET_UNLOCKED", userId, { reason });

        res.json({ success: true, message: "Wallet unlocked" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get pending transactions for approval
 */
export async function getPendingTransactions(req, res) {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                        wallet: {
                            select: { balance: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        res.json(transactions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Approve transaction (MANUAL - NO AUTO-APPROVAL)
 * Updates wallet balance atomically
 */
export async function approveTransaction(req, res) {
    try {
        const txId = req.params.id;
        const adminId = req.user.id;

        const tx = await prisma.transaction.findUnique({
            where: { id: txId },
            include: { user: true }
        });

        if (!tx) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        if (tx.status !== "PENDING") {
            return res.status(400).json({ error: "Transaction not pending" });
        }

        // Check if user is frozen
        if (tx.user.status === "FROZEN") {
            return res.status(400).json({ error: "User is frozen" });
        }

        // Get current wallet
        const wallet = await prisma.wallet.findUnique({
            where: { userId: tx.userId }
        });

        // For withdrawals/debits, check sufficient balance
        if (["WITHDRAWAL", "DEBIT"].includes(tx.type)) {
            if (wallet.balance < tx.amount) {
                return res.status(400).json({ error: "Insufficient balance" });
            }
        }

        // Atomic update: transaction status + wallet balance + audit log
        const updates = [
            prisma.transaction.update({
                where: { id: txId },
                data: {
                    status: "APPROVED",
                    metadata: {
                        ...tx.metadata,
                        approvedBy: adminId,
                        approvedAt: new Date().toISOString()
                    }
                }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "TX_APPROVED",
                    target: txId,
                    metadata: {
                        userId: tx.userId,
                        type: tx.type,
                        amount: tx.amount.toString()
                    }
                }
            })
        ];

        // Update wallet balance based on transaction type
        if (["DEPOSIT", "CREDIT"].includes(tx.type)) {
            updates.push(
                prisma.wallet.update({
                    where: { userId: tx.userId },
                    data: { balance: { increment: tx.amount } }
                })
            );
        } else if (["WITHDRAWAL", "DEBIT"].includes(tx.type)) {
            updates.push(
                prisma.wallet.update({
                    where: { userId: tx.userId },
                    data: { balance: { decrement: tx.amount } }
                })
            );
        }

        await prisma.$transaction(updates);

        // Get updated wallet balance
        const updatedWallet = await prisma.wallet.findUnique({
            where: { userId: tx.userId }
        });

        // Emit balance update to user
        emitBalanceUpdate(tx.userId, {
            newBalance: updatedWallet.balance,
            change: ["DEPOSIT", "CREDIT"].includes(tx.type) ? tx.amount : -tx.amount,
            reason: `Transaction approved: ${tx.type}`
        });

        // Emit admin action to master
        emitAdminAction(adminId, "TX_APPROVED", txId, {
            userId: tx.userId,
            type: tx.type,
            amount: tx.amount.toString()
        });

        res.json({
            success: true,
            message: "Transaction approved",
            newBalance: updatedWallet.balance
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Reject transaction
 * Requires reason
 */
export async function rejectTransaction(req, res) {
    try {
        const txId = req.params.id;
        const adminId = req.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Reason required" });
        }

        const tx = await prisma.transaction.findUnique({
            where: { id: txId }
        });

        if (!tx) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        if (tx.status !== "PENDING") {
            return res.status(400).json({ error: "Transaction not pending" });
        }

        await prisma.$transaction([
            prisma.transaction.update({
                where: { id: txId },
                data: {
                    status: "REJECTED",
                    metadata: {
                        ...tx.metadata,
                        rejectedBy: adminId,
                        rejectedAt: new Date().toISOString(),
                        rejectionReason: reason
                    }
                }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "TX_REJECTED",
                    target: txId,
                    metadata: {
                        userId: tx.userId,
                        type: tx.type,
                        amount: tx.amount.toString(),
                        reason
                    }
                }
            })
        ]);

        // Emit admin action to master
        emitAdminAction(adminId, "TX_REJECTED", txId, {
            userId: tx.userId,
            reason
        });

        res.json({ success: true, message: "Transaction rejected" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Manual balance credit
 * Requires reason and admin approval
 */
export async function creditBalance(req, res) {
    try {
        const { userId, amount, reason } = req.body;
        const adminId = req.user.id;

        if (!userId || !amount || !reason) {
            return res.status(400).json({
                error: "userId, amount, and reason required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: "Amount must be positive" });
        }

        // Check user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.status === "FROZEN") {
            return res.status(400).json({ error: "Cannot credit frozen user" });
        }

        // Get current wallet
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        // Atomic update
        await prisma.$transaction([
            prisma.wallet.update({
                where: { userId },
                data: { balance: { increment: amount } }
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    type: "CREDIT",
                    amount,
                    status: "COMPLETED",
                    metadata: {
                        creditedBy: adminId,
                        reason
                    }
                }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "BALANCE_CREDITED",
                    target: userId,
                    metadata: {
                        amount: amount.toString(),
                        previousBalance: wallet.balance.toString(),
                        newBalance: (parseFloat(wallet.balance) + parseFloat(amount)).toString(),
                        reason
                    }
                }
            })
        ]);

        // Get updated balance
        const updatedWallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        // Emit balance update to user
        emitBalanceUpdate(userId, {
            newBalance: updatedWallet.balance,
            change: amount,
            reason: `Admin credit: ${reason}`
        });

        // Emit admin action to master
        emitAdminAction(adminId, "BALANCE_CREDITED", userId, {
            amount: amount.toString(),
            reason
        });

        res.json({
            success: true,
            message: "Balance credited",
            newBalance: updatedWallet.balance
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get all open trades across all users
 */
export async function getLiveTrades(req, res) {
    try {
        const trades = await prisma.trade.findMany({
            where: { status: "OPEN" },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(trades);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Force close trade
 * Requires reason
 */
export async function forceCloseTrade(req, res) {
    try {
        const tradeId = req.params.id;
        const adminId = req.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Reason required" });
        }

        const trade = await prisma.trade.findUnique({
            where: { id: tradeId }
        });

        if (!trade) {
            return res.status(404).json({ error: "Trade not found" });
        }

        if (trade.status !== "OPEN") {
            return res.status(400).json({ error: "Trade not open" });
        }

        // Get current market price
        const { getMarketPrice } = await import("../market/market.service.js");
        const exitPrice = getMarketPrice(trade.symbol);

        // Calculate PnL
        let pnl;
        if (trade.type === "LONG") {
            pnl = (exitPrice - parseFloat(trade.entry)) * parseFloat(trade.amount);
        } else {
            pnl = (parseFloat(trade.entry) - exitPrice) * parseFloat(trade.amount);
        }

        // Update trade and wallet
        await prisma.$transaction([
            prisma.trade.update({
                where: { id: tradeId },
                data: {
                    status: "FORCE_CLOSED",
                    exit: exitPrice,
                    pnl,
                    closedAt: new Date()
                }
            }),
            prisma.wallet.update({
                where: { userId: trade.userId },
                data: {
                    balance: { increment: pnl }
                }
            }),
            prisma.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: req.user.role,
                    action: "TRADE_FORCE_CLOSED",
                    target: tradeId,
                    metadata: {
                        userId: trade.userId,
                        symbol: trade.symbol,
                        pnl: pnl.toString(),
                        reason
                    }
                }
            })
        ]);

        // Emit events
        emitTradeEvent(EVENTS.TRADE_FORCE_CLOSED, trade.userId, {
            tradeId,
            exitPrice,
            pnl,
            reason
        });

        emitAdminAction(adminId, "TRADE_FORCE_CLOSED", tradeId, {
            userId: trade.userId,
            reason
        });

        res.json({
            success: true,
            message: "Trade force closed",
            pnl
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
