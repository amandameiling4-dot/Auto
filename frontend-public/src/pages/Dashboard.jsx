import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../api";
import { getSocket } from "../socket";

export default function Dashboard() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
    const [balance, setBalance] = useState(0);
    const [openTrades, setOpenTrades] = useState(0);
    const [totalPnL, setTotalPnL] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [marketPrices, setMarketPrices] = useState({});

    useEffect(() => {
        fetchDashboardData();
        setupSocketListeners();
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem("token");

        try {
            // Fetch wallet balance
            const walletRes = await axios.get(`${API}/wallets/balance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBalance(walletRes.data.balance);

            // Fetch open trades count and PnL
            const tradesRes = await axios.get(`${API}/trades/my-trades`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const openTradesData = tradesRes.data.filter((t) => t.status === "OPEN");
            setOpenTrades(openTradesData.length);

            const pnl = openTradesData.reduce((sum, t) => sum + parseFloat(t.currentPnL || 0), 0);
            setTotalPnL(pnl);

            // Fetch recent transactions (last 5)
            const txRes = await axios.get(`${API}/transactions/history?limit=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRecentTransactions(txRes.data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    const setupSocketListeners = () => {
        const socket = getSocket();
        if (!socket) return;

        // Listen for price updates
        socket.on("PRICE_UPDATE", (data) => {
            setMarketPrices(data);
        });

        // Listen for balance updates
        socket.on("BALANCE_UPDATED", (data) => {
            setBalance(data.newBalance);
        });

        // Listen for trade events
        socket.on("TRADE_OPENED", () => {
            fetchDashboardData();
        });

        socket.on("TRADE_CLOSED", () => {
            fetchDashboardData();
        });

        // Listen for transaction updates
        socket.on("TX_STATUS_UPDATED", () => {
            fetchDashboardData();
        });
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Welcome, {user.email}</h1>
                <button onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} style={styles.logoutBtn}>
                    Logout
                </button>
            </header>

            {/* Wallet Balance Card */}
            <div style={styles.card}>
                <h2>Wallet Balance</h2>
                <div style={styles.balanceAmount}>${parseFloat(balance).toFixed(2)}</div>
                <div style={styles.actions}>
                    <Link to="/wallet" style={styles.linkBtn}>Deposit</Link>
                    <Link to="/wallet" style={styles.linkBtn}>Withdraw</Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Open Trades</div>
                    <div style={styles.statValue}>{openTrades}</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total P&L</div>
                    <div style={{
                        ...styles.statValue,
                        color: totalPnL >= 0 ? "#00ff88" : "#ff4444"
                    }}>
                        ${totalPnL.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Market Prices Ticker */}
            <div style={styles.card}>
                <h3>Live Market Prices</h3>
                <div style={styles.ticker}>
                    {Object.entries(marketPrices).map(([symbol, price]) => (
                        <div key={symbol} style={styles.tickerItem}>
                            <span style={styles.symbol}>{symbol}</span>
                            <span style={styles.price}>${parseFloat(price).toFixed(2)}</span>
                        </div>
                    ))}
                    {Object.keys(marketPrices).length === 0 && (
                        <div style={styles.noData}>Waiting for market data...</div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div style={styles.card}>
                <h3>Recent Transactions</h3>
                {recentTransactions.length > 0 ? (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={styles.td}>{tx.type}</td>
                                    <td style={{
                                        ...styles.td,
                                        color: tx.type.includes("DEPOSIT") || tx.type.includes("CREDIT") ? "#00ff88" : "#ff4444"
                                    }}>
                                        ${parseFloat(tx.amount).toFixed(2)}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusBadge(tx.status)}>{tx.status}</span>
                                    </td>
                                    <td style={styles.td}>{new Date(tx.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={styles.noData}>No recent transactions</div>
                )}
                <Link to="/transactions" style={styles.viewAll}>View All →</Link>
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <Link to="/trade" style={styles.actionBtn}>
                    📈 Open Trade
                </Link>
                <Link to="/binary" style={styles.actionBtn}>
                    ⏱️ Binary Options
                </Link>
                <Link to="/ai" style={styles.actionBtn}>
                    🤖 AI Arbitrage
                </Link>
            </div>
        </div>
    );
}

const getStatusBadge = (status) => {
    const colors = {
        PENDING: "#ffaa00",
        APPROVED: "#00ff88",
        COMPLETED: "#00d4ff",
        REJECTED: "#ff4444",
    };
    return {
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        backgroundColor: colors[status] + "33",
        color: colors[status],
        fontWeight: "bold",
    };
};

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
    logoutBtn: {
        padding: "8px 16px",
        backgroundColor: "#ff4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    card: {
        backgroundColor: "#1a1a2e",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "24px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    },
    balanceAmount: {
        fontSize: "48px",
        fontWeight: "bold",
        color: "#00d4ff",
        margin: "16px 0",
    },
    actions: {
        display: "flex",
        gap: "12px",
    },
    linkBtn: {
        padding: "10px 24px",
        backgroundColor: "#00d4ff",
        color: "#0f0f23",
        textDecoration: "none",
        borderRadius: "6px",
        fontWeight: "bold",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "24px",
    },
    statCard: {
        backgroundColor: "#1a1a2e",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
    },
    statLabel: {
        color: "#888",
        fontSize: "14px",
        marginBottom: "8px",
    },
    statValue: {
        fontSize: "32px",
        fontWeight: "bold",
        color: "#00d4ff",
    },
    ticker: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        marginTop: "16px",
    },
    tickerItem: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    symbol: {
        color: "#888",
        fontSize: "14px",
    },
    price: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#00ff88",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "16px",
    },
    th: {
        textAlign: "left",
        padding: "12px",
        borderBottom: "2px solid #333",
        color: "#888",
    },
    td: {
        padding: "12px",
        borderBottom: "1px solid #333",
    },
    noData: {
        color: "#888",
        textAlign: "center",
        padding: "20px",
    },
    viewAll: {
        display: "block",
        textAlign: "right",
        color: "#00d4ff",
        marginTop: "12px",
        textDecoration: "none",
    },
    quickActions: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
    },
    actionBtn: {
        padding: "20px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "12px",
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        border: "2px solid #333",
        transition: "all 0.2s",
    },
};
