// src/components/LatestOffPlanSection.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./latestOffPlanSection.css";

/* icons */
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaChevronRight,
  FaStar,
  FaMapMarkerAlt,
  FaRegCircle,
} from "react-icons/fa";

export default function LatestOffPlanSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        // ✅ PUBLIC endpoint (no token needed)
        const res = await fetch(
          "/api/public/listings?listingType=OFF_PLAN&featured=true&limit=12"
        );

        if (!res.ok) throw new Error("Failed to fetch listings");
        const data = await res.json();

        if (!alive) return;

        const list = Array.isArray(data) ? data : data.items;
        setItems(list || []);
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

  return (
    <section className="lop">
      <div className="lop-inner">
        <div className="lop-top">
          <h2 className="lop-title">LATEST OFF-PLAN PROPERTIES</h2>

          <Link
            to="/off-plan"
            className="lop-viewall"
            onClick={() => window.scrollTo(0, 0)}
          >
            View all <FaChevronRight className="lop-chev" />
          </Link>
        </div>

        {loading ? <CardsSkeleton /> : <CardsCarousel items={items} />}
      </div>
    </section>
  );
}

/* ================= SKELETON ================= */
function CardsSkeleton() {
  return (
    <div className="lop-scroll">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="lop-card" style={{ pointerEvents: "none" }}>
          <div className="lop-media" style={{ background: "#eee" }} />
          <div className="lop-body">
            <div style={{ height: 18, width: "70%", background: "#eee", borderRadius: 6 }} />
            <div style={{ height: 12, width: "50%", background: "#f0f0f0", borderRadius: 6, marginTop: 10 }} />
            <div style={{ height: 12, width: "60%", background: "#f0f0f0", borderRadius: 6, marginTop: 8 }} />
            <div className="lop-line" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ height: 14, width: 120, background: "#eee", borderRadius: 6 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 38, height: 38, background: "#eee", borderRadius: 10 }} />
                <div style={{ width: 38, height: 38, background: "#eee", borderRadius: 10 }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= CARDS CAROUSEL (SWIPE / SCROLL) ================= */
function CardsCarousel({ items }) {
  const viewportRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  const getVisibleCount = () => {
    const el = viewportRef.current;
    if (!el) return 4;
    const card = el.querySelector(".lop-card");
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

    const card = el.querySelector(".lop-card");
    if (!card) return;

    const cardW = card.getBoundingClientRect().width;
    const gap = 26; // must match CSS gap
    const step = cardW + gap;

    const nextIndex = Math.round(el.scrollLeft / step);
    setIndex(Math.max(0, Math.min(maxIndex, nextIndex)));
  };

  return (
    <>
      <div className="lop-scroll" ref={viewportRef} onScroll={onScroll}>
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/listing/${p.id}`}
            className="lop-card"
            onClick={() => window.scrollTo(0, 0)}
            aria-label={`Open listing: ${p.title}`}
          >
            <div className="lop-media">
              <img
                className="lop-img"
                src={p.mainImageUrl || ""}
                alt={p.title}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <div className="lop-badges">
                {p.featured && (
                  <div className="lop-badge lop-badge--light">
                    Featured <FaStar className="lop-star" />
                  </div>
                )}
                {p.handover && <div className="lop-badge lop-badge--dark">{p.handover}</div>}
                {p.developer && <div className="lop-badge lop-badge--black">{p.developer}</div>}
              </div>
            </div>

            <div className="lop-body">
              <h3 className="lop-card-title">{p.title}</h3>

              <div className="lop-meta">
                <div className="lop-meta-row">
                  <FaMapMarkerAlt className="lop-mini" />
                  <span>{p.location}</span>
                </div>

                <div className="lop-meta-row">
                  <FaRegCircle className="lop-mini" />
                  <span>Payment Plan: {p.paymentPlan}</span>
                </div>
              </div>

              <div className="lop-line" />

              <div className="lop-bottom">
                <span className="lop-from">
                  {p.priceFrom
                    ? `From ${p.currency || "USD"} ${Number(p.priceFrom).toLocaleString()}`
                    : ""}
                </span>

                <div className="lop-actions">
                  <button
                    className="lop-ico-btn"
                    aria-label="Call"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // later: use p.agent?.phone
                    }}
                  >
                    <FaPhoneAlt className="lop-action-ico" />
                  </button>

                  <button
                    className="lop-ico-btn"
                    aria-label="WhatsApp"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // later: use p.agent?.phone
                    }}
                  >
                    <FaWhatsapp className="lop-action-ico" />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {maxIndex > 0 && (
        <div className="lop-section-dots" aria-hidden="true">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <span
              key={i}
              className={"lop-section-dot" + (i === index ? " is-active" : "")}
            />
          ))}
        </div>
      )}
    </>
  );
}
