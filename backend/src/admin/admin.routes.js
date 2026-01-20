import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// Admin routes will be implemented in next phase
router.get("/users", authGuard(["ADMIN", "MASTER"]), (req, res) => {
    res.json({ message: "Admin routes - coming soon" });
});

export default router;
