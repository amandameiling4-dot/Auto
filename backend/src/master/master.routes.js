import { Router } from "express";
import { getAuditLogs, createAdmin, disableAdmin, updateSystemConfig } from "./master.controller.js";
import { authGuard } from "../auth/auth.middleware.js";

const router = Router();

// All master routes require MASTER role
router.use(authGuard(["MASTER"]));

// Audit log management
router.get("/audit/logs", getAuditLogs);

// Admin management
router.post("/admin/create", createAdmin);
router.put("/admin/:id/disable", disableAdmin);

// System configuration
router.put("/system/config", updateSystemConfig);

export default router;
