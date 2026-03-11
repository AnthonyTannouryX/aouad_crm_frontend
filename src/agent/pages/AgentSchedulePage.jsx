// src/agent/pages/AgentSchedulePage.jsx
import { useEffect, useMemo, useState } from "react";
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

function hhmmToMinutes(v) {
    const s = toHHMM(v);
    if (!s || !s.includes(":")) return 0;
    const [h, m] = s.split(":").map(Number);
    return (Number(h) || 0) * 60 + (Number(m) || 0);
}

function defaultScheduleRow(dayOfWeek) {
    return {
        dayOfWeek,
        startHHMM: "09:00",
        endHHMM: "18:00",
        slotMin: 30,
        enabled: false,
    };
}

function normalizeScheduleRows(rows) {
    return DAYS.map((d) => {
        const found = Array.isArray(rows)
            ? rows.find((x) => Number(x.dayOfWeek) === d.i)
            : null;

        if (!found) return defaultScheduleRow(d.i);

        return {
            dayOfWeek: d.i,
            startHHMM: toHHMM(found.startHHMM || "09:00") || "09:00",
            endHHMM: toHHMM(found.endHHMM || "18:00") || "18:00",
            slotMin: Number(found.slotMin) > 0 ? Number(found.slotMin) : 30,
            enabled: true,
        };
    });
}

function emptyMeeting() {
    return {
        startAt: "",
        durationMin: 30,
        customerName: "",
        customerPhone: "",
        note: "",
    };
}

function formatDateTime(value) {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value || "—";
    }
}

function getErrorMessage(err, fallback) {
    return (
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        fallback
    );
}

