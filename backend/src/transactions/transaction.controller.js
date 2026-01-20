import { createTransaction, getTransactionHistory } from "./transaction.service.js";

export async function requestWithdrawal(req, res) {
    try {
        const { amount } = req.body;
        const tx = await createTransaction(req.user.id, "WITHDRAWAL", amount);
        res.json({ message: "Withdrawal request submitted", transactionId: tx.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function requestDeposit(req, res) {
    try {
        const { amount } = req.body;
        const tx = await createTransaction(req.user.id, "DEPOSIT", amount);
        res.json({ message: "Deposit request submitted", transactionId: tx.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function getMyTransactions(req, res) {
    try {
        const filters = {
            type: req.query.type,
            status: req.query.status,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const transactions = await getTransactionHistory(req.user.id, filters);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
