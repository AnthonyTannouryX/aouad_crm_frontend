// src/agent/pages/AgentDashboardPage.jsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AgentDashboardPage() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;
        setErr("");
        api
            .get("/agent/dashboard")
            .then((res) => alive && setData(res.data))
            .catch((e) => alive && setErr(e?.response?.data?.error || e.message || "Failed"))
        return () => { alive = false; };
    }, []);

    if (err) return <div className="agt-card">Error: {err}</div>;
    if (!data) return <div className="agt-card">Loading…</div>;

    return (
        <div className="agt-grid">
            <div className="agt-span12">
                <div className="agt-kpis">
                    <div className="agt-kpi">
                        <div className="agt-kpiLabel">My Listings</div>
                        <div className="agt-kpiValue">{data.listings ?? 0}</div>
                    </div>
                    <div className="agt-kpi">
                        <div className="agt-kpiLabel">My Leads</div>
                        <div className="agt-kpiValue">{data.clients ?? 0}</div>
                    </div>
                    <div className="agt-kpi">
                        <div className="agt-kpiLabel">Upcoming Meetings</div>
                        <div className="agt-kpiValue">{data.upcomingAppointments ?? "—"}</div>
                    </div>
                    <div className="agt-kpi">
                        <div className="agt-kpiLabel">This Week</div>
                        <div className="agt-kpiValue">{data.weekAppointments ?? "—"}</div>
                    </div>
                </div>
            </div>

            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Quick Actions</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <a className="agt-miniBtn" href="/agent/leads">Open Leads</a>
                        <a className="agt-miniBtn" href="/agent/listings">My Listings</a>
                        <a className="agt-miniBtn" href="/agent/schedule">Schedule</a>
                        <a className="agt-miniBtn" href="/agent/settings">Settings</a>
                    </div>
                </div>
            </div>

            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Notes</div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                        This dashboard is agent-scoped. You only see your assigned leads, listings, and meetings.
                    </div>
                </div>
            </div>
        </div>
    );
}
