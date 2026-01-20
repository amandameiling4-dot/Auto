import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { getSocket } from "../socket";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPendingTransactions();
        setupSocketListeners();
    }, []);

    const fetchPendingTransactions = async () => {
        const token = localStorage.getItem("token");
        setLoading(true);

        try {
            const res = await axios.get(`${API}/admin/transactions/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransactions(res.data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
            alert(error.response?.data?.error || "Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        const socket = getSocket();
        if (!socket) return;

        socket.on("TX_CREATED", () => {
            fetchPendingTransactions();
        });

        socket.on("TX_STATUS_UPDATED", () => {
            fetchPendingTransactions();
        });
    };

    const handleApprove = async (txId) => {
        if (!confirm("Are you sure you want to approve this transaction?")) {
            return;
        }

        setActionLoading(txId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/tx/${txId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Transaction approved successfully");
            fetchPendingTransactions();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to approve transaction");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (txId) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;

        setActionLoading(txId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/tx/${txId}/reject`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Transaction rejected successfully");
            fetchPendingTransactions();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to reject transaction");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>📋 Transaction Approvals</h1>
                <button onClick={fetchPendingTransactions} style={styles.refreshBtn}>
                    🔄 Refresh
                </button>
            </header>

            {loading ? (
                <div style={styles.loading}>Loading pending transactions...</div>
            ) : (
                <div style={styles.grid}>
                    {transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <div key={tx.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={getTypeBadge(tx.type)}>{tx.type}</span>
                                    <span style={styles.amount}>
                                        ${parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>User:</span>
                                        <span style={styles.value}>{tx.user?.email}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>User ID:</span>
                                        <span style={styles.valueSmall}>{tx.userId.substring(0, 12)}...</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>User Status:</span>
                                        <span style={getUserStatusBadge(tx.user?.status)}>
                                            {tx.user?.status}
                                        </span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Current Balance:</span>
                                        <span style={styles.value}>
                                            ${parseFloat(tx.user?.wallet?.balance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Wallet:</span>
                                        <span style={tx.user?.wallet?.locked ? styles.lockedText : styles.activeText}>
                                            {tx.user?.wallet?.locked ? "🔒 Locked" : "✅ Active"}
                                        </span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Transaction ID:</span>
                                        <span style={styles.valueSmall}>{tx.id.substring(0, 12)}...</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Requested:</span>
                                        <span style={styles.value}>{new Date(tx.createdAt).toLocaleString()}</span>
                                    </div>

                                    {/* Validation Checks */}
                                    <div style={styles.validations}>
                                        {tx.user?.status === "FROZEN" && (
                                            <div style={styles.warning}>⚠️ User account is frozen</div>
                                        )}
                                        {tx.user?.wallet?.locked && (
                                            <div style={styles.warning}>⚠️ User wallet is locked</div>
                                        )}
                                        {tx.type === "WITHDRAWAL" && parseFloat(tx.amount) > parseFloat(tx.user?.wallet?.balance || 0) && (
                                            <div style={styles.error}>❌ Insufficient balance for withdrawal</div>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.cardActions}>
                                    <button
                                        onClick={() => handleApprove(tx.id)}
                                        disabled={
                                            actionLoading === tx.id ||
                                            tx.user?.status === "FROZEN" ||
                                            tx.user?.wallet?.locked ||
                                            (tx.type === "WITHDRAWAL" && parseFloat(tx.amount) > parseFloat(tx.user?.wallet?.balance || 0))
                                        }
                                        style={styles.approveBtn}
                                    >
                                        {actionLoading === tx.id ? "Processing..." : "✅ Approve"}
                                    </button>
                                    <button
                                        onClick={() => handleReject(tx.id)}
                                        disabled={actionLoading === tx.id}
                                        style={styles.rejectBtn}
                                    >
                                        {actionLoading === tx.id ? "Processing..." : "❌ Reject"}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.noData}>
                            <div style={styles.noDataIcon}>✓</div>
                            <div>No pending transactions</div>
                            <div style={styles.noDataSub}>All caught up!</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const getTypeBadge = (type) => {
    const colors = {
        DEPOSIT: "#00d4ff",
        WITHDRAWAL: "#ffaa00",
        CREDIT: "#00ff88",
        DEBIT: "#ff4444",
    };
    return {
        padding: "6px 12px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: colors[type] + "33",
        color: colors[type],
        fontWeight: "bold",
    };
};

const getUserStatusBadge = (status) => {
    const colors = {
        ACTIVE: "#00ff88",
        FROZEN: "#ffaa00",
        SUSPENDED: "#ff4444",
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
        maxWidth: "1400px",
        margin: "0 auto",
        backgroundColor: "#0a0a0f",
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
    refreshBtn: {
        padding: "12px 24px",
        backgroundColor: "#00d4ff",
        color: "#0a0a0f",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    loading: {
        textAlign: "center",
        padding: "60px",
        color: "#888",
        fontSize: "18px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
        gap: "24px",
    },
    card: {
        backgroundColor: "#1a1a2e",
        borderRadius: "12px",
        border: "1px solid #333",
        overflow: "hidden",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        backgroundColor: "#0a0a0f",
        borderBottom: "1px solid #333",
    },
    amount: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#00d4ff",
    },
    cardBody: {
        padding: "20px",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #333",
    },
    label: {
        color: "#888",
        fontSize: "14px",
    },
    value: {
        color: "#fff",
        fontSize: "14px",
        fontWeight: "500",
    },
    valueSmall: {
        color: "#888",
        fontSize: "12px",
        fontFamily: "monospace",
    },
    lockedText: {
        color: "#ff4444",
        fontSize: "14px",
    },
    activeText: {
        color: "#00ff88",
        fontSize: "14px",
    },
    validations: {
        marginTop: "16px",
    },
    warning: {
        padding: "8px 12px",
        backgroundColor: "#ffaa0033",
        color: "#ffaa00",
        borderRadius: "4px",
        fontSize: "14px",
        marginBottom: "8px",
    },
    error: {
        padding: "8px 12px",
        backgroundColor: "#ff444433",
        color: "#ff4444",
        borderRadius: "4px",
        fontSize: "14px",
        marginBottom: "8px",
    },
    cardActions: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        padding: "20px",
        borderTop: "1px solid #333",
    },
    approveBtn: {
        padding: "12px",
        backgroundColor: "#00ff88",
        color: "#0a0a0f",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "16px",
    },
    rejectBtn: {
        padding: "12px",
        backgroundColor: "#ff4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "16px",
    },
    noData: {
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "80px 20px",
        color: "#888",
    },
    noDataIcon: {
        fontSize: "64px",
        marginBottom: "16px",
        color: "#00ff88",
    },
    noDataSub: {
        marginTop: "8px",
        fontSize: "14px",
    },
};
