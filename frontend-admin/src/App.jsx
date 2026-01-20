import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API } from "./api";

export default function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [data, setData] = useState([]);

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

    const deleteItem = async (id) => {
        if (!confirm("Delete this item?")) return;
        await fetch(`${API}/data/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token },
        });
    };

    useEffect(() => {
        fetchData();
        const socket = io(API);
        socket.on("update", setData);
        return () => socket.disconnect();
    }, [token]);

    if (!token) {
        return (
            <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
                <h2>Admin Login</h2>
                <div style={{ marginBottom: "10px" }}>
                    <input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ padding: "8px", marginRight: "10px" }}
                    />
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: "8px", marginRight: "10px" }}
                    />
                </div>
                <button onClick={login} style={{ padding: "8px 16px" }}>Login</button>
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h2>Admin Panel</h2>
            <div style={{ marginBottom: "20px" }}>
                <button onClick={() => { localStorage.removeItem("token"); setToken(""); }} style={{ marginRight: "10px", padding: "8px 16px" }}>
                    Logout
                </button>
                <button onClick={addItem} style={{ padding: "8px 16px" }}>Add Item</button>
            </div>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {data.map((item) => (
                    <li key={item.id} style={{
                        background: "#f4f4f4",
                        padding: "15px",
                        marginBottom: "10px",
                        borderRadius: "5px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div>
                            <strong>{item.message}</strong>
                            <br />
                            <small style={{ color: "#666" }}>ID: {item.id} | Created: {new Date(item.createdAt).toLocaleString()}</small>
                        </div>
                        <div>
                            <button onClick={() => editItem(item.id, item.message)} style={{ marginRight: "5px", padding: "5px 10px" }}>Edit</button>
                            <button onClick={() => deleteItem(item.id)} style={{ padding: "5px 10px", background: "#ff4444", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {data.length === 0 && <p style={{ color: "#666" }}>No items yet. Click "Add Item" to create one.</p>}
        </div>
    );
}
