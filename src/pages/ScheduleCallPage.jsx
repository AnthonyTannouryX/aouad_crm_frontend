// src/pages/ScheduleCallPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "./scheduleCallPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function ScheduleCallPage() {
    const location = useLocation();
    const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const lockedAgentId = qs.get("agentId") || "";
    const listingId = qs.get("listingId") || ""; // kept if you want later (not used here)

    const [agents, setAgents] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(true);

    const [agentId, setAgentId] = useState("");
    const selectedAgent = useMemo(
        () => agents.find((a) => a.id === agentId) || null,
        [agents, agentId]
    );

    const [q, setQ] = useState("");

    // ------- load agents -------
    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                setAgentsLoading(true);

                const res = await fetch(`${API_BASE}/public/agents`);
                const data = res.ok ? await res.json() : null;
                const list = Array.isArray(data) ? data : data?.items || data?.agents || [];

                const normalized = list.map((a) => ({
                    id: String(a.id),
                    name: a.name || a.fullName || "Agent",
                    title: a.title || a.roleTitle || "Property Advisor",
                    channel: a.channel || "WhatsApp",
                    avatarUrl: a.avatarUrl || a.imageUrl || a.photoUrl || "",
                    phone: a.phone || a.whatsapp || "",
                }));

                const finalList = lockedAgentId
                    ? normalized.filter((a) => a.id === lockedAgentId)
                    : normalized;

                if (!alive) return;

                setAgents(finalList);

                if (lockedAgentId) {
                    setAgentId(lockedAgentId);
                } else if (finalList.length) {
                    setAgentId((prev) => prev || finalList[0].id);
                }
            } catch (e) {
                console.error(e);
                if (!alive) return;
                setAgents([]);
            } finally {
                if (!alive) return;
                setAgentsLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [lockedAgentId]);

    const filteredAgents = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return agents;
        return agents.filter((a) => a.name.toLowerCase().includes(s));
    }, [agents, q]);

    const isLocked = !!lockedAgentId;

    return (
        <div className="os">
            <div className="os-inner">
                <header className="os-head">
                    <div>
                        <h1 className="os-title">Contact an Agent</h1>
                        <p className="os-sub">Pick an agent and message them directly on WhatsApp.</p>
                    </div>

                    <div className="os-tz" style={{ visibility: "hidden" }}>
                        <span>spacer</span>
                        <b>spacer</b>
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
                                    <div className="os-agent-fallback">
                                        {initials(selectedAgent?.name || "Agent")}
                                    </div>
                                )}
                            </div>

                            <div className="os-agent-info">
                                <div className="os-agent-name">{selectedAgent?.name || "Pick an agent"}</div>
                                <div className="os-agent-role">{selectedAgent?.title || ""}</div>
                                <div className="os-agent-meta">
                                    <span>{selectedAgent?.channel || "WhatsApp"}</span>
                                </div>
                            </div>

                            {selectedAgent?.phone ? (
                                <button
                                    type="button"
                                    className="os-wa"
                                    onClick={() => {
                                        const wa = toWaNumber(selectedAgent.phone);
                                        if (!wa) return;

                                        const msg = encodeURIComponent(
                                            `Hi ${selectedAgent.name}, I’m interested in ${listingId ? "listing " + listingId : "your available opportunities"}. Can you share details?`
                                        );

                                        window.open(
                                            `https://wa.me/${wa}?text=${msg}`,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
                                    }}
                                >
                                    WhatsApp agent
                                </button>
                            ) : (
                                <button type="button" className="os-wa" disabled>
                                    WhatsApp unavailable
                                </button>
                            )}
                        </div>

                        {/* ✅ If locked, hide list/search */}
                        {!isLocked && (
                            <>
                                <div className="os-left-top">
                                    <div className="os-h">Pick an agent</div>
                                    <input
                                        className="os-input"
                                        placeholder="Search agent…"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                    />
                                </div>

                                <div className="os-agent-list">
                                    {agentsLoading
                                        ? Array.from({ length: 7 }).map((_, i) => (
                                            <div key={i} className="os-agent-row skel" />
                                        ))
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
                            </>
                        )}

                        {isLocked && (
                            <div style={{ padding: "14px 16px", color: "rgb(100,116,139)", fontSize: 13 }}>
                                You’re contacting this agent only.
                            </div>
                        )}
                    </aside>

                    {/* RIGHT (removed completely) */}
                    <section className="os-mid" style={{ display: "none" }} />
                    <aside className="os-right" style={{ display: "none" }} />
                </div>
            </div>
        </div>
    );
}

/* ===== helpers ===== */
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