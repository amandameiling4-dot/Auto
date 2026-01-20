import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// Binary options routes will be implemented in next phase
router.get("/", authGuard(["USER"]), (req, res) => {
    res.json({ message: "Binary options routes - coming soon" });
});

export default router;
