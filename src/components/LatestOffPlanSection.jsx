// src/components/LatestOffPlanSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const PAGE_LIMIT = 12;

/**
 * IMPORTANT:
 * - Your backend already works with: listingType=FOR_SALE / FOR_RENT.
 * - OFF-PLAN might NOT be listingType in your DB.
 * So this component is built to try a few common query shapes.
 *
 * You can lock it to the correct one once you confirm which param your backend uses.
 */
export default function LatestOffPlanSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchJson(url) {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch: ${res.status}`);
      }
      return data;
    }

    function normalizeList(data) {
      const list = Array.isArray(data) ? data : data?.items;
      return Array.isArray(list) ? list : [];
    }

    async function load() {
      try {
        setLoading(true);

        // We try a few query variants because "OFF_PLAN" might not be a listingType enum in your backend.
        // The first one that returns items wins.
        const candidates = [
          // (Your original)
          `${API_BASE}/public/listings?listingType=OFF_PLAN&featured=true&limit=${PAGE_LIMIT}`,
          // Common alternate: "OFFPLAN" (no underscore)
          `${API_BASE}/public/listings?listingType=OFFPLAN&featured=true&limit=${PAGE_LIMIT}`,
          // Common alternate param names (if your backend uses project/category flags)
          `${API_BASE}/public/listings?category=OFF_PLAN&featured=true&limit=${PAGE_LIMIT}`,
          `${API_BASE}/public/listings?projectType=OFF_PLAN&featured=true&limit=${PAGE_LIMIT}`,
          `${API_BASE}/public/listings?isOffPlan=true&featured=true&limit=${PAGE_LIMIT}`,
        ];

        let list = [];
        let lastErr = null;

        for (const url of candidates) {
          try {
            const data = await fetchJson(url);
            const arr = normalizeList(data);
            if (arr.length) {
              list = arr;
              break;
            }
          } catch (e) {
            lastErr = e;
            // keep trying next candidate
          }
        }

        // If all candidates failed or returned empty, we still render empty state (no crash)
        if (!alive) return;

        setItems(list);

        // Optional: if you want to see which one worked, uncomment:
        // console.log("Off-plan loaded count:", list.length);
        // if (!list.length && lastErr) console.warn("Off-plan last error:", lastErr);
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
  }, []);

  return (
    <section className="lop">
      <div className="lop-inner">
        <div className="lop-top">
          <h2 className="lop-title">LATEST PROJECTS</h2>

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
            <div
              style={{
                height: 12,
                width: "50%",
                background: "#f0f0f0",
                borderRadius: 6,
                marginTop: 10,
              }}
            />
            <div
              style={{
                height: 12,
                width: "60%",
                background: "#f0f0f0",
                borderRadius: 6,
                marginTop: 8,
              }}
            />
            <div className="lop-line" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
            aria-label={`Open listing: ${p.title || p.location || p.id}`}
          >
            <div className="lop-media">
              {p.mainImageUrl ? (
                <img
                  className="lop-img"
                  src={p.mainImageUrl}
                  alt={p.title || "Off-plan property"}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="lop-img" style={{ background: "#eee" }} />
              )}

              <div className="lop-badges">
                {p.featured && (
                  <div className="lop-badge lop-badge--light">
                    Featured <FaStar className="lop-star" />
                  </div>
                )}
                {p.handover && (
                  <div className="lop-badge lop-badge--dark">{p.handover}</div>
                )}
                {(p.developer || p.developerName) && (
                  <div className="lop-badge lop-badge--black">
                    {p.developer || p.developerName}
                  </div>
                )}
              </div>
            </div>

            <div className="lop-body">
              <h3 className="lop-card-title">{p.title || "Off-plan Property"}</h3>

              <div className="lop-meta">
                <div className="lop-meta-row">
                  <FaMapMarkerAlt className="lop-mini" />
                  <span>
                    {p.location || [p.country, p.city, p.area].filter(Boolean).join(", ") || "-"}
                  </span>
                </div>

                <div className="lop-meta-row">
                  <FaRegCircle className="lop-mini" />
                  <span>Payment Plan: {p.paymentPlan || "-"}</span>
                </div>
              </div>

              <div className="lop-line" />

              <div className="lop-bottom">
                <span className="lop-from">
                  {formatFromPrice(p)}
                </span>

                <div className="lop-actions">
                  <button
                    className="lop-ico-btn"
                    aria-label="Call"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: wire phone (p.agent?.phone or p.phone)
                      // Example:
                      // const phone = (p.agent?.phone || p.phone || "").replace(/\s+/g, "");
                      // if (phone) window.location.href = `tel:${phone}`;
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
                      // TODO: wire whatsapp (p.agent?.phone or p.phone)
                      // Example:
                      // const phone = (p.agent?.phone || p.phone || "").replace(/[^\d+]/g, "");
                      // const msg = encodeURIComponent(`Hi, I'm interested in ${p.title || "this off-plan property"}.`);
                      // if (phone) window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
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
            <span key={i} className={"lop-section-dot" + (i === index ? " is-active" : "")} />
          ))}
        </div>
      )}
    </>
  );
}

/* ================= helpers ================= */
function formatFromPrice(p) {
  const cur = p.currency || "USD";
  const n = Number(p.priceFrom ?? p.startingPrice ?? p.price ?? 0) || 0;
  if (!n) return "";
  return `From ${cur} ${n.toLocaleString()}`;
}
