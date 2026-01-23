import { Router } from "express";
import { guard } from "./auth";
import { io } from "./socket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dataRouter = Router();

// GET all items (placeholder - replace with actual data)
dataRouter.get("/", guard(), async (req, res) => {
    try {
        // Replace 'item' with actual model like 'user', 'trade', etc.
        const items: any[] = [];
        res.json(items);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST new item (admin)
dataRouter.post("/", guard("admin"), async (req, res) => {
    try {
        // Replace with actual model
        const newItem = req.body;
        const items: any[] = [];
        io.emit("update", items);
        res.json(newItem);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update item (admin)
dataRouter.put("/:id", guard("admin"), async (req, res) => {
    try {
        const id = req.params.id;
        // Replace with actual model
        const updated = req.body;
        const items: any[] = [];
        io.emit("update", items);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE item (admin)
dataRouter.delete("/:id", guard("admin"), async (req, res) => {
    try {
        const id = req.params.id;
        // Replace with actual model
        const items: any[] = [];
        io.emit("update", items);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});
