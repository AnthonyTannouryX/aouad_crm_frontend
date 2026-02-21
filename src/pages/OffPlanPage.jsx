// src/pages/OffPlanPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./offPlanPage.css";

import {
  FaMapMarkerAlt,
  FaChevronDown,
  FaSlidersH,
  FaTimes,
  FaTag,
  FaStar,
  FaWhatsapp,
  FaCalendarAlt,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const COUNTRY_LABELS = {
  dubai: "Dubai",
  lebanon: "Lebanon",
  "saudi-arabia": "Saudi Arabia",
  greece: "Greece",
  cyprus: "Cyprus",
  france: "France",
  spain: "Spain",
  italy: "Italy",
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function xNumSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseMoneyInput(v) {
  const s = String(v ?? "").trim();
  if (!s) return { n: NaN, has: false };
  const n = Number(s.replace(/,/g, ""));
  return { n, has: Number.isFinite(n) && n > 0 };
}

function formatPrice(p) {
  const n = p?.priceFrom ?? p?.startingPrice ?? null;
  if (n == null || n === "") return "Price on request";
  const num = Number(n);
  if (Number.isNaN(num)) return "Price on request";
  return `From ${p?.currency || "USD"} ${num.toLocaleString()}`;
}

function titleLabel(p) {
  return p?.title || p?.name || p?.projectName || p?.developer || "Off-Plan Project";
}

function handoverLabel(p) {
  const v =
    p?.handover ||
    p?.handoverDate ||
    p?.handoverYear ||
    p?.completion ||
    p?.completionDate ||
    "";
  if (!v) return "";
  return String(v);
}

export default function OffPlanPage() {
  const loc = useLocation();
  const q = useQuery();

  const country = (q.get("country") || "").trim().toLowerCase();
  const countryLabel = country ? COUNTRY_LABELS[country] || country : "";

  // ✅ Off-plan ONLY
  const listingType = "OFF_PLAN";

  // ✅ Filters (NO TYPE)
  const [locationFilter, setLocationFilter] = useState("Any location");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [developer, setDeveloper] = useState("Any developer");

  const [sort, setSort] = useState("Price: Low to High");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ✅ DATA
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  // ✅ Fetch offplan listings
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = new URL(`${API_BASE}/public/listings`);
        url.searchParams.set("limit", "200");
        if (country) url.searchParams.set("country", country);

        // force OFF_PLAN always
        url.searchParams.set("listingType", listingType);

        // If someone passes listingType in query param, ignore unless it's OFF_PLAN
        const qpListingType = (q.get("listingType") || "").trim();
        if (qpListingType && qpListingType === "OFF_PLAN") {
          url.searchParams.set("listingType", "OFF_PLAN");
        }

        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load off-plan listings");
        if (!alive) return;

        const list = Array.isArray(data) ? data : data.items;
        setRawItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setRawItems([]);
        setErr(e.message || "Failed to load off-plan listings");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, loc.search]);

  // dropdown options from data
  const locationOptions = useMemo(() => {
    const set = new Set();
    rawItems.forEach((p) => {
      const v = (p?.location || p?.community || p?.area || "").trim();
      if (v) set.add(v);
    });
    return ["Any location", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rawItems]);

  const developerOptions = useMemo(() => {
    const set = new Set();
    rawItems.forEach((p) => {
      const v = (p?.developer || p?.developerName || "").trim();
      if (v) set.add(v);
    });
    return ["Any developer", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rawItems]);

  // ✅ Filter + sort
  const filteredRaw = useMemo(() => {
    let list = [...rawItems];

    // enforce OFF_PLAN again (safety)
    list = list.filter((p) => String(p?.listingType || "").toUpperCase() === "OFF_PLAN");

    // location
    if (locationFilter !== "Any location") {
      const want = locationFilter.trim().toLowerCase();
      list = list.filter((p) => {
        const v = String(p?.location || p?.community || p?.area || "").trim().toLowerCase();
        return v === want;
      });
    }

    // developer
    if (developer !== "Any developer") {
      const want = developer.trim().toLowerCase();
      list = list.filter((p) => {
        const v = String(p?.developer || p?.developerName || "").trim().toLowerCase();
        return v === want;
      });
    }

    // typed price min/max
    const { n: min, has: hasMin } = parseMoneyInput(priceMin);
    const { n: max, has: hasMax } = parseMoneyInput(priceMax);

    if (hasMin || hasMax) {
      list = list.filter((p) => {
        const n = xNumSafe(p?.priceFrom ?? p?.startingPrice);
        if (!Number.isFinite(n) || n <= 0) return false;
        if (hasMin && n < min) return false;
        if (hasMax && n > max) return false;
        return true;
      });
    }

    // sort
    if (sort === "Price: Low to High") {
      list.sort(
        (a, b) =>
          xNumSafe(a?.priceFrom ?? a?.startingPrice) - xNumSafe(b?.priceFrom ?? b?.startingPrice)
      );
    } else if (sort === "Price: High to Low") {
      list.sort(
        (a, b) =>
          xNumSafe(b?.priceFrom ?? b?.startingPrice) - xNumSafe(a?.priceFrom ?? a?.startingPrice)
      );
    }

    return list;
  }, [rawItems, locationFilter, developer, priceMin, priceMax, sort]);

  // reset when country changes
  useEffect(() => {
    setLocationFilter("Any location");
    setPriceMin("");
    setPriceMax("");
    setDeveloper("Any developer");
    setSort("Price: Low to High");
  }, [country]);

  const clearAll = () => {
    setLocationFilter("Any location");
    setPriceMin("");
    setPriceMax("");
    setDeveloper("Any developer");
  };

  const onScheduleCall = (p, e) => {
    e.preventDefault();
    e.stopPropagation();

    const agentId = pickAgentId(p);
    const listingId = p?.id || "";

    if (!agentId) {
      window.location.href = "/schedule-call";
      return;
    }

    window.location.href = `/schedule-call?agentId=${encodeURIComponent(agentId)}&listingId=${encodeURIComponent(
      listingId
    )}`;
  };

  const onWhatsApp = (p, e) => {
    e.preventDefault();
    e.stopPropagation();

    const phone = pickAgentPhone(p);
    if (!phone) return;

    const msg = encodeURIComponent(
      `Hi, I'm interested in this property (${titleLabel(p)}). Could you please share more details?`
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="op">
      <div className="op-inner">
        {/* breadcrumb (optional) */}
        <div className="op-bc">
          <span className="op-bc-strong">Aouad Real Estate</span>
          <span className="op-bc-sep">›</span>
          <span className="op-bc-muted">Off-Plan</span>
          {countryLabel ? (
            <>
              <span className="op-bc-sep">›</span>
              <span className="op-bc-muted">{countryLabel}</span>
            </>
          ) : null}
        </div>

        {/* filters row — Location + Price + More */}
        <div className="op-filters">
          <SelectPill
            icon={<FaMapMarkerAlt />}
            value={locationFilter}
            onChange={setLocationFilter}
            options={locationOptions}
          />

          <PriceRangePill icon={<FaTag />} min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />

          <button className="op-more" type="button" onClick={() => setFiltersOpen(true)}>
            More Filters <FaSlidersH />
          </button>
        </div>

        {/* results row */}
        <div className="op-row">
          <div className="op-count">
            {loading ? "Loading..." : err ? err : `Showing ${filteredRaw.length} results`}
          </div>

          <div className="op-actions">
            <div className="op-sortPill">
              <span className="op-sortIcon">⇅</span>
              <select className="op-sortSel" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <FaChevronDown className="op-sortChev" />
            </div>
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div className="op-empty">Loading…</div>
        ) : err ? (
          <div className="op-empty">{err}</div>
        ) : filteredRaw.length === 0 ? (
          <div className="op-empty">No off-plan projects found.</div>
        ) : (
          <div className="op-grid">
            {filteredRaw.map((p) => {
              const dev = p?.developer || p?.developerName || "Developer";
              const locText = p?.location || p?.community || p?.area || "-";
              const handover = handoverLabel(p);

              const hasPhone = !!pickAgentPhone(p);

              return (
                <Link
                  key={p.id}
                  className="op-card"
                  to={`/listing/${p.id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  aria-label={`Open off-plan: ${titleLabel(p)}`}
                >
                  <div className="op-media">
                    {p?.mainImageUrl ? (
                      <img
                        className="op-img"
                        src={p.mainImageUrl}
                        alt={titleLabel(p)}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-listing.jpg";
                        }}
                      />
                    ) : (
                      <div className="op-img" style={{ background: "rgba(15,23,42,0.08)" }} />
                    )}

                    <div className="op-badges">
                      <span className="op-badge op-badge--featured">
                        <FaStar className="op-star" /> Featured
                      </span>

                      {handover ? <span className="op-badge op-badge--handover">Handover {handover}</span> : null}

                      <span className="op-badge op-badge--dev">{dev}</span>
                    </div>
                  </div>

                  <div className="op-body">
                    <div className="op-title">{titleLabel(p)}</div>

                    <div className="op-meta">
                      <div className="op-meta-row">
                        <FaMapMarkerAlt className="op-mini" />
                        <span>{locText}</span>
                      </div>
                    </div>

                    <div className="op-divider" />

                    <div className="op-bottom">
                      <div className="op-price">{formatPrice(p)}</div>

                      {/* ✅ NEW: Calendar + WhatsApp icons (like LatestOffPlanSection) */}
                      <div className="op-ctas">
                        <button
                          className="op-ico"
                          type="button"
                          aria-label="Schedule a call"
                          title="Schedule a call"
                          onClick={(e) => onScheduleCall(p, e)}
                        >
                          <FaCalendarAlt />
                        </button>

                        <button
                          className={"op-ico" + (hasPhone ? "" : " is-disabled")}
                          type="button"
                          aria-label="WhatsApp agent"
                          title={hasPhone ? "WhatsApp agent" : "WhatsApp number not set"}
                          disabled={!hasPhone}
                          onClick={(e) => onWhatsApp(p, e)}
                        >
                          <FaWhatsapp />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
              <DrawerSelect value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Choose a developer</div>
              <DrawerSelect value={developer} onChange={setDeveloper} options={developerOptions} />
            </div>

            <div className="op-field">
              <div className="op-lbl">Price Range</div>
              <div className="op-priceDrawer">
                <div className="op-priceRow">
                  <label className="op-priceLbl">Min</label>
                  <input
                    className="op-priceInp"
                    inputMode="numeric"
                    placeholder="e.g. 250000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </div>

                <div className="op-priceRow">
                  <label className="op-priceLbl">Max</label>
                  <input
                    className="op-priceInp"
                    inputMode="numeric"
                    placeholder="e.g. 1500000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="op-drawerBottom">
          <button className="op-clear" type="button" onClick={clearAll}>
            Clear all
          </button>
          <button className="op-apply" type="button" onClick={() => setFiltersOpen(false)}>
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

function PriceRangePill({ icon, min, max, onMin, onMax }) {
  const [open, setOpen] = useState(false);

  const label = (() => {
    const a = String(min || "").trim();
    const b = String(max || "").trim();
    if (!a && !b) return "Price Range";
    if (a && b) return `${a} - ${b}`;
    if (a) return `From ${a}`;
    return `Up to ${b}`;
  })();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const root = e.target.closest?.(".op-pillPrice");
      if (!root) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="op-pill op-pillPrice">
      <span className="op-pillFa" aria-hidden="true">
        {icon}
      </span>

      <button
        type="button"
        className="op-pillBtn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
      </button>

      <FaChevronDown className={"op-pillChev" + (open ? " is-open" : "")} />

      {open ? (
        <div className="op-pricePop" role="dialog" aria-label="Price range">
          <div className="op-priceRow">
            <label className="op-priceLbl">Min</label>
            <input
              className="op-priceInp"
              inputMode="numeric"
              placeholder="e.g. 250000"
              value={min}
              onChange={(e) => onMin(e.target.value)}
            />
          </div>

          <div className="op-priceRow">
            <label className="op-priceLbl">Max</label>
            <input
              className="op-priceInp"
              inputMode="numeric"
              placeholder="e.g. 1500000"
              value={max}
              onChange={(e) => onMax(e.target.value)}
            />
          </div>

          <div className="op-priceActions">
            <button
              type="button"
              className="op-priceClear"
              onClick={() => {
                onMin("");
                onMax("");
              }}
            >
              Clear
            </button>
            <button type="button" className="op-priceOk" onClick={() => setOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ===== helpers copied from your LatestOffPlanSection behavior ===== */
function pickAgentId(p) {
  return p?.assignedAgent?.id || p?.assignedAgentId || p?.agent?.id || p?.agentId || "";
}

function pickAgentPhone(p) {
  const raw =
    p?.assignedAgent?.phone ||
    p?.assignedAgent?.whatsapp ||
    p?.agent?.phone ||
    p?.agent?.whatsapp ||
    p?.agentPhone ||
    p?.whatsapp ||
    p?.phone ||
    "";

  const cleaned = String(raw).trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}