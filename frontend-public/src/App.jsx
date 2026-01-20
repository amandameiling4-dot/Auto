import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { initSocket, disconnectSocket } from "./socket";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Binary from "./pages/Binary";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);

                // Initialize socket connection
                initSocket(token);
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
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login onLogin={handleLogin} />
                        )
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        isAuthenticated ? (
                            <Dashboard user={user} onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route
                    path="/binary"
                    element={
                        isAuthenticated ? (
                            <Binary />
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
                            <Navigate to="/dashboard" replace />
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
