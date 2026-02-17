// src/agent/pages/AgentSchedulePage.jsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const DAYS = [
    { i: 0, label: "Sunday" },
    { i: 1, label: "Monday" },
    { i: 2, label: "Tuesday" },
    { i: 3, label: "Wednesday" },
    { i: 4, label: "Thursday" },
    { i: 5, label: "Friday" },
    { i: 6, label: "Saturday" },
];

function toHHMM(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    return s.slice(0, 5);
}

export default function AgentSchedulePage() {
    const [schedule, setSchedule] = useState(() =>
        DAYS.map((d) => ({ dayOfWeek: d.i, startHHMM: "09:00", endHHMM: "18:00", slotMin: 30, enabled: false }))
    );
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // quick create meeting
    const [newMeet, setNewMeet] = useState({
        startAt: "",
        durationMin: 30,
        customerName: "",
        customerPhone: "",
        note: "",
    });

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const [sch, ap] = await Promise.all([
                api.get("/agent/schedule"),
                api.get("/agent/appointments"),
            ]);

            // schedule response expected: array of { dayOfWeek, startHHMM, endHHMM, slotMin }
            const schRows = sch.data || [];
            const merged = DAYS.map((d) => {
                const found = schRows.find((x) => x.dayOfWeek === d.i);
                return found
                    ? { ...found, enabled: true }
                    : { dayOfWeek: d.i, startHHMM: "09:00", endHHMM: "18:00", slotMin: 30, enabled: false };
            });

            setSchedule(merged);
            setAppointments(ap.data || []);
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function saveSchedule() {
        try {
            const payload = schedule
                .filter((d) => d.enabled)
                .map((d) => ({
                    dayOfWeek: d.dayOfWeek,
                    startHHMM: toHHMM(d.startHHMM),
                    endHHMM: toHHMM(d.endHHMM),
                    slotMin: Number(d.slotMin) || 30,
                }));

            await api.put("/agent/schedule", payload);
            alert("Saved!");
            load();
        } catch (e) {
            alert(e?.response?.data?.error || e.message || "Save failed");
        }
    }

    async function createMeeting(e) {
        e.preventDefault();
        try {
            await api.post("/agent/appointments", {
                ...newMeet,
                durationMin: Number(newMeet.durationMin) || 30,
            });
            setNewMeet({ startAt: "", durationMin: 30, customerName: "", customerPhone: "", note: "" });
            load();
        } catch (e2) {
            alert(e2?.response?.data?.error || e2.message || "Create failed");
        }
    }

    return (
        <div className="agt-grid">
            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Weekly Availability</div>
                    {err && <div style={{ marginBottom: 10, color: "#b91c1c" }}>{err}</div>}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {DAYS.map((d) => {
                            const row = schedule.find((x) => x.dayOfWeek === d.i);
                            return (
                                <div key={d.i} style={{ display: "grid", gridTemplateColumns: "120px 90px 90px 90px 1fr", gap: 10, alignItems: "center" }}>
                                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700 }}>
                                        <input
                                            type="checkbox"
                                            checked={!!row?.enabled}
                                            onChange={(e) =>
                                                setSchedule((s) => s.map((x) => x.dayOfWeek === d.i ? { ...x, enabled: e.target.checked } : x))
                                            }
                                        />
                                        {d.label}
                                    </label>

                                    <input
                                        className="agt-input"
                                        type="time"
                                        value={row?.startHHMM || "09:00"}
                                        disabled={!row?.enabled}
                                        onChange={(e) =>
                                            setSchedule((s) => s.map((x) => x.dayOfWeek === d.i ? { ...x, startHHMM: e.target.value } : x))
                                        }
                                    />
                                    <input
                                        className="agt-input"
                                        type="time"
                                        value={row?.endHHMM || "18:00"}
                                        disabled={!row?.enabled}
                                        onChange={(e) =>
                                            setSchedule((s) => s.map((x) => x.dayOfWeek === d.i ? { ...x, endHHMM: e.target.value } : x))
                                        }
                                    />
                                    <input
                                        className="agt-input"
                                        type="number"
                                        min={15}
                                        step={5}
                                        value={row?.slotMin ?? 30}
                                        disabled={!row?.enabled}
                                        onChange={(e) =>
                                            setSchedule((s) => s.map((x) => x.dayOfWeek === d.i ? { ...x, slotMin: e.target.value } : x))
                                        }
                                    />
                                    <div style={{ color: "#666", fontSize: 12 }}>
                                        Slot (min)
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                        <button className="agt-btn" onClick={saveSchedule} disabled={loading}>
                            Save availability
                        </button>
                    </div>
                </div>
            </div>

            <div className="agt-span6">
                <div className="agt-card">
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Create Meeting</div>

                    <form onSubmit={createMeeting} style={{ display: "grid", gap: 10 }}>
                        <input
                            className="agt-input"
                            type="datetime-local"
                            value={newMeet.startAt}
                            onChange={(e) => setNewMeet((x) => ({ ...x, startAt: e.target.value }))}
                            required
                        />
                        <input
                            className="agt-input"
                            type="number"
                            min={15}
                            step={5}
                            value={newMeet.durationMin}
                            onChange={(e) => setNewMeet((x) => ({ ...x, durationMin: e.target.value }))}
                            required
                            placeholder="Duration (min)"
                        />
                        <input
                            className="agt-input"
                            value={newMeet.customerName}
                            onChange={(e) => setNewMeet((x) => ({ ...x, customerName: e.target.value }))}
                            placeholder="Customer name"
                            required
                        />
                        <input
                            className="agt-input"
                            value={newMeet.customerPhone}
                            onChange={(e) => setNewMeet((x) => ({ ...x, customerPhone: e.target.value }))}
                            placeholder="Customer phone"
                            required
                        />
                        <input
                            className="agt-input"
                            value={newMeet.note}
                            onChange={(e) => setNewMeet((x) => ({ ...x, note: e.target.value }))}
                            placeholder="Note (optional)"
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="agt-btn" type="submit">Create</button>
                        </div>
                    </form>

                    <div style={{ fontWeight: 800, margin: "16px 0 10px" }}>Upcoming Meetings</div>

                    <div className="agt-tableWrap">
                        <table className="agt-table" style={{ minWidth: 0 }}>
                            <thead>
                                <tr>
                                    <th className="agt-th">When</th>
                                    <th className="agt-th">Customer</th>
                                    <th className="agt-th">Phone</th>
                                    <th className="agt-th">Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((a) => (
                                    <tr key={a.id} className="agt-row">
                                        <td className="agt-td">{new Date(a.startAt).toLocaleString()}</td>
                                        <td className="agt-td" style={{ fontWeight: 700 }}>{a.customerName}</td>
                                        <td className="agt-td">{a.customerPhone}</td>
                                        <td className="agt-td">{a.note || "—"}</td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (
                                    <tr><td className="agt-td" colSpan={4} style={{ color: "#666" }}>No meetings.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
