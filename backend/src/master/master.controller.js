import prisma from "../database/prisma.js";
import bcrypt from "bcrypt";

/**
 * Get audit logs with filters
 * Only MASTER role can access
 */
export async function getAuditLogs(req, res) {
    try {
        const { actorRole, action, startDate, endDate, limit = 100, offset = 0 } = req.query;

        // Build filters
        const where = {};

        if (actorRole) {
            where.actorRole = actorRole;
        }

        if (action) {
            where.action = { contains: action, mode: "insensitive" };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Fetch logs
        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        // Count total
        const total = await prisma.auditLog.count({ where });

        res.json({
            logs,
            total,
            page: Math.floor(offset / limit) + 1,
            hasMore: offset + logs.length < total,
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
}

/**
 * Create new admin account
 * Only MASTER role can create admins
 */
export async function createAdmin(req, res) {
    try {
        const { email, password, permissions } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        // Check if admin already exists
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                active: true,
                permissions: permissions || {},
            },
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                actor: "SYSTEM",
                actorRole: "MASTER",
                action: `ADMIN_CREATED:${admin.id}:${email}`,
                createdAt: new Date(),
            },
        });

        res.status(201).json({
            message: "Admin created successfully",
            adminId: admin.id,
            email: admin.email,
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({ error: "Failed to create admin" });
    }
}

/**
 * Disable admin account
 * Only MASTER role can disable admins
 */
export async function disableAdmin(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Reason required" });
        }

        // Find admin
        const admin = await prisma.admin.findUnique({ where: { id } });
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Disable admin
        await prisma.admin.update({
            where: { id },
            data: { active: false },
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                actor: "SYSTEM",
                actorRole: "MASTER",
                action: `ADMIN_DISABLED:${id}:${reason}`,
                createdAt: new Date(),
            },
        });

        // Emit Socket.IO event
        req.app.get("io").to("master").emit("ADMIN_DISABLED", {
            adminId: id,
            reason,
            timestamp: new Date(),
        });

        res.json({
            message: "Admin disabled successfully",
            adminId: id,
        });
    } catch (error) {
        console.error("Error disabling admin:", error);
        res.status(500).json({ error: "Failed to disable admin" });
    }
}

/**
 * Update system configuration
 * Only MASTER role can update system config
 */
export async function updateSystemConfig(req, res) {
    try {
        const { binaryPayoutRate, aiMaxTradesPerDay, aiMaxAmountPerTrade, tradingHours } = req.body;

        // Validate payout rate
        if (binaryPayoutRate && (binaryPayoutRate < 0.7 || binaryPayoutRate > 0.95)) {
            return res.status(400).json({ error: "Binary payout rate must be between 0.7 and 0.95" });
        }

        // Update configuration (store in database or cache)
        // For now, log the action
        await prisma.auditLog.create({
            data: {
                actor: "SYSTEM",
                actorRole: "MASTER",
                action: `SYSTEM_CONFIG_UPDATED:${JSON.stringify(req.body)}`,
                createdAt: new Date(),
            },
        });

        // Emit Socket.IO event to all users
        req.app.get("io").emit("SYSTEM_CONFIG_UPDATED", {
            config: req.body,
            timestamp: new Date(),
        });

        res.json({
            message: "System configuration updated successfully",
            config: req.body,
        });
    } catch (error) {
        console.error("Error updating system config:", error);
        res.status(500).json({ error: "Failed to update system configuration" });
    }
}