export default function AgentSchedulePage() {
    const [schedule, setSchedule] = useState(() =>
        DAYS.map((d) => defaultScheduleRow(d.i))
    );
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [creatingMeeting, setCreatingMeeting] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [newMeet, setNewMeet] = useState(emptyMeeting());

    async function load() {
        setLoading(true);
        setErr("");

        let nextError = "";

        try {
            const schRes = await api.get("/agent/schedule");
            setSchedule(normalizeScheduleRows(schRes.data || []));
        } catch (e) {
            nextError = `Schedule load failed: ${getErrorMessage(e, "Unknown error")}`;
        }

        try {
            const apptRes = await api.get("/agent/appointments");
            setAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
        } catch (e) {
            const msg = `Appointments load failed: ${getErrorMessage(e, "Unknown error")}`;
            nextError = nextError ? `${nextError} | ${msg}` : msg;
            setAppointments([]);
        }

        if (nextError) {
            setErr(nextError);
        }

        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    const scheduleValidationError = useMemo(() => {
        const enabledRows = schedule.filter((d) => d.enabled);

        for (const row of enabledRows) {
            const start = hhmmToMinutes(row.startHHMM);
            const end = hhmmToMinutes(row.endHHMM);
            const slot = Number(row.slotMin) || 0;
            const dayLabel =
                DAYS.find((x) => x.i === row.dayOfWeek)?.label || "this day";

            if (!row.startHHMM || !row.endHHMM) {
                return `Please complete time values for ${dayLabel}.`;
            }

            if (end <= start) {
                return `End time must be after start time for ${dayLabel}.`;
            }

            if (slot < 15) {
                return `Slot must be at least 15 minutes for ${dayLabel}.`;
            }

            if (slot > 240) {
                return `Slot must be 240 minutes or less for ${dayLabel}.`;
            }

            if (end - start < slot) {
                return `Working hours must be at least one full slot for ${dayLabel}.`;
            }
        }

        return "";
    }, [schedule]);

    function updateRow(dayOfWeek, patch) {
        setSchedule((prev) =>
            prev.map((row) =>
                row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row
            )
        );
        setErr("");
        setSuccess("");
    }

    async function saveSchedule() {
        if (scheduleValidationError) {
            setErr(scheduleValidationError);
            return;
        }

        try {
            setSavingSchedule(true);
            setErr("");
            setSuccess("");

            const payload = schedule
                .filter((d) => d.enabled)
                .map((d) => ({
                    dayOfWeek: d.dayOfWeek,
                    startHHMM: toHHMM(d.startHHMM),
                    endHHMM: toHHMM(d.endHHMM),
                    slotMin: Math.max(15, Number(d.slotMin) || 30),
                }));

            await api.put("/agent/schedule", payload);
            setSuccess("Availability saved.");
            await load();
        } catch (e) {
            setErr(getErrorMessage(e, "Save failed"));
        } finally {
            setSavingSchedule(false);
        }
    }

    async function createMeeting(e) {
        e.preventDefault();

        try {
            setCreatingMeeting(true);
            setErr("");
            setSuccess("");

            await api.post("/agent/appointments", {
                startAt: newMeet.startAt,
                durationMin: Math.max(15, Number(newMeet.durationMin) || 30),
                customerName: String(newMeet.customerName || "").trim(),
                customerPhone: String(newMeet.customerPhone || "").trim(),
                note: String(newMeet.note || "").trim() || null,
            });

            setNewMeet(emptyMeeting());
            setSuccess("Meeting created.");
            await load();
        } catch (e) {
            setErr(getErrorMessage(e, "Create failed"));
        } finally {
            setCreatingMeeting(false);
        }
    }

    return (
        <div className="agt-grid">
            <div className="agt-span6">
                <div className="agt-card">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ fontWeight: 800 }}>Weekly Availability</div>
                        {loading ? (
                            <div style={{ fontSize: 13, color: "#666" }}>Loading…</div>
                        ) : null}
                    </div>

                    {err ? (
                        <div
                            style={{
                                marginBottom: 10,
                                color: "#b91c1c",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                padding: "10px 12px",
                                borderRadius: 10,
                            }}
                        >
                            {err}
                        </div>
                    ) : null}

                    {success ? (
                        <div
                            style={{
                                marginBottom: 10,
                                color: "#065f46",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                padding: "10px 12px",
                                borderRadius: 10,
                            }}
                        >
                            {success}
                        </div>
                    ) : null}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {DAYS.map((d) => {
                            const row =
                                schedule.find((x) => x.dayOfWeek === d.i) ||
                                defaultScheduleRow(d.i);

                            return (
                                <div
                                    key={d.i}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "140px 110px 110px 110px 1fr",
                                        gap: 10,
                                        alignItems: "center",
                                    }}
                                >
                                    <label
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!row.enabled}
                                            onChange={(e) =>
                                                updateRow(d.i, { enabled: e.target.checked })
                                            }
                                        />
                                        {d.label}
                                    </label>

                                    <input
                                        className="agt-input"
                                        type="time"
                                        value={row.startHHMM || "09:00"}
                                        disabled={!row.enabled}
                                        onChange={(e) =>
                                            updateRow(d.i, { startHHMM: e.target.value })
                                        }
                                    />

                                    <input
                                        className="agt-input"
                                        type="time"
                                        value={row.endHHMM || "18:00"}
                                        disabled={!row.enabled}
                                        onChange={(e) =>
                                            updateRow(d.i, { endHHMM: e.target.value })
                                        }
                                    />

                                    <input
                                        className="agt-input"
                                        type="number"
                                        min={15}
                                        step={5}
                                        value={row.slotMin ?? 30}
                                        disabled={!row.enabled}
                                        onChange={(e) =>
                                            updateRow(d.i, {
                                                slotMin: Math.max(15, Number(e.target.value) || 30),
                                            })
                                        }
                                    />

                                    <div style={{ color: "#666", fontSize: 12 }}>Slot (min)</div>
                                </div>
                            );
                        })}
                    </div>

                    {scheduleValidationError ? (
                        <div style={{ marginTop: 12, color: "#b45309", fontSize: 13 }}>
                            {scheduleValidationError}
                        </div>
                    ) : null}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 12,
                        }}
                    >
                        <button
                            className="agt-btn"
                            onClick={saveSchedule}
                            disabled={loading || savingSchedule}
                            type="button"
                        >
                            {savingSchedule ? "Saving..." : "Save availability"}
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
                            onChange={(e) =>
                                setNewMeet((x) => ({ ...x, startAt: e.target.value }))
                            }
                            required
                        />

                        <input
                            className="agt-input"
                            type="number"
                            min={15}
                            step={5}
                            value={newMeet.durationMin}
                            onChange={(e) =>
                                setNewMeet((x) => ({
                                    ...x,
                                    durationMin: Math.max(15, Number(e.target.value) || 30),
                                }))
                            }
                            required
                            placeholder="Duration (min)"
                        />

                        <input
                            className="agt-input"
                            value={newMeet.customerName}
                            onChange={(e) =>
                                setNewMeet((x) => ({ ...x, customerName: e.target.value }))
                            }
                            placeholder="Customer name"
                            required
                        />

                        <input
                            className="agt-input"
                            value={newMeet.customerPhone}
                            onChange={(e) =>
                                setNewMeet((x) => ({ ...x, customerPhone: e.target.value }))
                            }
                            placeholder="Customer phone"
                            required
                        />

                        <input
                            className="agt-input"
                            value={newMeet.note}
                            onChange={(e) =>
                                setNewMeet((x) => ({ ...x, note: e.target.value }))
                            }
                            placeholder="Note (optional)"
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                className="agt-btn"
                                type="submit"
                                disabled={creatingMeeting}
                            >
                                {creatingMeeting ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>

                    <div style={{ fontWeight: 800, margin: "16px 0 10px" }}>
                        Upcoming Meetings
                    </div>

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
                                        <td className="agt-td">{formatDateTime(a.startAt)}</td>
                                        <td className="agt-td" style={{ fontWeight: 700 }}>
                                            {a.customerName}
                                        </td>
                                        <td className="agt-td">{a.customerPhone}</td>
                                        <td className="agt-td">{a.note || "—"}</td>
                                    </tr>
                                ))}

                                {appointments.length === 0 && (
                                    <tr>
                                        <td
                                            className="agt-td"
                                            colSpan={4}
                                            style={{ color: "#666" }}
                                        >
                                            No meetings.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}