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

    useEffect(() => {
        fetchData();
        const socket = io(API);
        socket.on("update", setData);
        return () => socket.disconnect();
    }, [token]);

    if (!token) {
        return (
            <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
                <h2>Public App Login</h2>
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
            <h2>Public App Data</h2>
            <button onClick={() => { localStorage.removeItem("token"); setToken(""); }} style={{ marginBottom: "20px", padding: "8px 16px" }}>
                Logout
            </button>
            <pre style={{ background: "#f4f4f4", padding: "15px", borderRadius: "5px" }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}
