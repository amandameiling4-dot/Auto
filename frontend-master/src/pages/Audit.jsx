import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";
import { socket } from "../socket";

export default function Audit() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        actorRole: "",
        action: "",
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        fetchAuditLogs();

        // Listen for new admin actions in real-time
        socket.on("ADMIN_ACTION", (data) => {
            setLogs(prev => [data, ...prev]);
        });

        return () => {
            socket.off("ADMIN_ACTION");
        };
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams();
            if (filters.actorRole) params.append("actorRole", filters.actorRole);
            if (filters.action) params.append("action", filters.action);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            const response = await axios.get(
                `${API}/master/audit/logs?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        setLoading(true);
        fetchAuditLogs();
    };

    if (loading) return <div>Loading audit logs...</div>;

    return (
        <div className="audit-page">
            <h2>Audit Logs</h2>

            <form className="filters" onSubmit={handleApplyFilters}>
                <select name="actorRole" value={filters.actorRole} onChange={handleFilterChange}>
                    <option value="">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MASTER">MASTER</option>
                    <option value="SYSTEM">SYSTEM</option>
                </select>

                <input
                    type="text"
                    name="action"
                    placeholder="Action (e.g., FREEZE_USER)"
                    value={filters.action}
                    onChange={handleFilterChange}
                />

                <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                />

                <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                />

                <button type="submit">Apply Filters</button>
            </form>

            <div className="audit-logs">
                {logs.length === 0 ? (
                    <p>No audit logs found</p>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="log-item">
                            <span className="log-time">
                                {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className={`log-actor ${log.actorRole.toLowerCase()}`}>
                                {log.actorRole}
                            </span>
                            <span className="log-action">{log.action}</span>
                            {log.target && <span className="log-target">Target: {log.target}</span>}
                            {log.metadata && (
                                <details className="log-metadata">
                                    <summary>Metadata</summary>
                                    <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
