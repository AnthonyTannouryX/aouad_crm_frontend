// src/admin/pages/AdminListingsSearchPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./adminListingsSearchPage.css";

import { FaBed, FaTag, FaMapMarkerAlt } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function xNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function priceValue(p) {
    return xNum(p?.priceFrom ?? p?.startingPrice);
}

function listingImage(p) {
    return (
        p?.coverImage ||
        p?.thumbnail ||
        p?.imageUrl ||
        p?.photoUrl ||
        p?.images?.[0] ||
        p?.media?.[0]?.url ||
        null
    );
}

export default function AdminListingsSearchPage() {
    const [bedrooms, setBedrooms] = useState("Any");
    const [price, setPrice] = useState("Any");
    const [location, setLocation] = useState("Any");

    const [raw, setRaw] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/public/listings?limit=300`);
                const data = await res.json().catch(() => ({}));
                if (!alive) return;

                const list = Array.isArray(data) ? data : data.items;
                setRaw(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const locationOptions = useMemo(() => {
        const set = new Set();
        raw.forEach((p) => p?.location && set.add(p.location));
        return ["Any", ...Array.from(set)];
    }, [raw]);

    const filtered = useMemo(() => {
        let list = [...raw];

        if (bedrooms !== "Any") {
            if (bedrooms === "Studio") {
                list = list.filter(
                    (p) =>
                        String(p?.bedrooms).toLowerCase() === "studio" ||
                        xNum(p?.bedrooms) === 0
                );
            } else if (bedrooms === "4+") {
                list = list.filter((p) => xNum(p?.bedrooms) >= 4);
            } else {
                list = list.filter((p) => String(p?.bedrooms) === bedrooms);
            }
        }

        if (location !== "Any") {
            list = list.filter((p) => p?.location === location);
        }

        if (price !== "Any") {
            list = list.filter((p) => {
                const n = priceValue(p);
                if (!n) return false;
                if (price === "Under 200K") return n < 200_000;
                if (price === "200K - 500K") return n <= 500_000;
                if (price === "500K - 1M") return n <= 1_000_000;
                if (price === "1M+") return n >= 1_000_000;
                return true;
            });
        }

        return list;
    }, [raw, bedrooms, price, location]);

    return (
        <div className="als">
            {/* FILTERS */}
            <div className="als-filters">
                <FilterSelect
                    icon={<FaBed />}
                    label="Bedrooms"
                    value={bedrooms}
                    onChange={setBedrooms}
                    options={["Any", "Studio", "1", "2", "3", "4+"]}
                />

                <FilterSelect
                    icon={<FaTag />}
                    label="Price range"
                    value={price}
                    onChange={setPrice}
                    options={["Any", "Under 200K", "200K - 500K", "500K - 1M", "1M+"]}
                />

                <FilterSelect
                    icon={<FaMapMarkerAlt />}
                    label="Location"
                    value={location}
                    onChange={setLocation}
                    options={locationOptions}
                />
            </div>

            {/* RESULTS */}
            {loading ? (
                <div className="als-empty">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="als-empty">No listings found</div>
            ) : (
                <div className="als-grid">
                    {filtered.map((p) => {
                        const img = listingImage(p);

                        return (
                            <Link
                                key={p.id}
                                to={`/listing/${p.id}`}
                                className="als-cardLink"
                            >
                                <div className="als-card">
                                    {img && (
                                        <div
                                            className="als-img"
                                            style={{ backgroundImage: `url(${img})` }}
                                        />
                                    )}

                                    <div className="als-title">{p.title || "Untitled"}</div>

                                    <div className="als-meta">
                                        {p?.bedrooms ?? "-"} beds · {p?.location || "-"}
                                    </div>

                                    <div className="als-price">
                                        {p?.priceFrom
                                            ? `From ${p?.currency || "USD"} ${Number(
                                                p.priceFrom
                                            ).toLocaleString()}`
                                            : "Price on request"}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FilterSelect({ icon, label, value, onChange, options }) {
    return (
        <div className="als-filter">
            <span className="als-filterIcon">{icon}</span>
            <div className="als-filterBody">
                <div className="als-filterLabel">{label}</div>
                <select
                    className="als-select"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
