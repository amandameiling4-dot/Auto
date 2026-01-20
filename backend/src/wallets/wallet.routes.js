import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// Wallet routes will be implemented in next phase
router.get("/balance", authGuard(["USER", "ADMIN", "MASTER"]), (req, res) => {
    res.json({ message: "Wallet routes - coming soon" });
});

export default router;
