import express from "express";
import { login } from "./auth.service.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await login(email, password);
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
