// src/agent/pages/AgentLeadsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const STATUS = ["OPEN", "FOLLOW_UP", "CLOSED"];
const URGENCY = ["HOT", "WARM", "COLD"];

function isoDate(d) {
    if (!d) return "—";
    try { return new Date(d).toISOString().slice(0, 10); } catch { return "—"; }
}

export default function AgentLeadsPage() {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [urgency, setUrgency] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const res = await api.get("/agent/clients");
            setRows(res.data || []);
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return rows.filter((r) => {
            if (status && r.status !== status) return false;
            if (urgency && r.urgency !== urgency) return false;
            if (!qq) return true;
            return (
                String(r.name || "").toLowerCase().includes(qq) ||
                String(r.phone || "").toLowerCase().includes(qq) ||
                String(r.email || "").toLowerCase().includes(qq) ||
                String(r.interestedArea || "").toLowerCase().includes(qq)
            );
        });
    }, [rows, q, status, urgency]);

    async function saveRow(id, patch) {
        // requires backend: PATCH /api/agent/clients/:id
        const prev = rows;
        setRows((x) => x.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        try {
            await api.patch(`/agent/clients/${id}`, patch);
        } catch (e) {
            setRows(prev);
            alert(e?.response?.data?.error || e.message || "Save failed");
        }
    }

    return (
        <div className="agt-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ fontWeight: 800 }}>My Leads</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                        className="agt-input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name / phone / email / area..."
                    />
                    <select className="agt-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">All status</option>
                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="agt-select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                        <option value="">All urgency</option>
                        {URGENCY.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button className="agt-miniBtn" onClick={load} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </button>
                </div>
            </div>

            {err && <div style={{ marginBottom: 10, color: "#b91c1c" }}>{err}</div>}

            <div className="agt-tableWrap">
                <table className="agt-table">
                    <thead>
                        <tr>
                            <th className="agt-th">Name</th>
                            <th className="agt-th">Contacted</th>
                            <th className="agt-th">Urgency</th>
                            <th className="agt-th">Status</th>
                            <th className="agt-th">Phone</th>
                            <th className="agt-th">Email</th>
                            <th className="agt-th">Area</th>
                            <th className="agt-th">Feedback</th>
                            <th className="agt-th">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r.id} className="agt-row">
                                <td className="agt-td" style={{ fontWeight: 700 }}>{r.name}</td>
                                <td className="agt-td">{isoDate(r.dateContacted)}</td>
                                <td className="agt-td">{r.urgency}</td>

                                <td className="agt-td">
                                    <select
                                        className="agt-select"
                                        value={r.status || "OPEN"}
                                        onChange={(e) => saveRow(r.id, { status: e.target.value })}
                                    >
                                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>

                                <td className="agt-td">{r.phone || "—"}</td>
                                <td className="agt-td">{r.email || "—"}</td>
                                <td className="agt-td">{r.interestedArea || "—"}</td>

                                <td className="agt-td">
                                    <input
                                        className="agt-input"
                                        value={r.feedback || ""}
                                        onChange={(e) => setRows((x) => x.map((k) => (k.id === r.id ? { ...k, feedback: e.target.value } : k)))}
                                        placeholder="Add feedback..."
                                        style={{ width: 260 }}
                                    />
                                </td>

                                <td className="agt-td">
                                    <button className="agt-miniBtn" onClick={() => saveRow(r.id, { feedback: r.feedback || "" })}>
                                        Save
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td className="agt-td" colSpan={9} style={{ color: "#666" }}>
                                    No leads found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
