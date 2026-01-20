import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// User routes will be implemented in next phase
router.get("/", authGuard(["ADMIN", "MASTER"]), (req, res) => {
    res.json({ message: "User routes - coming soon" });
});

export default router;
