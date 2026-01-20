import { Router } from "express";
import { requestWithdrawal, requestDeposit, getMyTransactions } from "./transaction.controller.js";
import { guard } from "../auth/auth.middleware.js";

const router = Router();

// All transaction routes require authentication
router.use(guard());

router.post("/withdraw", requestWithdrawal);
router.post("/deposit", requestDeposit);
router.get("/my-transactions", getMyTransactions);

export default router;
