import { getWallet, credit, debit } from "./wallet.service.js";

export async function getBalance(req, res) {
    try {
        const wallet = await getWallet(req.user.id);
        res.json({ balance: wallet?.balance || 0, locked: wallet?.locked || false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function requestDeposit(req, res) {
    try {
        const { amount } = req.body;
        // In production, this would integrate with payment gateway
        // For now, create a PENDING transaction for admin approval
        res.json({ message: "Deposit request submitted for admin approval" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function requestWithdrawal(req, res) {
    try {
        const { amount } = req.body;
        const wallet = await getWallet(req.user.id);

        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Create PENDING withdrawal transaction for admin approval
        res.json({ message: "Withdrawal request submitted for admin approval" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
