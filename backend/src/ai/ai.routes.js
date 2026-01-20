import express from "express";
import { authGuard } from "../auth/auth.middleware.js";
import {
    getAIOpportunities,
    simulateAITrade,
    updateAISettings,
    getAIStats
} from "./ai.controller.js";

const router = express.Router();

// Get AI arbitrage opportunities
router.get("/opportunities", authGuard(["USER"]), getAIOpportunities);

// Simulate AI trade
router.post("/simulate", authGuard(["USER"]), simulateAITrade);

// Update AI settings (opt-in/out)
router.put("/settings", authGuard(["USER"]), updateAISettings);

// Get AI performance stats
router.get("/stats", authGuard(["USER"]), getAIStats);

export default router;
