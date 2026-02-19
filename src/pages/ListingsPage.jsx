// src/pages/ListingsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./listingsPage.css";

import {
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaCar,
  FaRulerCombined,
  FaChevronDown,
  FaSlidersH,
  FaTimes,
  FaHome,
  FaTag,
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

function formatPrice(p) {
  const n = p?.priceFrom ?? p?.startingPrice ?? null;
  if (n == null || n === "") return "Price on request";
  const num = Number(n);
  if (Number.isNaN(num)) return "Price on request";
  return `From ${p?.currency || "USD"} ${num.toLocaleString()}`;
}

function areaLabel(p) {
  if (p?.sizeSqm != null && p.sizeSqm !== "") {
    const n = Number(p.sizeSqm);
    if (!Number.isNaN(n) && n > 0) return `${n.toLocaleString()} m²`;
  }
  if (p?.sizeSqft != null && p.sizeSqft !== "") {
    const n = Number(p.sizeSqft);
    if (!Number.isNaN(n) && n > 0) return `${n.toLocaleString()} sq.ft`;
  }
  return "-";
}

function typeLabel(p) {
  return p?.propertyType || "Property";
}

function statusLabel(p) {
  if (p?.listingType === "FOR_RENT") return "For Rent";
  if (p?.listingType === "FOR_SALE") return "For Sale";
  if (p?.listingType === "OFF_PLAN") return "Off-Plan";
  return "Listing";
}

export default function ListingsPage() {
  const loc = useLocation();
  const q = useQuery();

  const country = (q.get("country") || "").trim().toLowerCase();
  const countryLabel = country ? COUNTRY_LABELS[country] || country : "";

  // ✅ decide which listings to show based on route
  // /rent => FOR_RENT, /sale => FOR_SALE, otherwise all
  const listingType = useMemo(() => {
    if (loc.pathname === "/rent") return "FOR_RENT";
    if (loc.pathname === "/sale") return "FOR_SALE";
    return null;
  }, [loc.pathname]);

  const pageTitle = useMemo(() => {
    const base =
      listingType === "FOR_RENT"
        ? "FOR RENT"
        : listingType === "FOR_SALE"
          ? "FOR SALE"
          : "LISTINGS";
    return base;
  }, [listingType]);

  // ✅ Filters
  const [locationFilter, setLocationFilter] = useState("Any location");
  const [typeFilter, setTypeFilter] = useState("Type");

  // ✅ Custom typed range
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [sort, setSort] = useState("Recommended");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [developer, setDeveloper] = useState("Any developer");

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

  // ✅ Fetch listings from public endpoint
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = new URL(`${API_BASE}/public/listings`);
        url.searchParams.set("limit", "100");
        if (country) url.searchParams.set("country", country);
        if (listingType) url.searchParams.set("listingType", listingType);

        // Optional: if you pass listingType in query param from hero/navbar, support it too
        const qpListingType = (q.get("listingType") || "").trim();
        if (qpListingType) url.searchParams.set("listingType", qpListingType);

        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load listings");
        if (!alive) return;

        const list = Array.isArray(data) ? data : data.items;
        setRawItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setRawItems([]);
        setErr(e.message || "Failed to load listings");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, listingType, loc.search]);

  // Build dropdown options dynamically from data
  const locationOptions = useMemo(() => {
    const set = new Set();
    rawItems.forEach((p) => {
      const v = (p?.location || "").trim();
      if (v) set.add(v);
    });
    return ["Any location", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rawItems]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    rawItems.forEach((p) => {
      const v = (p?.propertyType || "").trim();
      if (v) set.add(v);
    });
    return ["Type", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
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

    // location
    if (locationFilter !== "Any location") {
      list = list.filter(
        (p) =>
          String(p?.location || "")
            .trim()
            .toLowerCase() === locationFilter.toLowerCase()
      );
    }

    // type
    if (typeFilter !== "Type") {
      list = list.filter(
        (p) =>
          String(p?.propertyType || "")
            .trim()
            .toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // developer
    if (developer !== "Any developer") {
      list = list.filter((p) => {
        const d = String(p?.developer || p?.developerName || "")
          .trim()
          .toLowerCase();
        return d === developer.toLowerCase();
      });
    }

    // ✅ price min/max (typed)
    const min = Number(String(priceMin || "").replace(/,/g, ""));
    const max = Number(String(priceMax || "").replace(/,/g, ""));

    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;

    if (hasMin || hasMax) {
      list = list.filter((p) => {
        const n = xNumSafe(p?.priceFrom ?? p?.startingPrice);
        if (!Number.isFinite(n) || n <= 0) return false; // "price on request" excluded when filtering
        if (hasMin && n < min) return false;
        if (hasMax && n > max) return false;
        return true;
      });
    }

    // sort
    if (sort === "Price: Low to High") {
      list.sort(
        (a, b) =>
          xNumSafe(a?.priceFrom ?? a?.startingPrice) -
          xNumSafe(b?.priceFrom ?? b?.startingPrice)
      );
    } else if (sort === "Price: High to Low") {
      list.sort(
        (a, b) =>
          xNumSafe(b?.priceFrom ?? b?.startingPrice) -
          xNumSafe(a?.priceFrom ?? a?.startingPrice)
      );
    }

    return list;
  }, [rawItems, locationFilter, typeFilter, developer, priceMin, priceMax, sort]);

  // ✅ Map to card shape (NO carousel dots)
  const items = useMemo(() => {
    return filteredRaw.map((p) => ({
      id: p.id,
      brand:
        p.title ||
        p.name ||
        p.projectName ||
        p.propertyName ||
        p.listingTitle ||
        p.meta?.title ||
        "Property",
      type: typeLabel(p),
      status: statusLabel(p),
      price: formatPrice(p),
      location: p.location || "-",
      beds: p.bedrooms ?? "-",
      baths: p.bathrooms ?? "-",
      parking: p.parking ?? "-",
      area: areaLabel(p),
      img: p.mainImageUrl || "",
    }));
  }, [filteredRaw]);

  // reset filters when switching base route/country
  useEffect(() => {
    setLocationFilter("Any location");
    setTypeFilter("Type");
    setPriceMin("");
    setPriceMax("");
    setDeveloper("Any developer");
    setSort("Recommended");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingType, country]);

  const clearAll = () => {
    setLocationFilter("Any location");
    setTypeFilter("Type");
    setPriceMin("");
    setPriceMax("");
    setDeveloper("Any developer");
  };

  const applyFilters = () => setFiltersOpen(false);

  return (
    <main className="lp2">
      <div className="lp2-inner">
        {/* title */}
        <div className="lp2-top">
          <h1 className="lp2-title">
            {pageTitle}{" "}
            {countryLabel ? <span className="lp2-sub">— {countryLabel}</span> : null}
          </h1>
        </div>

        {/* filters row */}
        <div className="lp2-filters">
          <SelectPill
            icon={<FaMapMarkerAlt />}
            value={locationFilter}
            onChange={setLocationFilter}
            options={locationOptions}
          />

          <SelectPill
            icon={<FaHome />}
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
          />

          {/* ✅ custom price range dropdown */}
          <PriceRangePill
            icon={<FaTag />}
            min={priceMin}
            max={priceMax}
            onMin={setPriceMin}
            onMax={setPriceMax}
          />

          <button className="lp2-more" type="button" onClick={() => setFiltersOpen(true)}>
            More Filters <FaSlidersH />
          </button>
        </div>

        {/* results row */}
        <div className="lp2-row">
          <div className="lp2-count">
            {loading ? "Loading..." : err ? err : `Showing ${items.length} results`}
          </div>

          <div className="lp2-actions">
            <div className="lp2-sortPill">
              <span className="lp2-sortIcon">⇅</span>
              <select
                className="lp2-sortSel"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <FaChevronDown className="lp2-sortChev" />
            </div>
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div className="lp2-empty">Loading…</div>
        ) : err ? (
          <div className="lp2-empty">{err}</div>
        ) : items.length === 0 ? (
          <div className="lp2-empty">No listings found.</div>
        ) : (
          <div className="lp2-grid">
            {items.map((x) => (
              <Link
                className="ll-card"
                key={x.id}
                to={`/listing/${x.id}`}
                onClick={() => window.scrollTo(0, 0)}
                aria-label={`Open listing: ${x.location}`}
              >
                <div className="ll-media">
                  {x.img ? (
                    <img
                      className="ll-img"
                      src={x.img}
                      alt={x.location}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-listing.jpg";
                      }}
                    />
                  ) : (
                    <div className="ll-img" style={{ background: "#eee" }} />
                  )}

                  {/* ✅ NO watermark circles, NO carousel dots */}
                  <div className="ll-tags">
                    <span className="ll-tag ll-tag--black">{x.brand}</span>
                    <span className="ll-tag ll-tag--light">{x.type}</span>
                    <span className="ll-tag ll-tag--gray">{x.status}</span>
                  </div>
                </div>

                <div className="ll-body">
                  <div className="ll-price">{x.price}</div>

                  <div className="ll-loc">
                    <FaMapMarkerAlt className="ll-pin" />
                    <span>{x.location}</span>
                  </div>

                  <div className="ll-line" />

                  <div className="ll-specs">
                    <div className="ll-spec">
                      <FaBed className="ll-ico" />
                      <span>{x.beds}</span>
                    </div>
                    <div className="ll-spec">
                      <FaBath className="ll-ico" />
                      <span>{x.baths}</span>
                    </div>
                    <div className="ll-spec">
                      <FaCar className="ll-ico" />
                      <span>{x.parking}</span>
                    </div>
                    <div className="ll-spec ll-spec--area">
                      <FaRulerCombined className="ll-ico" />
                      <span>{x.area}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* DRAWER */}
      <div
        className={"lp2-dim" + (filtersOpen ? " is-open" : "")}
        onClick={() => setFiltersOpen(false)}
      />

      <aside className={"lp2-drawer" + (filtersOpen ? " is-open" : "")} aria-hidden={!filtersOpen}>
        <div className="lp2-drawerTop">
          <h3 className="lp2-drawerTitle">All filters</h3>
          <button
            className="lp2-x"
            type="button"
            aria-label="Close"
            onClick={() => setFiltersOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="lp2-drawerBody">
          <div className="lp2-dgrid">
            <div className="lp2-field">
              <div className="lp2-lbl">Choose a community</div>
              <DrawerSelect value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
            </div>

            <div className="lp2-field">
              <div className="lp2-lbl">Development Type</div>
              <DrawerSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
            </div>

            <div className="lp2-field">
              <div className="lp2-lbl">Choose a developer</div>
              <DrawerSelect value={developer} onChange={setDeveloper} options={developerOptions} />
            </div>

            {/* ✅ Drawer custom price */}
            <div className="lp2-field">
              <div className="lp2-lbl">Price Range</div>
              <div className="lp2-priceDrawer">
                <div className="lp2-priceRow">
                  <label className="lp2-priceLbl">Min</label>
                  <input
                    className="lp2-priceInp"
                    inputMode="numeric"
                    placeholder="e.g. 250000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </div>

                <div className="lp2-priceRow">
                  <label className="lp2-priceLbl">Max</label>
                  <input
                    className="lp2-priceInp"
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

        <div className="lp2-drawerBottom">
          <button className="lp2-clear" type="button" onClick={clearAll}>
            Clear all
          </button>
          <button className="lp2-apply" type="button" onClick={applyFilters}>
            Filter properties
          </button>
        </div>
      </aside>
    </main>
  );
}

function SelectPill({ icon, value, onChange, options }) {
  return (
    <div className="lp2-pill">
      <span className="lp2-pillFa" aria-hidden="true">
        {icon}
      </span>

      <select className="lp2-pillSel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <FaChevronDown className="lp2-pillChev" />
    </div>
  );
}

function DrawerSelect({ value, onChange, options }) {
  return (
    <div className="lp2-dselWrap">
      <select className="lp2-dsel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FaChevronDown className="lp2-dselChev" />
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

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const root = e.target.closest?.(".lp2-pillPrice");
      if (!root) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="lp2-pill lp2-pillPrice">
      <span className="lp2-pillFa" aria-hidden="true">
        {icon}
      </span>

      <button
        type="button"
        className="lp2-pillBtn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
      </button>

      <FaChevronDown className={"lp2-pillChev" + (open ? " is-open" : "")} />

      {open ? (
        <div className="lp2-pricePop" role="dialog" aria-label="Price range">
          <div className="lp2-priceRow">
            <label className="lp2-priceLbl">Min</label>
            <input
              className="lp2-priceInp"
              inputMode="numeric"
              placeholder="e.g. 250000"
              value={min}
              onChange={(e) => onMin(e.target.value)}
            />
          </div>

          <div className="lp2-priceRow">
            <label className="lp2-priceLbl">Max</label>
            <input
              className="lp2-priceInp"
              inputMode="numeric"
              placeholder="e.g. 1500000"
              value={max}
              onChange={(e) => onMax(e.target.value)}
            />
          </div>

          <div className="lp2-priceActions">
            <button
              type="button"
              className="lp2-priceClear"
              onClick={() => {
                onMin("");
                onMax("");
              }}
            >
            </button>
            <button type="button" className="lp2-priceOk" onClick={() => setOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
