import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { getSocket } from "../socket";

export default function Binary() {
    const [symbol, setSymbol] = useState("BTC/USDT");
    const [direction, setDirection] = useState("UP");
    const [stake, setStake] = useState("");
    const [expiry, setExpiry] = useState(60);
    const [balance, setBalance] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [payoutRate, setPayoutRate] = useState(0.85);
    const [activeTrades, setActiveTrades] = useState([]);
    const [loading, setLoading] = useState(false);

    const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT"];
    const expiryOptions = [
        { value: 60, label: "60 seconds" },
        { value: 300, label: "5 minutes" },
        { value: 900, label: "15 minutes" },
        { value: 3600, label: "1 hour" },
    ];

    useEffect(() => {
        fetchBalance();
        fetchActiveTrades();
        setupSocketListeners();
    }, []);

    const fetchBalance = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`${API}/wallets/balance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBalance(res.data.balance);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
        }
    };

    const fetchActiveTrades = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`${API}/binary/my-trades`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const active = res.data.filter((t) => t.status === "PENDING_RESOLUTION");
            setActiveTrades(active);
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        }
    };

    const setupSocketListeners = () => {
        const socket = getSocket();
        if (!socket) return;

        // Listen for price updates
        socket.on("PRICE_UPDATE", (data) => {
            if (data[symbol]) {
                setCurrentPrice(parseFloat(data[symbol]));
            }
        });

        // Listen for binary trade opened
        socket.on("BINARY_OPENED", () => {
            fetchActiveTrades();
            fetchBalance();
        });

        // Listen for binary trade resolved
        socket.on("BINARY_RESOLVED", (data) => {
            alert(`Binary trade resolved: ${data.result}\nPayout: $${data.payout}`);
            fetchActiveTrades();
            fetchBalance();
        });

        // Listen for balance updates
        socket.on("BALANCE_UPDATED", (data) => {
            setBalance(data.newBalance);
        });
    };

    const handleOpenTrade = async () => {
        if (!stake || parseFloat(stake) <= 0) {
            alert("Please enter valid stake amount");
            return;
        }

        if (parseFloat(stake) > balance) {
            alert("Insufficient balance");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await axios.post(
                `${API}/binary/open`,
                {
                    symbol,
                    direction,
                    amount: parseFloat(stake),
                    expiry,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert(`Binary trade opened!\nEntry Price: $${res.data.entryPrice}\nExpires in ${expiry}s`);
            setStake("");
            fetchActiveTrades();
            fetchBalance();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to open trade");
        } finally {
            setLoading(false);
        }
    };

    const getTimeRemaining = (expiryTime) => {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));

        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const calculatePotentialPayout = () => {
        if (!stake || parseFloat(stake) <= 0) return 0;
        const stakeAmount = parseFloat(stake);
        return stakeAmount + stakeAmount * payoutRate;
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>⏱️ Binary Options</h1>
                <div style={styles.balance}>Balance: ${parseFloat(balance).toFixed(2)}</div>
            </header>

            {/* Trade Form */}
            <div style={styles.card}>
                <h2>Open Binary Option</h2>

                {/* Symbol Selector */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Symbol</label>
                    <select
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        style={styles.select}
                    >
                        {symbols.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Current Price */}
                {currentPrice && (
                    <div style={styles.priceDisplay}>
                        Current Price: <span style={styles.priceValue}>${currentPrice.toFixed(2)}</span>
                    </div>
                )}

                {/* Direction Buttons */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Prediction</label>
                    <div style={styles.directionButtons}>
                        <button
                            onClick={() => setDirection("UP")}
                            style={{
                                ...styles.directionBtn,
                                ...(direction === "UP" ? styles.directionBtnActive : {}),
                                backgroundColor: direction === "UP" ? "#00ff88" : "#1a1a2e",
                            }}
                        >
                            📈 UP
                        </button>
                        <button
                            onClick={() => setDirection("DOWN")}
                            style={{
                                ...styles.directionBtn,
                                ...(direction === "DOWN" ? styles.directionBtnActive : {}),
                                backgroundColor: direction === "DOWN" ? "#ff4444" : "#1a1a2e",
                            }}
                        >
                            📉 DOWN
                        </button>
                    </div>
                </div>

                {/* Expiry Selector */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Expiry</label>
                    <select
                        value={expiry}
                        onChange={(e) => setExpiry(parseInt(e.target.value))}
                        style={styles.select}
                    >
                        {expiryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Stake Input */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Stake Amount ($)</label>
                    <input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        placeholder="Enter stake amount"
                        style={styles.input}
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* Payout Display */}
                <div style={styles.payoutInfo}>
                    <div>Payout Rate: {(payoutRate * 100).toFixed(0)}%</div>
                    <div style={styles.potentialPayout}>
                        Potential Return: ${calculatePotentialPayout().toFixed(2)}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleOpenTrade}
                    disabled={loading || !currentPrice}
                    style={styles.submitBtn}
                >
                    {loading ? "Opening..." : "🎯 Place Prediction"}
                </button>

                <p style={styles.note}>
                    ⚠️ No early exit. Trade resolves automatically at expiry.
                </p>
            </div>

            {/* Active Trades */}
            <div style={styles.card}>
                <h2>Active Binary Trades</h2>
                {activeTrades.length > 0 ? (
                    <div style={styles.tradesGrid}>
                        {activeTrades.map((trade) => (
                            <div key={trade.id} style={styles.tradeCard}>
                                <div style={styles.tradeHeader}>
                                    <span style={styles.tradeSymbol}>{trade.symbol}</span>
                                    <span style={{
                                        ...styles.tradeDirection,
                                        color: trade.direction === "UP" ? "#00ff88" : "#ff4444",
                                    }}>
                                        {trade.direction === "UP" ? "📈" : "📉"} {trade.direction}
                                    </span>
                                </div>

                                <div style={styles.tradeDetails}>
                                    <div style={styles.tradeRow}>
                                        <span>Entry Price:</span>
                                        <span>${parseFloat(trade.entryPrice).toFixed(2)}</span>
                                    </div>
                                    <div style={styles.tradeRow}>
                                        <span>Current Price:</span>
                                        <span>${currentPrice?.toFixed(2) || "..."}</span>
                                    </div>
                                    <div style={styles.tradeRow}>
                                        <span>Stake:</span>
                                        <span>${parseFloat(trade.amount).toFixed(2)}</span>
                                    </div>
                                    <div style={styles.tradeRow}>
                                        <span>Potential:</span>
                                        <span style={{ color: "#00ff88" }}>
                                            ${(parseFloat(trade.amount) * (1 + payoutRate)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div style={styles.countdown}>
                                    ⏱️ {getTimeRemaining(trade.expiry)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.noData}>No active binary trades</div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#0f0f23",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
    },
    balance: {
        fontSize: "20px",
        color: "#00d4ff",
        fontWeight: "bold",
    },
    card: {
        backgroundColor: "#1a1a2e",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "24px",
    },
    formGroup: {
        marginBottom: "20px",
    },
    label: {
        display: "block",
        color: "#888",
        marginBottom: "8px",
        fontSize: "14px",
    },
    select: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#0f0f23",
        color: "#fff",
        border: "1px solid #333",
        borderRadius: "6px",
        fontSize: "16px",
    },
    input: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#0f0f23",
        color: "#fff",
        border: "1px solid #333",
        borderRadius: "6px",
        fontSize: "16px",
    },
    priceDisplay: {
        textAlign: "center",
        padding: "16px",
        backgroundColor: "#0f0f23",
        borderRadius: "8px",
        marginBottom: "20px",
        fontSize: "18px",
    },
    priceValue: {
        color: "#00d4ff",
        fontWeight: "bold",
        fontSize: "24px",
    },
    directionButtons: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
    },
    directionBtn: {
        padding: "16px",
        fontSize: "18px",
        fontWeight: "bold",
        border: "2px solid #333",
        borderRadius: "8px",
        cursor: "pointer",
        color: "#fff",
        transition: "all 0.2s",
    },
    directionBtnActive: {
        borderColor: "#fff",
    },
    payoutInfo: {
        padding: "16px",
        backgroundColor: "#0f0f23",
        borderRadius: "8px",
        marginBottom: "20px",
    },
    potentialPayout: {
        fontSize: "20px",
        color: "#00ff88",
        fontWeight: "bold",
        marginTop: "8px",
    },
    submitBtn: {
        width: "100%",
        padding: "16px",
        fontSize: "18px",
        fontWeight: "bold",
        backgroundColor: "#00d4ff",
        color: "#0f0f23",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginBottom: "12px",
    },
    note: {
        color: "#888",
        fontSize: "14px",
        textAlign: "center",
    },
    tradesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
        marginTop: "16px",
    },
    tradeCard: {
        backgroundColor: "#0f0f23",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #333",
    },
    tradeHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
    },
    tradeSymbol: {
        fontSize: "18px",
        fontWeight: "bold",
    },
    tradeDirection: {
        fontSize: "16px",
        fontWeight: "bold",
    },
    tradeDetails: {
        marginBottom: "16px",
    },
    tradeRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #333",
    },
    countdown: {
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        color: "#ffaa00",
        padding: "12px",
        backgroundColor: "#1a1a2e",
        borderRadius: "6px",
    },
    noData: {
        color: "#888",
        textAlign: "center",
        padding: "40px",
    },
};
