// src/pages/OffPlanPage.jsx
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./offPlanPage.css";

import {
  FaMapMarkerAlt,
  FaRegCircle,
  FaPhoneAlt,
  FaWhatsapp,
  FaChevronDown,
  FaSlidersH,
  FaMapMarkedAlt,
  FaTimes,
  FaHome,
  FaCalendarAlt,
  FaTag,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function OffPlanPage() {
  const [location, setLocation] = useState("Any location");
  const [type, setType] = useState("Type");
  const [completion, setCompletion] = useState("Completion Date");
  const [price, setPrice] = useState("Price Range");
  const [sort, setSort] = useState("Recommended");

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [developer, setDeveloper] = useState("Any developer");
  const [brandedOnly, setBrandedOnly] = useState(false);
  const [downpayment, setDownpayment] = useState("Any Downpayment");
  const [postHandover, setPostHandover] = useState(false);

  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const [showTop, setShowTop] = useState(false);

  // ✅ DATA
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // floating top
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // drawer lock + ESC
  useEffect(() => {
    const prev = document.body.style.overflow;

    if (filtersOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev;

    const onKey = (e) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  // ✅ Fetch OFF_PLAN from PUBLIC route (no auth)
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/public/listings?listingType=OFF_PLAN&limit=200`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to fetch off-plan");

        const rawList = Array.isArray(json) ? json : json.items;
        const list = Array.isArray(rawList) ? rawList : [];

        // ✅ map backend response to what your UI expects
        const mapped = list.map((l) => {
          const handoverYear = l?.handover?.match(/\d{4}/)?.[0] || null;
          return {
            id: l.id,
            title: l.title,
            featured: !!l.featured,
            location: l.location,
            paymentPlan: l.paymentPlan,
            handover: l.handover,
            developer: l.developer || l.developerName || "",
            image: l.mainImageUrl,
            priceAed: l.priceFrom
              ? `From ${l.currency || "USD"} ${Number(l.priceFrom).toLocaleString()}`
              : "Price on request",
            completionYear: handoverYear ? Number(handoverYear) : 0,
            _raw: l,
          };
        });

        if (!alive) return;
        setItems(mapped);
      } catch (e) {
        console.error(e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ dynamic options from data (so filters always match your DB)
  const locationOptions = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      const v = String(x.location || "").trim();
      if (v) set.add(v);
    });
    return ["Any location", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      const v = String(x._raw?.propertyType || "").trim();
      if (v) set.add(v);
    });
    return ["Type", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const developerOptions = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      const v = String(x.developer || "").trim();
      if (v) set.add(v);
    });
    return ["Any developer", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const completionOptions = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      if (x.completionYear) set.add(String(x.completionYear));
    });
    const years = Array.from(set).sort((a, b) => Number(a) - Number(b));
    return ["Completion Date", ...years, "2030+"];
  }, [items]);

  // ✅ Filter + sort (FIXED)
  const filtered = useMemo(() => {
    let list = [...items];

    // Location (exact match works best when options are from data)
    if (location !== "Any location") {
      list = list.filter(
        (x) => String(x.location || "").trim().toLowerCase() === location.toLowerCase()
      );
    }

    // Type
    if (type !== "Type") {
      list = list.filter((x) =>
        String(x._raw?.propertyType || "").trim().toLowerCase().includes(type.toLowerCase())
      );
    }

    // Completion (uses mapped completionYear ✅)
    if (completion !== "Completion Date") {
      if (completion === "2030+") {
        list = list.filter((x) => xNumSafe(x.completionYear) >= 2030);
      } else {
        const year = Number(completion);
        list = list.filter((x) => xNumSafe(x.completionYear) === year);
      }
    }

    // Developer (exact match)
    if (developer !== "Any developer") {
      list = list.filter(
        (x) => String(x.developer || "").trim().toLowerCase() === developer.toLowerCase()
      );
    }

    // Price range (FIXED)
    if (price !== "Price Range") {
      const inRange = (n) => {
        if (!Number.isFinite(n) || n <= 0) return false;
        if (price === "Under 1M") return n < 1_000_000;
        if (price === "1M - 3M") return n >= 1_000_000 && n <= 3_000_000;
        if (price === "3M - 7M") return n >= 3_000_000 && n <= 7_000_000;
        if (price === "7M+") return n >= 7_000_000;
        return true;
      };
      list = list.filter((x) =>
        inRange(xNumSafe(x._raw?.priceFrom ?? x._raw?.startingPrice))
      );
    }

    // optional toggles (placeholders; do not break anything)
    if (brandedOnly) {
      // if you add a field later: x._raw?.isBranded === true
    }
    if (postHandover) {
      // if you add a field later
    }
    if (downpayment !== "Any Downpayment") {
      // if you add a field later
    }

    // Sort
    if (sort === "Price: Low to High") {
      list.sort(
        (a, b) =>
          xNumSafe(a._raw?.priceFrom ?? a._raw?.startingPrice) -
          xNumSafe(b._raw?.priceFrom ?? b._raw?.startingPrice)
      );
    } else if (sort === "Price: High to Low") {
      list.sort(
        (a, b) =>
          xNumSafe(b._raw?.priceFrom ?? b._raw?.startingPrice) -
          xNumSafe(a._raw?.priceFrom ?? a._raw?.startingPrice)
      );
    } else if (sort === "Handover: Soonest") {
      list.sort((a, b) => xNumSafe(a.completionYear) - xNumSafe(b.completionYear));
    }

    return list;
  }, [
    items,
    location,
    type,
    completion,
    price,
    developer,
    brandedOnly,
    downpayment,
    postHandover,
    sort,
  ]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [location, type, completion, price, developer, brandedOnly, downpayment, postHandover, sort]);

  const goPage = (p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => {
    setLocation("Any location");
    setType("Type");
    setCompletion("Completion Date");
    setPrice("Price Range");
    setDeveloper("Any developer");
    setBrandedOnly(false);
    setDownpayment("Any Downpayment");
    setPostHandover(false);
  };

  const applyFilters = () => setFiltersOpen(false);

  return (
    <main className="op">
      <div className="op-inner">
        {/* breadcrumb */}
        <div className="op-bc">
          <span className="op-bc-strong">Aouad </span>
          <span className="op-bc-sep">›</span>
          <span className="op-bc-muted">Off-Plan</span>
        </div>

        {/* top filters row */}
        <div className="op-filters">
          <SelectPill
            icon={<FaMapMarkerAlt />}
            value={location}
            onChange={setLocation}
            options={locationOptions}
          />
          <SelectPill
            icon={<FaHome />}
            value={type}
            onChange={setType}
            options={typeOptions}
          />
          <SelectPill
            icon={<FaCalendarAlt />}
            value={completion}
            onChange={setCompletion}
            options={completionOptions}
          />
          <SelectPill
            icon={<FaTag />}
            value={price}
            onChange={setPrice}
            options={["Price Range", "Under 1M", "1M - 3M", "3M - 7M", "7M+"]}
          />

          <button className="op-more" type="button" onClick={() => setFiltersOpen(true)}>
            More Filters <FaSlidersH />
          </button>
        </div>

        {/* results row */}
        <div className="op-row">
          <div className="op-count">{loading ? "Loading..." : `Showing ${total} results`}</div>

          <div className="op-actions">
            <div className="op-sortPill">
              <span className="op-sortIcon">⇅</span>
              <select className="op-sortSel" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Handover: Soonest</option>
              </select>
              <FaChevronDown className="op-sortChev" />
            </div>

            <button className="op-map" type="button">
              <FaMapMarkedAlt /> Map View
            </button>
          </div>
        </div>

        {/* cards */}
        <section className="op-grid">
          {!loading && paged.length === 0 ? (
            <div style={{ padding: "18px 0", color: "#6b7280" }}>
              No off-plan listings found.
            </div>
          ) : (
            paged.map((p) => (
              <Link
                className="op-card"
                key={p.id}
                to={`/listing/${p.id}`}
                onClick={() => window.scrollTo(0, 0)}
                aria-label={`Open listing: ${p.title}`}
              >
                <div className="op-media">
                  <img
                    className="op-img"
                    src={p.image || "/placeholder.jpg"}
                    alt={p.title}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg";
                    }}
                  />

                  <div className="op-badges">
                    {p.featured && (
                      <div className="op-badge op-badge--featured">
                        Featured <span className="op-star">☆</span>
                      </div>
                    )}
                    {p.handover && <div className="op-badge op-badge--handover">{p.handover}</div>}
                    {p.developer && <div className="op-badge op-badge--dev">{p.developer}</div>}
                  </div>
                </div>

                <div className="op-body">
                  <h3 className="op-title">{p.title}</h3>

                  <div className="op-meta">
                    <div className="op-meta-row">
                      <FaMapMarkerAlt className="op-mini" />
                      <span>{p.location}</span>
                    </div>
                    <div className="op-meta-row">
                      <FaRegCircle className="op-mini" />
                      <span>Payment Plan: {p.paymentPlan}</span>
                    </div>
                  </div>

                  <div className="op-divider" />

                  <div className="op-bottom">
                    <div className="op-price">{p.priceAed}</div>

                    <div className="op-ctas">
                      <button
                        className="op-ico"
                        type="button"
                        aria-label="Call"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <FaPhoneAlt />
                      </button>

                      <button
                        className="op-ico"
                        type="button"
                        aria-label="WhatsApp"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <FaWhatsapp />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>

        {/* pagination */}
        {!loading && totalPages > 1 && (
          <div className="op-pager">
            <button className="op-pgArrow" onClick={() => goPage(page - 1)} disabled={page === 1}>
              ‹
            </button>

            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  className={"op-pgNum" + (n === page ? " is-active" : "")}
                  onClick={() => goPage(n)}
                >
                  {n}
                </button>
              );
            })}

            <button className="op-pgArrow" onClick={() => goPage(page + 1)} disabled={page === totalPages}>
              ›
            </button>
          </div>
        )}
      </div>

      {/* FLOATING TOP */}
      <button
        className={"op-top" + (showTop ? " is-show" : "")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <span className="op-topArrow">↑</span>
        <span className="op-topText">TOP</span>
      </button>

      {/* DRAWER */}
      <div className={"op-dim" + (filtersOpen ? " is-open" : "")} onClick={() => setFiltersOpen(false)} />

      <aside className={"op-drawer" + (filtersOpen ? " is-open" : "")} aria-hidden={!filtersOpen}>
        <div className="op-drawerTop">
          <h3 className="op-drawerTitle">All filters</h3>
          <button className="op-x" type="button" aria-label="Close" onClick={() => setFiltersOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="op-drawerBody">
          <div className="op-dgrid">
            <div className="op-field">
              <div className="op-lbl">Choose a community</div>
              <DrawerSelect value={location} onChange={setLocation} options={locationOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Choose a developer</div>
              <DrawerSelect value={developer} onChange={setDeveloper} options={developerOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Completion Date</div>
              <DrawerSelect value={completion} onChange={setCompletion} options={completionOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Development Type</div>
              <DrawerSelect value={type} onChange={setType} options={typeOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Price Range</div>
              <DrawerSelect value={price} onChange={setPrice} options={["Price Range", "Under 1M", "1M - 3M", "3M - 7M", "7M+"]} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Branded Properties</div>
              <label className="op-check">
                <input type="checkbox" checked={brandedOnly} onChange={(e) => setBrandedOnly(e.target.checked)} />
                <span>Show only branded</span>
              </label>
            </div>

            <div className="op-field">
              <div className="op-lbl">Downpayment Options</div>
              <DrawerSelect value={downpayment} onChange={setDownpayment} options={["Any Downpayment", "5%", "10%", "15%", "20%+"]} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Post Handover Payment</div>
              <label className="op-check">
                <input type="checkbox" checked={postHandover} onChange={(e) => setPostHandover(e.target.checked)} />
                <span>Post-handover payment plan</span>
              </label>
            </div>
          </div>
        </div>

        <div className="op-drawerBottom">
          <button className="op-clear" type="button" onClick={clearAll}>
            Clear all
          </button>
          <button className="op-apply" type="button" onClick={applyFilters}>
            Filter properties
          </button>
        </div>
      </aside>
    </main>
  );
}

function SelectPill({ icon, value, onChange, options }) {
  return (
    <div className="op-pill">
      <span className="op-pillFa" aria-hidden="true">
        {icon}
      </span>

      <select className="op-pillSel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <FaChevronDown className="op-pillChev" />
    </div>
  );
}

function DrawerSelect({ value, onChange, options }) {
  return (
    <div className="op-dselWrap">
      <select className="op-dsel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FaChevronDown className="op-dselChev" />
    </div>
  );
}

function xNumSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
