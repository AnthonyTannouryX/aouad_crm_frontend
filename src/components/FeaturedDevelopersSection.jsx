import { useEffect, useMemo, useRef, useState } from "react";
import "./featuredDevelopersSection.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

/* ================== LOCAL FALLBACK LOGOS (if API fails) ================== */
import kfoury from "../assets/developers/kfoury.png";
import sammak from "../assets/developers/sammak.png";
import wawHolding from "../assets/developers/waw.png";
import cLogo from "../assets/developers/c-logo.png";
import jc from "../assets/developers/jc.png";
import kingsmen from "../assets/developers/kingsmen.png";
import choucair from "../assets/developers/choucair.png";
import asya from "../assets/developers/asya.png";

/* Fallback data (your current static section) */
const FALLBACK_DEVELOPERS = [
    { id: "fb_1", name: "Kfoury", desc: "Engineering & contracting solutions with strong delivery and execution.", logo: kfoury },
    { id: "fb_2", name: "Sammak", desc: "High-quality real estate developments with modern design and reliable delivery.", logo: sammak },
    { id: "fb_3", name: "WAW Holding", desc: "Investment and holding group behind strategic real estate ventures.", logo: wawHolding },
    { id: "fb_4", name: "C Group", desc: "Developer group focused on contemporary projects and premium finishing.", logo: cLogo },
    { id: "fb_5", name: "JC", desc: "Signature developments blending architecture, functionality, and value.", logo: jc },
    { id: "fb_6", name: "Kingsmen", desc: "Investment and development brand creating high-end lifestyle projects.", logo: kingsmen },
    { id: "fb_7", name: "Choucair", desc: "Trusted group delivering quality residential and commercial projects.", logo: choucair },
    { id: "fb_8", name: "Asya Architects", desc: "Architectural studio shaping refined, modern, and timeless spaces.", logo: asya },
];

/**
 * API expected shape:
 * { items: [{ id, name, description, logoUrl }] }
 * We map it into: { id, name, desc, logo }
 */
function mapApiDeveloper(d) {
    return {
        id: d?.id || crypto.randomUUID(),
        name: d?.name || "Developer",
        desc: d?.description || d?.desc || "",
        logo: d?.logoUrl || d?.logo || "", // ✅ must be URL string
    };
}

export default function FeaturedDevelopersSection() {
    const [items, setItems] = useState(FALLBACK_DEVELOPERS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/public/developers/featured`);
                const data = await res.json().catch(() => ({}));

                if (!res.ok) throw new Error(data?.error || "Failed to load developers");

                const apiItems = Array.isArray(data?.items) ? data.items.map(mapApiDeveloper) : [];

                // ✅ If API returns something, use it. Else keep fallback.
                if (alive) {
                    setItems(apiItems.length ? apiItems : FALLBACK_DEVELOPERS);
                }
            } catch (e) {
                console.error("FeaturedDevelopersSection fetch failed:", e);
                if (alive) setItems(FALLBACK_DEVELOPERS);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <section className="fd">
            <div className="fd-inner">
                <h2 className="fd-title">FEATURED DEVELOPERS</h2>

                {/* optional: you can remove this loading block if you don't want it */}
                {loading ? (
                    <DevelopersCarousel items={items} />
                ) : (
                    <DevelopersCarousel items={items} />
                )}
            </div>
        </section>
    );
}

/* ================= CAROUSEL (SWIPE / SCROLL) ================= */
function DevelopersCarousel({ items }) {
    const viewportRef = useRef(null);
    const [index, setIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(4);

    const getGapPx = () => {
        const el = viewportRef.current;
        if (!el) return 26;

        const cs = getComputedStyle(el);
        const v = cs.getPropertyValue("--fd-gap").trim();
        const parsed = parseFloat(v);
        if (!Number.isNaN(parsed)) return parsed;

        const gap = parseFloat(cs.gap);
        return Number.isNaN(gap) ? 26 : gap;
    };

    const getVisibleCount = () => {
        const el = viewportRef.current;
        if (!el) return 4;

        const card = el.querySelector(".fd-card");
        if (!card) return 4;

        const cardW = card.getBoundingClientRect().width;
        const vpW = el.getBoundingClientRect().width;

        return Math.max(1, Math.round(vpW / cardW));
    };

    useEffect(() => {
        const update = () => setVisibleCount(getVisibleCount());
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const maxIndex = Math.max(0, items.length - visibleCount);

    const onScroll = () => {
        const el = viewportRef.current;
        if (!el) return;

        const card = el.querySelector(".fd-card");
        if (!card) return;

        const cardW = card.getBoundingClientRect().width;
        const gap = getGapPx();
        const step = cardW + gap;

        const nextIndex = Math.round(el.scrollLeft / step);
        setIndex(Math.max(0, Math.min(maxIndex, nextIndex)));
    };

    // reset index if items change (prevents dot mismatch)
    useEffect(() => {
        setIndex(0);
        const el = viewportRef.current;
        if (el) el.scrollLeft = 0;
    }, [items.length]);

    return (
        <>
            <div className="fd-scroll" ref={viewportRef} onScroll={onScroll}>
                {items.map((d) => (
                    <article className="fd-card" key={d.id}>
                        <div className="fd-logo">
                            {d.logo ? <img src={d.logo} alt={d.name} loading="lazy" /> : null}
                        </div>

                        <p className="fd-desc">{d.desc}</p>
                    </article>
                ))}
            </div>

            {maxIndex > 0 && (
                <div className="fd-dots" aria-hidden="true">
                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                        <span key={i} className={"fd-dot" + (i === index ? " is-active" : "")} />
                    ))}
                </div>
            )}
        </>
    );
}
