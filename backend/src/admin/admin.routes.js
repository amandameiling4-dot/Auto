import express from "express";
import { authGuard } from "../auth/auth.middleware.js";
import * as admin from "./admin.controller.js";

const router = express.Router();

// All admin routes require ADMIN or MASTER role
router.use(authGuard(["ADMIN", "MASTER"]));

// User management
router.get("/users", admin.listUsers);
router.put("/user/:id/freeze", admin.freezeUser);
router.put("/user/:id/unfreeze", admin.unfreezeUser);
router.put("/user/:id/lock-wallet", admin.lockWallet);
router.put("/user/:id/unlock-wallet", admin.unlockWallet);

// Transaction approvals
router.get("/transactions/pending", admin.getPendingTransactions);
router.put("/tx/:id/approve", admin.approveTransaction);
router.put("/tx/:id/reject", admin.rejectTransaction);

// Balance management
router.post("/credit", admin.creditBalance);

// Trade oversight
router.get("/trades/live", admin.getLiveTrades);
router.post("/trade/:id/force-close", admin.forceCloseTrade);

export default router;

