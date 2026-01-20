import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { getSocket } from "../socket";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchUsers();
        setupSocketListeners();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        setLoading(true);

        try {
            const res = await axios.get(`${API}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data.users || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            alert(error.response?.data?.error || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        const socket = getSocket();
        if (!socket) return;

        socket.on("USER_FROZEN", () => {
            fetchUsers();
        });

        socket.on("USER_UNFROZEN", () => {
            fetchUsers();
        });

        socket.on("ADMIN_ACTION", (data) => {
            if (data.action.includes("USER") || data.action.includes("WALLET")) {
                fetchUsers();
            }
        });
    };

    const handleFreezeUser = async (userId) => {
        const reason = prompt("Enter reason for freezing this user:");
        if (!reason) return;

        setActionLoading(userId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/user/${userId}/freeze`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("User frozen successfully");
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to freeze user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfreezeUser = async (userId) => {
        setActionLoading(userId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/user/${userId}/unfreeze`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("User unfrozen successfully");
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to unfreeze user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLockWallet = async (userId) => {
        const reason = prompt("Enter reason for locking wallet:");
        if (!reason) return;

        setActionLoading(userId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/user/${userId}/lock-wallet`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Wallet locked successfully");
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to lock wallet");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnlockWallet = async (userId) => {
        setActionLoading(userId);
        const token = localStorage.getItem("token");

        try {
            await axios.put(
                `${API}/admin/user/${userId}/unlock-wallet`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Wallet unlocked successfully");
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to unlock wallet");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreditBalance = async (userId) => {
        const amount = prompt("Enter amount to credit:");
        if (!amount || parseFloat(amount) <= 0) return;

        const reason = prompt("Enter reason for crediting:");
        if (!reason) return;

        setActionLoading(userId);
        const token = localStorage.getItem("token");

        try {
            await axios.post(
                `${API}/admin/credit`,
                {
                    userId,
                    amount: parseFloat(amount),
                    reason,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Credited $${amount} successfully`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to credit balance");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>👥 User Management</h1>
                <button onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} style={styles.logoutBtn}>
                    Logout
                </button>
            </header>

            {/* Search Bar */}
            <div style={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search by email or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.searchInput}
                />
                <button onClick={fetchUsers} style={styles.refreshBtn}>
                    🔄 Refresh
                </button>
            </div>

            {/* Users Table */}
            {loading ? (
                <div style={styles.loading}>Loading users...</div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Balance</th>
                                <th style={styles.th}>Wallet</th>
                                <th style={styles.th}>Open Trades</th>
                                <th style={styles.th}>Last Login</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div>{user.email}</div>
                                        <div style={styles.userId}>{user.id.substring(0, 8)}...</div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusBadge(user.status)}>{user.status}</span>
                                    </td>
                                    <td style={styles.td}>
                                        ${parseFloat(user.wallet?.balance || 0).toFixed(2)}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={user.wallet?.locked ? styles.lockedBadge : styles.activeBadge}>
                                            {user.wallet?.locked ? "🔒 Locked" : "✅ Active"}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{user._count?.trades || 0}</td>
                                    <td style={styles.td}>
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            {user.status === "ACTIVE" ? (
                                                <button
                                                    onClick={() => handleFreezeUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    style={styles.freezeBtn}
                                                >
                                                    ❄️ Freeze
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnfreezeUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    style={styles.unfreezeBtn}
                                                >
                                                    ✅ Unfreeze
                                                </button>
                                            )}

                                            {user.wallet?.locked ? (
                                                <button
                                                    onClick={() => handleUnlockWallet(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    style={styles.unlockBtn}
                                                >
                                                    🔓 Unlock
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleLockWallet(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    style={styles.lockBtn}
                                                >
                                                    🔒 Lock
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleCreditBalance(user.id)}
                                                disabled={actionLoading === user.id}
                                                style={styles.creditBtn}
                                            >
                                                💰 Credit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div style={styles.noData}>No users found</div>
                    )}
                </div>
            )}
        </div>
    );
}

const getStatusBadge = (status) => {
    const colors = {
        ACTIVE: "#00ff88",
        FROZEN: "#ffaa00",
        SUSPENDED: "#ff4444",
    };
    return {
        padding: "4px 12px",
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
    logoutBtn: {
        padding: "8px 16px",
        backgroundColor: "#ff4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    searchBar: {
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
    },
    searchInput: {
        flex: 1,
        padding: "12px 16px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        border: "1px solid #333",
        borderRadius: "6px",
        fontSize: "16px",
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
    tableContainer: {
        backgroundColor: "#1a1a2e",
        borderRadius: "12px",
        overflow: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        textAlign: "left",
        padding: "16px",
        borderBottom: "2px solid #333",
        color: "#888",
        fontWeight: "600",
    },
    tr: {
        borderBottom: "1px solid #333",
    },
    td: {
        padding: "16px",
    },
    userId: {
        fontSize: "12px",
        color: "#666",
        marginTop: "4px",
    },
    actions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    freezeBtn: {
        padding: "6px 12px",
        backgroundColor: "#ffaa0033",
        color: "#ffaa00",
        border: "1px solid #ffaa00",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    unfreezeBtn: {
        padding: "6px 12px",
        backgroundColor: "#00ff8833",
        color: "#00ff88",
        border: "1px solid #00ff88",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    lockBtn: {
        padding: "6px 12px",
        backgroundColor: "#ff444433",
        color: "#ff4444",
        border: "1px solid #ff4444",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    unlockBtn: {
        padding: "6px 12px",
        backgroundColor: "#00d4ff33",
        color: "#00d4ff",
        border: "1px solid #00d4ff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    creditBtn: {
        padding: "6px 12px",
        backgroundColor: "#00ff8833",
        color: "#00ff88",
        border: "1px solid #00ff88",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    lockedBadge: {
        color: "#ff4444",
        fontSize: "14px",
    },
    activeBadge: {
        color: "#00ff88",
        fontSize: "14px",
    },
    loading: {
        textAlign: "center",
        padding: "40px",
        color: "#888",
    },
    noData: {
        textAlign: "center",
        padding: "40px",
        color: "#888",
    },
};
