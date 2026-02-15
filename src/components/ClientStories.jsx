import { useRef, useState } from "react";
import "./clientStories.css";

import firstBuyer from "../assets/first-home-buyer.webp";

const STORIES = [
    {
        text: [
            "As first-time buyers, we were nervous about every step of the process — from understanding the market to making the right decision financially. From day one, the team took the time to listen, guide us honestly, and explain every detail clearly.",
            "What could have been overwhelming turned into an exciting and smooth journey. We found a home that truly fits our lifestyle, and we felt supported at every stage. We couldn’t have asked for a better experience.",
        ],
        name: "Alex Morgan",
        role: "First-time Home Buyer",
        initial: "A",
    },
    {
        text: [
            "We were relocating and needed clarity fast. The team understood our priorities immediately and filtered only relevant options.",
            "Everything was handled efficiently and transparently. We felt confident at every step.",
        ],
        name: "Sophie Turner",
        role: "Relocation Client",
        initial: "S",
    },
    {
        text: [
            "Buying our first property felt overwhelming, but the guidance was clear, honest, and very reassuring.",
            "We felt supported not just as clients, but as people making an important life decision.",
        ],
        name: "Daniel Reed",
        role: "Home Buyer",
        initial: "D",
    },
];

export default function ClientStories() {
    const viewportRef = useRef(null);
    const [active, setActive] = useState(0);

    const goTo = (i) => {
        const el = viewportRef.current;
        if (!el) return;
        const index = Math.max(0, Math.min(i, STORIES.length - 1));
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
        setActive(Math.round(el.scrollLeft / el.clientWidth));
    };

    return (
        <section className="cs">
            <div className="cs-inner">
                {/* HEADER */}
                <div className="cs-top">
                    <h2 className="cs-title">CLIENT STORIES</h2>
                    <div className="cs-arrows">
                        <button className="cs-arrow" onClick={prev}>‹</button>
                        <button className="cs-arrow" onClick={next}>›</button>
                    </div>
                </div>

                {/* CARD */}
                <div className="cs-card">
                    {/* FIXED IMAGE */}
                    <div className="cs-image">
                        <img src={firstBuyer} alt="Client story" />
                    </div>

                    {/* TEXT SLIDER */}
                    <div className="cs-text-area">
                        <div
                            className="cs-text-viewport"
                            ref={viewportRef}
                            onScroll={onScroll}
                        >
                            {STORIES.map((s, i) => (
                                <div className="cs-text-slide" key={i}>
                                    <div className="cs-text">
                                        {s.text.map((p, j) => (
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

                    </div>
                </div>
            </div>
        </section>
    );
}
