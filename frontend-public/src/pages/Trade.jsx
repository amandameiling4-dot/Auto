import { useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function Trade() {
    const [symbol, setSymbol] = useState("BTC/USDT");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleOpenTrade = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${API}/trades/open`,
                { symbol, amount: parseFloat(amount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage("✅ Trade opened successfully!");
            setAmount("");
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trade-page">
            <h2>Open Trade (LONG/SHORT)</h2>

            <form onSubmit={handleOpenTrade}>
                <div className="form-group">
                    <label>Symbol</label>
                    <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                        <option value="BTC/USDT">BTC/USDT</option>
                        <option value="ETH/USDT">ETH/USDT</option>
                        <option value="SOL/USDT">SOL/USDT</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Amount (USD)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="10"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Opening..." : "Open Trade"}
                </button>
            </form>

            {message && <div className="message">{message}</div>}
        </div>
    );
}
