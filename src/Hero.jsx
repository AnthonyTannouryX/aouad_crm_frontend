import { useMemo, useState, useRef, useEffect } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import "./hero.css";

import img1 from "./assets/carousel1.jpg";
import img2 from "./assets/carousel2.jpg";
import img3 from "./assets/carousel3.jpg";
import img4 from "./assets/carousel4.jpg";

const IMAGES = [img1, img2, img3, img4];

const OPTIONS = {
    listingType: ["Off plan", "For sale", "For rent"],
    community: [
        "Any community",
        "Downtown Dubai",
        "Business Bay",
        "Palm Jumeirah",
        "Dubai Marina",
        "MBR City",
        "City Walk",
        "Jumeirah Islands",
        "Jumeirah Bay",
        "Marsa Al Arab",
    ],
    propertyType: ["Any type", "Apartment", "Villa", "Townhouse", "Penthouse"],
};

export default function Hero() {
    const bgImage = useMemo(
        () => IMAGES[Math.floor(Math.random() * IMAGES.length)],
        []
    );

    const [listingType, setListingType] = useState(OPTIONS.listingType[0]);
    const [community, setCommunity] = useState(OPTIONS.community[0]);
    const [propertyType, setPropertyType] = useState(OPTIONS.propertyType[0]);
    const [open, setOpen] = useState(null);

    const rootRef = useRef(null);

    /* ✅ CLOSE ON OUTSIDE TAP (DESKTOP + MOBILE) */
    useEffect(() => {
        const close = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(null);
        };
        const esc = (e) => e.key === "Escape" && setOpen(null);

        document.addEventListener("mousedown", close);
        document.addEventListener("touchstart", close, { passive: true });
        document.addEventListener("keydown", esc);

        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("touchstart", close);
            document.removeEventListener("keydown", esc);
        };
    }, []);

    return (
        <section className="hero">
            <div className="hero-bg">
                <div
                    className="hero-slide"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
                <div className="hero-overlay" />
            </div>

            <div className="hero-inner">
                <div className="hero-eyebrow">
                    EXPERT REAL ESTATE ADVICE TO GROW YOUR WEALTH
                </div>

                <h1 className="hero-title">
                    <span className="hero-title-line1">Find Your Perfect Property</span>
                    <span className="hero-title-break">WorldWide</span>
                </h1>


                <p className="hero-subtitle">
                    Find your perfect property with your trusted advisor.
                    <br />

                </p>

                <div className="hero-search" ref={rootRef}>
                    <Dropdown
                        value={listingType}
                        open={open === "listing"}
                        onToggle={() =>
                            setOpen(open === "listing" ? null : "listing")
                        }
                        options={OPTIONS.listingType}
                        onSelect={(v) => {
                            setListingType(v);
                            setOpen(null);
                        }}
                    />

                    <div className="hero-divider" />

                    <Dropdown
                        grow
                        searchable
                        value={community}
                        open={open === "community"}
                        onToggle={() =>
                            setOpen(open === "community" ? null : "community")
                        }
                        options={OPTIONS.community}
                        onSelect={(v) => {
                            setCommunity(v);
                            setOpen(null);
                        }}
                    />

                    <div className="hero-divider" />

                    <Dropdown
                        grow
                        value={propertyType}
                        open={open === "type"}
                        onToggle={() =>
                            setOpen(open === "type" ? null : "type")
                        }
                        options={OPTIONS.propertyType}
                        onSelect={(v) => {
                            setPropertyType(v);
                            setOpen(null);
                        }}
                    />

                    <button className="hero-btn">
                        Search <FaSearch className="hero-ic--search" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function Dropdown({
    value,
    options,
    open,
    onToggle,
    onSelect,
    grow = false,
    searchable = false,
}) {
    const [q, setQ] = useState("");

    useEffect(() => {
        if (!open) setQ("");
    }, [open]);

    const filtered = searchable
        ? options.filter((o) =>
            o.toLowerCase().includes(q.toLowerCase())
        )
        : options;

    return (
        <div className={`hero-dd ${grow ? "hero-dd--grow" : ""} ${open ? "is-open" : ""}`}>
            <button className="hero-field" onClick={onToggle}>
                <span className="hero-field-text">{value}</span>
                <FaChevronDown className="hero-ic--chev" />
            </button>

            <div className="hero-menu">
                {searchable && (
                    <div className="hero-menu-search">
                        <FaSearch />
                        <input
                            className="hero-menu-search-input"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search..."
                        />
                    </div>
                )}

                <div className="hero-menu-list">
                    {filtered.map((opt) => (
                        <button
                            key={opt}
                            className={`hero-opt ${opt === value ? "is-active" : ""
                                }`}
                            onClick={() => onSelect(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
