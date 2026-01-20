import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// Trading routes will be implemented in next phase
router.get("/", authGuard(["USER"]), (req, res) => {
    res.json({ message: "Trading routes - coming soon" });
});

export default router;
