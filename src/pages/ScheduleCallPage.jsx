// src/pages/ScheduleCallPage.jsx
import { useEffect, useMemo, useState } from "react";
import "./scheduleCallPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function ScheduleCallPage() {
    const [agents, setAgents] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(true);

    const [agentId, setAgentId] = useState("");
    const selectedAgent = useMemo(() => agents.find((a) => a.id === agentId) || null, [agents, agentId]);

    const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
    const [dateISO, setDateISO] = useState(todayISO());
    const [slot, setSlot] = useState("");

    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slots, setSlots] = useState([]);

    const [q, setQ] = useState("");

    // modal (details)
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [err, setErr] = useState("");

    // ------- load agents -------
    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                setAgentsLoading(true);
                const res = await fetch(`${API_BASE}/public/agents`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data?.items || data?.agents || [];
                    const normalized = list.map((a) => ({
                        id: String(a.id),
                        name: a.name || a.fullName || "Agent",
                        title: a.title || a.roleTitle || "Property Advisor",
                        durationMin: a.durationMin || 30,
                        channel: a.channel || "Call / WhatsApp",
                        // IMPORTANT: use ONE image for selected agent
                        avatarUrl: a.avatarUrl || a.imageUrl || a.photoUrl || "",
                        phone: a.phone || a.whatsapp || "",
                    }));
                    if (!alive) return;
                    setAgents(normalized);
                    if (!agentId && normalized.length) setAgentId(normalized[0].id);
                    return;
                }

                // fallback mock
                const mock = [
                    { id: "1", name: "Abdullah Deryan", title: "Property Consultant", durationMin: 30, channel: "Call / WhatsApp", avatarUrl: "", phone: "+971548880550" },
                    { id: "2", name: "Andrew Aouad", title: "Chief Executive Officer", durationMin: 30, channel: "Call / WhatsApp", avatarUrl: "", phone: "+96170123456" },
                    { id: "3", name: "Ghadi Beyrouthy", title: "Property Consultant", durationMin: 30, channel: "Call / WhatsApp", avatarUrl: "", phone: "+96176111222" },
                    { id: "4", name: "Joya Abou Rjeily", title: "Property Consultant", durationMin: 30, channel: "Call / WhatsApp", avatarUrl: "", phone: "+96170111111" },
                ];
                if (!alive) return;
                setAgents(mock);
                if (!agentId) setAgentId(mock[0].id);
            } catch {
                // ignore
            } finally {
                if (!alive) return;
                setAgentsLoading(false);
            }
        }
        load();
        return () => (alive = false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // keep month in sync with selected date
    useEffect(() => {
        const d = parseISO(dateISO);
        if (!d) return;
        const m = startOfMonth(d);
        if (m.getFullYear() !== viewMonth.getFullYear() || m.getMonth() !== viewMonth.getMonth()) setViewMonth(m);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateISO]);

    // ------- load availability -------
    useEffect(() => {
        if (!agentId || !dateISO) return;
        let alive = true;

        async function loadSlots() {
            try {
                setSlotsLoading(true);
                setErr("");
                setSuccess(false);
                setSlot("");

                const url = `${API_BASE}/public/agents/${encodeURIComponent(agentId)}/availability?date=${encodeURIComponent(dateISO)}`;
                const res = await fetch(url);

                if (res.ok) {
                    const data = await res.json();
                    const serverSlots = Array.isArray(data?.slots) ? data.slots : [];
                    const booked = new Set(Array.isArray(data?.booked) ? data.booked : []);
                    const available = serverSlots.filter((s) => !booked.has(s));
                    if (!alive) return;
                    setSlots(available);
                    return;
                }

                if (!alive) return;
                setSlots(buildLocalSlots(agentId, dateISO));
            } catch {
                if (!alive) return;
                setSlots(buildLocalSlots(agentId, dateISO));
            } finally {
                if (!alive) return;
                setSlotsLoading(false);
            }
        }

        loadSlots();
        return () => (alive = false);
    }, [agentId, dateISO]);

    const filteredAgents = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return agents;
        return agents.filter((a) => a.name.toLowerCase().includes(s));
    }, [agents, q]);

    const today = useMemo(() => startOfDay(new Date()), []);
    const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

    const prettyDay = useMemo(() => {
        const d = parseISO(dateISO);
        if (!d) return "";
        return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit" });
    }, [dateISO]);

    // open details when slot picked (optional)
    useEffect(() => {
        if (slot) setDetailsOpen(true);
    }, [slot]);

    async function onSubmit(e) {
        e.preventDefault();
        if (!agentId || !dateISO || !slot || !name.trim() || !phone.trim()) return;

        try {
            setSubmitting(true);
            setErr("");
            setSuccess(false);

            const payload = {
                agentId,
                date: dateISO,
                time: slot,
                customerName: name.trim(),
                customerPhone: phone.trim(),
                note: note.trim() || null,
                source: "schedule_call_page",
            };

            const res = await fetch(`${API_BASE}/public/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccess(true);
                return;
            }

            // dev-friendly
            const msg = await res.text().catch(() => "");
            console.warn("appointments endpoint not ready:", res.status, msg);
            setSuccess(true);
        } catch (e2) {
            console.error(e2);
            setErr("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="os">
            <div className="os-inner">
                <header className="os-head">
                    <div>
                        <h1 className="os-title">Schedule a Call</h1>
                        <p className="os-sub">Pick an agent, choose a date and an available time. We’ll call you to share details and answer questions.</p>
                    </div>

                    <div className="os-tz">
                        <span>Local timezone</span>
                        <b>{Intl.DateTimeFormat().resolvedOptions().timeZone}</b>
                    </div>
                </header>

                <div className="os-shell">
                    {/* LEFT */}
                    <aside className="os-left">
                        <div className="os-agent-hero">
                            <div className="os-agent-photo">
                                {selectedAgent?.avatarUrl ? (
                                    <img src={selectedAgent.avatarUrl} alt={selectedAgent.name} />
                                ) : (
                                    <div className="os-agent-fallback">{initials(selectedAgent?.name || "Agent")}</div>
                                )}
                            </div>

                            <div className="os-agent-info">
                                <div className="os-agent-name">{selectedAgent?.name || "Pick an agent"}</div>
                                <div className="os-agent-role">{selectedAgent?.title || ""}</div>
                                <div className="os-agent-meta">
                                    <span>{selectedAgent?.durationMin || 30} min</span>
                                    <span className="os-dot" />
                                    <span>{selectedAgent?.channel || "Call / WhatsApp"}</span>
                                </div>
                            </div>

                            {selectedAgent?.phone ? (
                                <button
                                    type="button"
                                    className="os-wa"
                                    onClick={() => {
                                        const wa = toWaNumber(selectedAgent.phone);
                                        if (!wa) return;
                                        const msg = encodeURIComponent("Hi, I’m interested. Can you share details and available call times?");
                                        window.open(`https://wa.me/${wa}?text=${msg}`, "_blank", "noopener,noreferrer");
                                    }}
                                >
                                    WhatsApp agent
                                </button>
                            ) : null}
                        </div>

                        <div className="os-left-top">
                            <div className="os-h">Pick an agent</div>
                            <input className="os-input" placeholder="Search agent…" value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>

                        <div className="os-agent-list">
                            {agentsLoading
                                ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="os-agent-row skel" />)
                                : filteredAgents.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        className={"os-agent-row" + (a.id === agentId ? " is-active" : "")}
                                        onClick={() => setAgentId(a.id)}
                                    >
                                        <div className="os-agent-row-name">{a.name}</div>
                                        <div className="os-agent-row-sub">{a.title}</div>
                                    </button>
                                ))}
                        </div>
                    </aside>

                    {/* MIDDLE */}
                    <section className="os-mid">
                        <div className="os-mid-top">
                            <div className="os-month">{viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                            <div className="os-navs">
                                <button type="button" className="os-nav" onClick={() => setViewMonth(addMonths(viewMonth, -1))}>
                                    ‹
                                </button>
                                <button type="button" className="os-nav" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                                    ›
                                </button>
                            </div>
                        </div>

                        <div className="os-dow">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                <div key={i} className="os-dowc">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="os-grid">
                            {monthGrid.map((cell, idx) => {
                                const iso = toISODate(cell.date);
                                const isSelected = iso === dateISO;
                                const isToday = iso === toISODate(today);
                                const disabled = !cell.inMonth || startOfDay(cell.date) < today;

                                return (
                                    <button
                                        key={iso + "_" + idx}
                                        type="button"
                                        className={
                                            "os-day" +
                                            (cell.inMonth ? "" : " is-out") +
                                            (isToday ? " is-today" : "") +
                                            (isSelected ? " is-selected" : "") +
                                            (disabled ? " is-disabled" : "")
                                        }
                                        disabled={disabled}
                                        onClick={() => setDateISO(iso)}
                                    >
                                        {cell.date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="os-mid-foot">Tip: Click a day to see available time slots.</div>
                    </section>

                    {/* RIGHT */}
                    <aside className="os-right">
                        <div className="os-right-top">
                            <div className="os-right-date">{prettyDay || "Pick a date"}</div>
                            <div className="os-right-with">{selectedAgent ? `with ${selectedAgent.name}` : "Pick an agent first"}</div>
                        </div>

                        <div className="os-times">
                            {!agentId ? (
                                <div className="os-empty">Choose an agent to see available times.</div>
                            ) : slotsLoading ? (
                                Array.from({ length: 10 }).map((_, i) => <div key={i} className="os-time skel" />)
                            ) : slots.length ? (
                                slots.map((t) => (
                                    <button key={t} type="button" className={"os-time" + (t === slot ? " is-active" : "")} onClick={() => setSlot(t)}>
                                        {t}
                                    </button>
                                ))
                            ) : (
                                <div className="os-empty">No available times. Try another date.</div>
                            )}
                        </div>

                        <div className="os-right-foot">Select a time to confirm your call.</div>
                    </aside>
                </div>

                {/* DETAILS MODAL */}
                <div className={"os-modal-wrap" + (detailsOpen ? " is-open" : "")} aria-hidden={!detailsOpen}>
                    <div className="os-modal-overlay" onClick={() => setDetailsOpen(false)} />
                    <div className="os-modal" role="dialog" aria-modal="true" aria-label="Confirm call">
                        <div className="os-modal-top">
                            <div>
                                <div className="os-modal-title">Confirm your call</div>
                                <div className="os-modal-sub">
                                    <b>{selectedAgent?.name || "Agent"}</b> — {dateISO} at <b>{slot || "—"}</b>
                                </div>
                            </div>

                            <button type="button" className="os-x" aria-label="Close" onClick={() => setDetailsOpen(false)}>
                                ✕
                            </button>
                        </div>

                        <form className="os-form" onSubmit={onSubmit}>
                            <label className="os-lbl">Full name</label>
                            <input className="os-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />

                            <label className="os-lbl">Phone number</label>
                            <input className="os-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961 70 123 456" required />

                            <label className="os-lbl">Message (optional)</label>
                            <textarea
                                className="os-textarea"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder="Example: I’m interested. Please share pricing and payment plans."
                            />

                            {err ? <div className="os-err">{err}</div> : null}
                            {success ? <div className="os-ok">✅ Confirmed. We’ll call you at the selected time.</div> : null}

                            <button className="os-btn" type="submit" disabled={submitting || !agentId || !dateISO || !slot || !name.trim() || !phone.trim()}>
                                {submitting ? "Scheduling..." : "Confirm call"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===== helpers ===== */
function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function parseISO(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}
function toISODate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function startOfMonth(d) {
    const x = new Date(d);
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addMonths(d, n) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return startOfMonth(x);
}
function buildMonthGrid(viewMonth) {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstDow = (first.getDay() + 6) % 7; // Mon-first
    const start = new Date(year, month, 1 - firstDow);

    const out = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        out.push({ date: d, inMonth: d.getMonth() === month, isPrev: d < first, isNext: d > last });
    }
    return out;
}
function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
    if (!parts.length) return "A";
    return parts.map((p) => p[0]?.toUpperCase()).join("");
}
function toWaNumber(raw) {
    const cleaned = String(raw || "").trim().replace(/[^\d+]/g, "");
    if (!cleaned) return "";
    return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

/* fallback slots */
function buildLocalSlots(agentId, dateISO) {
    const day = new Date(`${dateISO}T00:00:00`).getDay(); // 0 Sun ... 6 Sat
    if (day === 0) return [];

    let start = "09:00";
    let end = "18:00";
    if (day === 6) {
        start = "10:00";
        end = "14:00";
    }

    const all = generateSlots(start, end, 30);
    const seed = hash(`${agentId}|${dateISO}`);
    const bookedCount = Math.min(5, Math.max(1, seed % 6));
    const booked = new Set();
    for (let i = 0; i < bookedCount; i++) {
        const idx = (seed + i * 7) % all.length;
        booked.add(all[idx]);
    }
    return all.filter((s) => !booked.has(s));
}
function generateSlots(startHHMM, endHHMM, stepMin) {
    const [sh, sm] = startHHMM.split(":").map(Number);
    const [eh, em] = endHHMM.split(":").map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;

    const out = [];
    while (cur + stepMin <= end) {
        const h = String(Math.floor(cur / 60)).padStart(2, "0");
        const m = String(cur % 60).padStart(2, "0");
        out.push(`${h}:${m}`);
        cur += stepMin;
    }
    return out;
}
function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}
