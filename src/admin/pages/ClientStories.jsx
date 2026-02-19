// src/components/ClientStories.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./clientStories.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function splitQuoteToParagraphs(quote) {
    const s = String(quote || "").trim();
    if (!s) return [];
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
                const res = await fetch(`${API_BASE}/public/client-stories?limit=12`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || "Failed to load stories");
                if (!alive) return;
                setItems(Array.isArray(data?.items) ? data.items : []);
                setActive(0);
            } catch (e) {
                if (!alive) return;
                setErr(e.message || "Failed to load stories");
                setItems([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const stories = useMemo(() => {
        return items.map((s) => ({
            id: s.id,
            name: s.clientName,
            role: s.clientTitle || "Client",
            paragraphs: splitQuoteToParagraphs(s.quote),
        }));
    }, [items]);

    const goTo = (i) => {
        const el = viewportRef.current;
        if (!el) return;
        const max = Math.max(0, stories.length - 1);
        const index = Math.max(0, Math.min(i, max));
        el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
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

    if (err) return null;
    if (!stories.length) return null;

    return (
        <section className="cs">
            <div className="cs-inner">
                <div className="cs-top">
                    <h2 className="cs-title">CLIENT FEEDBACK</h2>

                    {stories.length > 1 ? (
                        <div className="cs-arrows">
                            <button className="cs-arrow" onClick={prev} aria-label="Previous">‹</button>
                            <button className="cs-arrow" onClick={next} aria-label="Next">›</button>
                        </div>
                    ) : null}
                </div>

                <div className="cs-card cs-card--clean">
                    <div className="cs-text-viewport" ref={viewportRef} onScroll={onScroll}>
                        {stories.map((s) => (
                            <div className="cs-text-slide" key={s.id}>
                                <div className="cs-text">
                                    {s.paragraphs.map((p, idx) => (
                                        <p key={idx}>{p}</p>
                                    ))}
                                </div>

                                <div className="cs-author cs-author--clean">
                                    <div className="cs-name">{s.name}</div>
                                    <div className="cs-role">{s.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {stories.length > 1 ? (
                        <div className="cs-dots">
                            {stories.map((_, i) => (
                                <button
                                    key={i}
                                    className={`cs-dot ${i === active ? "is-active" : ""}`}
                                    onClick={() => goTo(i)}
                                    aria-label={`Go to story ${i + 1}`}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
