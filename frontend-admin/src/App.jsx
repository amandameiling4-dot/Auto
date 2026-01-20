import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { initSocket, disconnectSocket } from "./socket";
import AdminLogin from "./pages/AdminLogin";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if admin is already logged in
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                // Validate admin or master role
                if (parsedUser.role === "ADMIN" || parsedUser.role === "MASTER") {
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                    initSocket(token);
                } else {
                    localStorage.clear();
                }
            } catch (error) {
                console.error("Failed to parse stored user:", error);
                localStorage.clear();
            }
        }

        return () => {
            disconnectSocket();
        };
    }, []);

    const handleLogin = (token, userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        initSocket(token);
    };

    const handleLogout = () => {
        localStorage.clear();
        disconnectSocket();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <Router>
            {isAuthenticated && (
                <nav style={styles.nav}>
                    <div style={styles.navBrand}>
                        🔐 Admin Panel
                        {user?.role === "MASTER" && <span style={styles.masterBadge}>MASTER</span>}
                    </div>
                    <div style={styles.navLinks}>
                        <Link to="/users" style={styles.navLink}>👥 Users</Link>
                        <Link to="/transactions" style={styles.navLink}>📋 Transactions</Link>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                    </div>
                </nav>
            )}

            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/users" replace />
                        ) : (
                            <AdminLogin onLogin={handleLogin} />
                        )
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/users"
                    element={
                        isAuthenticated ? (
                            <Users user={user} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route
                    path="/transactions"
                    element={
                        isAuthenticated ? (
                            <Transactions user={user} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Default Route */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/users" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

const styles = {
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: "#1a1a2e",
        borderBottom: "2px solid #ff4444",
    },
    navBrand: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#ff4444",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    masterBadge: {
        padding: "4px 8px",
        fontSize: "12px",
        backgroundColor: "#ffaa00",
        color: "#0a0a0f",
        borderRadius: "4px",
        fontWeight: "bold",
    },
    navLinks: {
        display: "flex",
        gap: "16px",
        alignItems: "center",
    },
    navLink: {
        color: "#fff",
        textDecoration: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        transition: "background-color 0.2s",
    },
    logoutBtn: {
        padding: "8px 16px",
        backgroundColor: "#ff4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },
};


const login = async () => {
    const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (json.token) {
        localStorage.setItem("token", json.token);
        setToken(json.token);
    } else {
        alert(json.error || "Login failed");
    }
};

const fetchData = async () => {
    if (!token) return;
    const res = await fetch(API + "/data", {
        headers: { Authorization: "Bearer " + token },
    });
    const json = await res.json();
    setData(json);
};

const addItem = async () => {
    const message = prompt("Enter message:");
    if (!message) return;
    await fetch(API + "/data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ message }),
    });
};

const editItem = async (id, currentMessage) => {
    const message = prompt("Edit message:", currentMessage);
    if (!message) return;
    await fetch(`${API}/data/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ message }),
    });
};
