import prisma from "../database/prisma.js";
import { detectArbitrage, simulateArbitrage, scanAllMarkets } from "./ai.engine.js";

/**
 * Check AI arbitrage opportunities
 * Requires user opt-in
 */
export async function getAIOpportunities(req, res) {
    try {
        const userId = req.user.id;

        // Check if user has opted in to AI trading
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { optInAI: true }
        });

        if (!user?.optInAI) {
            return res.status(403).json({
                error: "AI trading not enabled. Please opt-in first."
            });
        }

        // Scan for opportunities
        const opportunities = await scanAllMarkets();

        res.json({
            opportunities,
            count: opportunities.length,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Simulate AI trade
 * Shows expected profit before execution
 */
export async function simulateAITrade(req, res) {
    try {
        const { symbol, amount } = req.body;
        const userId = req.user.id;

        // Check opt-in
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { optInAI: true }
        });

        if (!user?.optInAI) {
            return res.status(403).json({
                error: "AI trading not enabled"
            });
        }

        // Detect opportunity
        const opportunity = await detectArbitrage(symbol);
        if (!opportunity) {
            return res.status(404).json({
                error: "No arbitrage opportunity found"
            });
        }

        // Simulate the trade
        const simulation = await simulateArbitrage(opportunity, parseFloat(amount));

        res.json({
            opportunity,
            simulation,
            note: "This is a simulation. Actual execution requires admin/system approval."
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Update AI settings (opt-in/opt-out)
 */
export async function updateAISettings(req, res) {
    try {
        const { optInAI, riskLevel, maxStake, dailyLimit } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                optInAI: optInAI !== undefined ? optInAI : undefined,
                aiRiskLevel: riskLevel,
                aiMaxStake: maxStake,
                aiDailyLimit: dailyLimit
            }
        });

        // Log the change
        await prisma.auditLog.create({
            data: {
                actorId: userId,
                actorRole: "USER",
                action: "AI_SETTINGS_UPDATED",
                target: userId,
                metadata: {
                    optInAI,
                    riskLevel,
                    maxStake,
                    dailyLimit
                }
            }
        });

        res.json({
            message: "AI settings updated",
            optInAI: user.optInAI
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get AI performance stats
 */
export async function getAIStats(req, res) {
    try {
        const userId = req.user.id;

        // Get AI trade history from audit logs
        const aiTrades = await prisma.auditLog.findMany({
            where: {
                actorId: userId,
                action: "AI_TRADE_EXECUTED"
            },
            orderBy: { createdAt: "desc" }
        });

        const totalTrades = aiTrades.length;
        const wins = aiTrades.filter(t => t.metadata?.profit > 0).length;
        const losses = totalTrades - wins;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

        const totalProfit = aiTrades.reduce((sum, t) => {
            return sum + (parseFloat(t.metadata?.profit) || 0);
        }, 0);

        res.json({
            totalTrades,
            wins,
            losses,
            winRate: winRate.toFixed(2),
            totalProfit: totalProfit.toFixed(2),
            recentTrades: aiTrades.slice(0, 10)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
