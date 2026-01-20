import { Router } from "express";
import { guard } from "./auth";
import { io } from "./socket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dataRouter = Router();

// GET all items
dataRouter.get("/", guard(), async (req, res) => {
    try {
        const items = await prisma.item.findMany();
        res.json(items);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST new item (admin)
dataRouter.post("/", guard("admin"), async (req, res) => {
    try {
        const newItem = await prisma.item.create({ data: req.body });
        const items = await prisma.item.findMany();
        io.emit("update", items);
        res.json(newItem);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update item (admin)
dataRouter.put("/:id", guard("admin"), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const updated = await prisma.item.update({ where: { id }, data: req.body });
        const items = await prisma.item.findMany();
        io.emit("update", items);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE item (admin)
dataRouter.delete("/:id", guard("admin"), async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.item.delete({ where: { id } });
        const items = await prisma.item.findMany();
        io.emit("update", items);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});
