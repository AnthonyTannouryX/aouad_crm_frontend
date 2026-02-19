import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./latestListingsSection.css";

import {
  FaChevronDown,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaCar,
  FaRulerCombined,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const RANDOM_COUNT = 9;

/* ================= helpers ================= */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPrice(p) {
  const cur = p.currency || "AED";
  const n =
    Number(p.startingPrice ?? p.price ?? p.priceFrom ?? 0) || 0;
  if (!n) return "";
  return `${cur} ${n.toLocaleString()}`;
}

// mode: "all" | "rent" | "sale"
export default function LatestListingsSection({ mode = "all" }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // dropdown state
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);

  // close dropdown on outside click + ESC
  useEffect(() => {
    const onDown = (e) => {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target)) setDdOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setDdOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const onPick = (value) => {
    setDdOpen(false);
    if (value === "For Rent") navigate("/rent");
    if (value === "For Sale") navigate("/sale");
  };

  const title =
    mode === "rent"
      ? "FOR RENT"
      : mode === "sale"
        ? "FOR SALE"
        : "LATEST LISTINGS";

  /* ================= FETCH ================= */
  useEffect(() => {
    let alive = true;

    async function fetchType(listingType) {
      const qs = new URLSearchParams();
      qs.set("listingType", listingType);
      qs.set("limit", "200"); // fetch enough to randomize

      const res = await fetch(`${API_BASE}/public/listings?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Fetch failed");

      const list = Array.isArray(data) ? data : data.items;
      return Array.isArray(list) ? list : [];
    }

    async function load() {
      try {
        setLoading(true);

        let merged = [];

        if (mode === "sale") {
          merged = await fetchType("FOR_SALE");
        } else if (mode === "rent") {
          merged = await fetchType("FOR_RENT");
        } else {
          const [sale, rent] = await Promise.all([
            fetchType("FOR_SALE"),
            fetchType("FOR_RENT"),
          ]);
          merged = [...sale, ...rent];
        }

        // 🔀 RANDOM 9
        const random9 = shuffleArray(merged).slice(0, RANDOM_COUNT);

        // ✅ map backend → UI
        const mapped = random9.map((p) => ({
          id: p.id,

          name:
            p.title ||
            p.name ||
            p.projectName ||
            p.propertyName ||
            p.listingTitle ||
            "Property",

          developer: p.developer || p.developerName || "",

          type: p.propertyTypeLabel || p.propertyType || "Property",
          status: p.listingType === "FOR_RENT" ? "For Rent" : "For Sale",
          price: p.priceLabel || formatPrice(p),

          location:
            p.location ||
            [p.country, p.city, p.area].filter(Boolean).join(", ") ||
            "-",

          beds: p.bedrooms ?? "-",
          baths: p.bathrooms ?? "-",
          parking: p.parking ?? "-",

          area: p.sizeSqft
            ? `${p.sizeSqft} sq.ft`
            : p.sizeSqm
              ? `${p.sizeSqm} sqm`
              : "-",

          img: p.mainImageUrl || p.coverImageUrl || "",
        }));

        if (!alive) return;
        setItems(mapped);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [mode]);

  return (
    <section className="ll">
      <div className="ll-inner">
        <div className="ll-top">
          <h2 className="lop-title">{title}</h2>

          {/* View All dropdown */}
          <div className={"ll-dd" + (ddOpen ? " is-open" : "")} ref={ddRef}>
            <button
              className="ll-viewall"
              type="button"
              aria-haspopup="menu"
              aria-expanded={ddOpen}
              onClick={() => setDdOpen((v) => !v)}
            >
              View All <FaChevronDown className="ll-chev" />
            </button>

            <div className="ll-menu" role="menu" aria-hidden={!ddOpen}>
              <button className="ll-menuItem" onClick={() => onPick("For Rent")}>
                For Rent
              </button>
              <div className="ll-menuDivider" />
              <button className="ll-menuItem" onClick={() => onPick("For Sale")}>
                For Sale
              </button>
            </div>
          </div>
        </div>

        {loading ? <CardsSkeleton /> : <CardsCarousel items={items} />}
      </div>
    </section>
  );
}

/* ================= SKELETON ================= */
function CardsSkeleton() {
  return (
    <div className="ll-scroll">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ll-card" style={{ pointerEvents: "none" }}>
          <div className="ll-media" style={{ background: "#eee", height: 230 }} />
          <div className="ll-body">
            <div style={{ height: 18, width: "55%", background: "#eee", borderRadius: 6 }} />
            <div style={{ height: 12, width: "85%", background: "#f0f0f0", borderRadius: 6, marginTop: 10 }} />
            <div style={{ height: 1, width: "100%", background: "#eee", margin: "14px 0" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= CARDS CAROUSEL ================= */
function CardsCarousel({ items }) {
  const viewportRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  const getVisibleCount = () => {
    const el = viewportRef.current;
    if (!el) return 4;
    const card = el.querySelector(".ll-card");
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

    const card = el.querySelector(".ll-card");
    if (!card) return;

    const gap = 26;
    const step = card.getBoundingClientRect().width + gap;
    const nextIndex = Math.round(el.scrollLeft / step);
    setIndex(Math.max(0, Math.min(maxIndex, nextIndex)));
  };

  return (
    <>
      <div className="ll-scroll" ref={viewportRef} onScroll={onScroll}>
        {items.map((x) => (
          <Link
            key={x.id}
            className="ll-card"
            to={`/listing/${x.id}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="ll-media">
              {x.img ? <img className="ll-img" src={x.img} alt={x.name} /> : <div className="ll-img" style={{ background: "#eee" }} />}
              <div className="ll-tags">
                <span className="ll-tag ll-tag--black">{x.name}</span>
                {x.developer && <span className="ll-tag ll-tag--light">{x.developer}</span>}
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
                <div className="ll-spec"><FaBed /> {x.beds}</div>
                <div className="ll-spec"><FaBath /> {x.baths}</div>
                <div className="ll-spec"><FaCar /> {x.parking}</div>
                <div className="ll-spec ll-spec--area">
                  <FaRulerCombined /> {x.area}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {maxIndex > 0 && (
        <div className="ll-section-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <span key={i} className={"ll-section-dot" + (i === index ? " is-active" : "")} />
          ))}
        </div>
      )}
    </>
  );
}
