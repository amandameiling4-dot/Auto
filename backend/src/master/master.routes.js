import express from "express";
import { authGuard } from "../auth/auth.middleware.js";

const router = express.Router();

// Master routes will be implemented in next phase
router.get("/admins", authGuard(["MASTER"]), (req, res) => {
    res.json({ message: "Master routes - coming soon" });
});

export default router;
