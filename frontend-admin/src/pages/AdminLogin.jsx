import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../api";

export default function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(`${API}/auth/login`, {
                email,
                password,
            });

            const { token, user } = response.data;

            // Validate admin/master role
            if (user.role !== "ADMIN" && user.role !== "MASTER") {
                setError("Access denied: Admin privileges required");
                setLoading(false);
                return;
            }

            // Store token and user info
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // Call parent callback to initialize socket
            onLogin(token, user);

            // Navigate to admin dashboard
            navigate("/users");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed");
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🔐 Admin Panel</h1>
                <h2 style={styles.subtitle}>Authorized Access Only</h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                        disabled={loading}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                        disabled={loading}
                    />

                    {error && <div style={styles.error}>{error}</div>}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? "Authenticating..." : "Admin Login"}
                    </button>
                </form>

                <p style={styles.footer}>
                    ⚠️ This panel is for authorized administrators only
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a0f",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    card: {
        backgroundColor: "#1a1a2e",
        padding: "40px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 8px 32px rgba(255, 68, 68, 0.2)",
        border: "1px solid #ff4444",
    },
    title: {
        color: "#ff4444",
        marginBottom: "8px",
        textAlign: "center",
        fontSize: "28px",
    },
    subtitle: {
        color: "#888",
        marginBottom: "32px",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "normal",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    input: {
        padding: "12px 16px",
        fontSize: "16px",
        border: "1px solid #333",
        borderRadius: "6px",
        backgroundColor: "#0a0a0f",
        color: "#fff",
    },
    button: {
        padding: "12px",
        fontSize: "16px",
        backgroundColor: "#ff4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        marginTop: "8px",
    },
    error: {
        color: "#ff4444",
        fontSize: "14px",
        textAlign: "center",
        padding: "8px",
        backgroundColor: "#ff444433",
        borderRadius: "4px",
    },
    footer: {
        color: "#888",
        fontSize: "12px",
        textAlign: "center",
        marginTop: "24px",
    },
};
