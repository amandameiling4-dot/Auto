import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";

const prisma = new PrismaClient();
export const authRouter = Router();

export const guard = (role?: string) => async (req: any, res: any, next: any) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const user = jwt.verify(token, ENV.JWT_SECRET) as any;
        if (role && user.role !== role) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

// Register user (admin or normal)
authRouter.post("/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed, role }
        });
        res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Login
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: "User not found" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, ENV.JWT_SECRET);
        res.json({ token, role: user.role });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});
