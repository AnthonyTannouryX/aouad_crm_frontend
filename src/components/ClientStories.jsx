// src/components/ClientStories.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./clientStories.css";

import firstBuyer from "../assets/first-home-buyer.webp";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

/* fallback content (if API is down) */
const FALLBACK_STORIES = [
    {
        quote: `As first-time buyers, we were nervous about every step of the process — from understanding the market to making the right decision financially. From day one, the team took the time to listen, guide us honestly, and explain every detail clearly.

What could have been overwhelming turned into an exciting and smooth journey. We found a home that truly fits our lifestyle, and we felt supported at every stage. We couldn’t have asked for a better experience.`,
        clientName: "Alex Morgan",
        clientTitle: "First-time Home Buyer",
    },
    {
        quote: `We were relocating and needed clarity fast. The team understood our priorities immediately and filtered only relevant options.

Everything was handled efficiently and transparently. We felt confident at every step.`,
        clientName: "Sophie Turner",
        clientTitle: "Relocation Client",
    },
    {
        quote: `Buying our first property felt overwhelming, but the guidance was clear, honest, and very reassuring.

We felt supported not just as clients, but as people making an important life decision.`,
        clientName: "Daniel Reed",
        clientTitle: "Home Buyer",
    },
];

function initials(name) {
    const s = String(name || "").trim();
    if (!s) return "A";
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function splitQuote(quote) {
    const s = String(quote || "").trim();
    if (!s) return [];
    // split on blank line OR newline
    const parts = s.split(/\n\s*\n|\n/g).map((x) => x.trim()).filter(Boolean);
    return parts.length ? parts : [s];
}

export default function ClientStories() {
    const viewportRef = useRef(null);
    const [active, setActive] = useState(0);

    const [items, setItems] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setErr("");
                const res = await fetch(`${API_BASE}/public/client-stories`);
                const data = await res.json();

                if (!res.ok) throw new Error(data?.error || "Failed to load stories");
                if (!alive) return;

                setItems(Array.isArray(data?.items) ? data.items : []);
                setActive(0);

                // scroll back to start after load
                const el = viewportRef.current;
                if (el) el.scrollTo({ left: 0, behavior: "auto" });
            } catch (e) {
                if (!alive) return;
                // fallback to local stories
                setErr(e?.message || "Failed to load stories");
                setItems([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    // If DB works -> use it, else use fallback
    const stories = useMemo(() => {
        const base = items.length ? items : FALLBACK_STORIES;

        return base
            .filter((s) => !s.isHidden) // public endpoint should already filter, but safe
            .map((s, idx) => {
                const name = s.clientName || s.name || "Client";
                const role = s.clientTitle || s.role || "Client";
                const quote = s.quote || (Array.isArray(s.text) ? s.text.join("\n\n") : "");
                return {
                    id: s.id || `local_${idx}`,
                    name,
                    role,
                    initial: initials(name),
                    paragraphs: splitQuote(quote),
                };
            });
    }, [items]);

    const goTo = (i) => {
        const el = viewportRef.current;
        if (!el) return;
        const index = Math.max(0, Math.min(i, stories.length - 1));
        el.scrollTo({
            left: index * el.clientWidth,
            behavior: "smooth",
        });
        setActive(index);
    };

    const next = () => goTo(active + 1);
    const prev = () => goTo(active - 1);

    const onScroll = () => {
        const el = viewportRef.current;
        if (!el) return;
        const w = el.clientWidth || 1;
        setActive(Math.round(el.scrollLeft / w));
    };

    // if nothing at all, hide the section (super clean)
    if (!stories.length) return null;

    return (
        <section className="cs">
            <div className="cs-inner">
                {/* HEADER */}
                <div className="cs-top">
                    <h2 className="cs-title">CLIENT FEEDBACK</h2>

                    {stories.length > 1 ? (
                        <div className="cs-arrows">
                            <button className="cs-arrow" onClick={prev} aria-label="Previous">
                                ‹
                            </button>
                            <button className="cs-arrow" onClick={next} aria-label="Next">
                                ›
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* CARD */}
                <div className="cs-card">
                    {/* FIXED IMAGE */}
                    <div className="cs-image">
                        <img src={firstBuyer} alt="Client story" />
                    </div>

                    {/* TEXT SLIDER */}
                    <div className="cs-text-area">
                        <div className="cs-text-viewport" ref={viewportRef} onScroll={onScroll}>
                            {stories.map((s) => (
                                <div className="cs-text-slide" key={s.id}>
                                    <div className="cs-text">
                                        {s.paragraphs.map((p, j) => (
                                            <p key={j}>{p}</p>
                                        ))}
                                    </div>

                                    <div className="cs-author">
                                        <div className="cs-avatar">{s.initial}</div>
                                        <div>
                                            <div className="cs-name">{s.name}</div>
                                            <div className="cs-role">{s.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DOTS */}
                        {stories.length > 1 ? (
                            <div className="cs-dots">
                                {stories.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`cs-dot ${i === active ? "is-active" : ""}`}
                                        onClick={() => goTo(i)}
                                        aria-label={`Go to story ${i + 1}`}
                                        type="button"
                                    />
                                ))}
                            </div>
                        ) : null}

                        {/* Optional: show tiny debug only in dev (remove if you want) */}
                        {import.meta.env.DEV && err ? (
                            <div style={{ marginTop: 10, fontSize: 12, color: "#999" }}>
                                Stories loaded from fallback (API error: {err})
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
