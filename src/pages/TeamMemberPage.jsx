// src/pages/TeamMemberPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaCheck,
  FaMapMarkerAlt,
  FaRegCircle,
  FaStar,
  FaWhatsapp,
  FaCalendarAlt,
} from "react-icons/fa";

import "./teamMemberPage.css";
import heroImg from "../assets/carousel2.jpg";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function avatarUrl(fullName) {
  const name = fullName?.trim() ? fullName.trim() : "Agent";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0D1B2A&color=ffffff&bold=true&size=256`;
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

/* ================= NORMALIZE LISTING ================= */
function normalizeListing(p) {
  const cover =
    p?.mainImageUrl ||
    p?.coverUrl ||
    p?.image ||
    p?.images?.find?.((x) => x?.isCover)?.url ||
    p?.images?.[0]?.url ||
    "/placeholder-listing.jpg";

  const location =
    p?.locationLabel ||
    p?.location ||
    [p?.country, p?.city, p?.area].filter(Boolean).join(", ") ||
    "-";

  const paymentPlan = p?.paymentPlan || "-";
  const developer = p?.developerName || p?.developer || p?.projectName || "";
  const handover = p?.handover || p?.completionYear || null;

  const currency = p?.currency || "USD";
  const type = String(p?.listingType || p?.type || p?.category || "").toUpperCase();

  const toNum = (v) => {
    const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const pickFirstNum = (...vals) => {
    for (const v of vals) {
      const n = toNum(v);
      if (n > 0) return n;
    }
    return 0;
  };

  let price = "";

  if (p?.priceLabel && String(p.priceLabel).trim()) {
    price = String(p.priceLabel).trim();
  } else if (type === "OFF_PLAN") {
    const n = pickFirstNum(
      p?.startingPrice,
      p?.priceFrom,
      p?.startingPriceUsd,
      p?.price,
      p?.price_from,
      p?.fromPrice
    );
    price = n ? `From ${currency} ${n.toLocaleString()}` : "Price on request";
  } else if (type === "FOR_RENT") {
    const n = pickFirstNum(
      p?.monthlyPrice,
      p?.price,
      p?.rent,
      p?.rentPrice,
      p?.monthly_rent
    );
    price = n ? `${currency} ${n.toLocaleString()} / month` : "Price on request";
  } else {
    const n = pickFirstNum(
      p?.price,
      p?.salePrice,
      p?.startingPrice,
      p?.sale_price
    );
    price = n ? `${currency} ${n.toLocaleString()}` : "Price on request";
  }

  return {
    id: p.id,
    title: p.title || p.projectName || "Property",
    image: cover,
    location,
    paymentPlan,
    developer,
    handover,
    featured: !!p.featured,
    price,
  };
}

/* ================= PAGE ================= */
export default function TeamMemberPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const memberName = member?.fullName || "Team Member";
  const memberRole = member?.title || "Property Consultant";
  const memberImg = member?.photoUrl || avatarUrl(memberName);
  const memberEmail = member?.email || "";
  const memberPhoneRaw = member?.phone || member?.whatsapp || "";
  const bioText = member?.bio?.trim() ? member.bio.trim() : "—";

  const languages = useMemo(() => {
    const arr = Array.isArray(member?.languages) ? member.languages : [];
    return arr.length ? arr : ["English"];
  }, [member?.languages]);

  // ✅ whatsapp phone as digits (wa.me requires digits, no +)
  const whatsappPhone = useMemo(() => {
    const digits = String(memberPhoneRaw || "").replace(/[^\d]/g, "");
    return digits || "";
  }, [memberPhoneRaw]);

  const whatsappProfileLink = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "";

  const openWhatsapp = (message) => {
    if (!whatsappPhone) return;
    const text = encodeURIComponent(message || "");
    const url = `https://wa.me/${whatsappPhone}${text ? `?text=${text}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const agentId = member?.id || member?.agentId || member?.userId || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  /* ===== FETCH MEMBER ===== */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingMember(true);

        const res = await fetch(
          `${API_BASE}/public/agents/${encodeURIComponent(slug)}`
        );
        const data = await safeJson(res);

        if (!alive) return;

        if (!res.ok) {
          navigate("/our-team");
          return;
        }

        setMember(data.item || null);
      } catch {
        if (alive) navigate("/our-team");
      } finally {
        if (alive) setLoadingMember(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, navigate]);

  /* ===== FETCH LISTINGS ===== */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingListings(true);

        const res = await fetch(
          `${API_BASE}/public/agents/${encodeURIComponent(slug)}/listings?limit=50`
        );
        const data = await safeJson(res);

        if (!alive) return;

        if (!res.ok) {
          setListings([]);
          return;
        }

        const items = Array.isArray(data.items) ? data.items : [];
        setListings(items.map(normalizeListing));
      } catch {
        if (alive) setListings([]);
      } finally {
        if (alive) setLoadingListings(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  if (loadingMember || !member) return null;

  return (
    <main className="tm">
      {/* HERO */}
      <section
        className="tm-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      />

      {/* CARD */}
      <section className="tm-cardWrap">
        <div className="tm-card">
          <div className="tm-topRow">
            <div className="tm-leftBlock">
              <div className="tm-avatar">
                <img
                  src={memberImg}
                  alt={memberName}
                  onError={(e) => (e.currentTarget.src = avatarUrl(memberName))}
                />
              </div>

              <div className="tm-nameBlock">
                <div className="tm-langRow">
                  {languages.map((lang) => (
                    <div key={lang} className="tm-lang">
                      {lang} <FaCheck />
                    </div>
                  ))}
                </div>

                <h1 className="tm-name">{memberName}</h1>
                <div className="tm-role">{memberRole}</div>

                <div className="tm-contactRow">
                  {memberEmail && (
                    <a href={`mailto:${memberEmail}`} className="tm-emailPill">
                      <FaEnvelope /> {memberEmail}
                    </a>
                  )}

                  {whatsappPhone && (
                    <a
                      href={whatsappProfileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="tm-emailPill"
                      onClick={(e) => {
                        e.preventDefault();
                        openWhatsapp(
                          `Hi ${memberName}, I’d like to ask about your listings.`
                        );
                      }}
                    >
                      <FaWhatsapp /> Message on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="tm-bio">{bioText}</p>
        </div>
      </section>

      {/* PROPERTIES */}
      <section className="tm-props">
        <h2 className="tm-propsTitle">PROPERTIES</h2>

        {loadingListings ? (
          <div className="tm-propsEmpty">Loading properties...</div>
        ) : listings.length === 0 ? (
          <div className="tm-propsEmpty">No properties yet.</div>
        ) : (
          <div className="tm-propsGrid">
            {listings.map((p) => (
              <Link
                key={p.id}
                to={`/listing/${p.id}`}
                className="lop-card"
                onClick={() => window.scrollTo(0, 0)}
              >
                <div className="lop-media">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="lop-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-listing.jpg";
                    }}
                  />

                  <div className="lop-badges">
                    {p.featured && (
                      <div className="lop-badge lop-badge--light">
                        Featured <FaStar />
                      </div>
                    )}

                    {p.handover && (
                      <div className="lop-badge lop-badge--dark">
                        {String(p.handover).startsWith("Handover")
                          ? String(p.handover)
                          : `Handover by ${p.handover}`}
                      </div>
                    )}

                    {p.developer && (
                      <div className="lop-badge lop-badge--black">
                        {p.developer}
                      </div>
                    )}
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
                    <span className="lop-from">{p.price || "Price on request"}</span>

                    <div className="lop-actions">
                      <button
                        className="lop-ico-btn"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (!agentId) {
                            window.location.href = "/schedule-call";
                            return;
                          }

                          window.location.href = `/schedule-call?agentId=${encodeURIComponent(
                            agentId
                          )}&listingId=${encodeURIComponent(p.id)}`;
                        }}
                        aria-label="Schedule a call"
                        title="Schedule a call"
                      >
                        <FaCalendarAlt className="lop-action-ico" />
                      </button>

                      {whatsappPhone && (
                        <button
                          className="lop-ico-btn"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            openWhatsapp(
                              `Hi ${memberName}, I'm interested in "${p.title}". Can you share more details and availability?`
                            );
                          }}
                          aria-label="Message agent on WhatsApp"
                          title="Message on WhatsApp"
                        >
                          <FaWhatsapp className="lop-action-ico" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}