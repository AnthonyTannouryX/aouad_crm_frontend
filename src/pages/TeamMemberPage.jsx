// src/pages/TeamMemberPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaCheck,
  FaMapMarkerAlt,
  FaRegCircle,
  FaStar,
  FaPhoneAlt,
  FaWhatsapp,
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

function normalizeListing(p) {
  const cover =
    p?.mainImageUrl ||
    p?.coverUrl ||
    p?.image ||
    p?.images?.find?.((x) => x?.isCover)?.url ||
    p?.images?.[0]?.url ||
    "/placeholder-listing.jpg";

  const location = p?.locationLabel || p?.location || p?.area || p?.city || "-";
  const paymentPlan = p?.paymentPlan || "-";
  const developer = p?.developerName || p?.developer || p?.projectName || "";
  const handover = p?.handover || p?.completionYear || null;

  const price =
    p?.priceLabel ||
    (p?.startingPrice && p?.currency
      ? `From ${p.currency} ${Number(p.startingPrice).toLocaleString()}`
      : p?.price || "-");

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
  const memberPhone = member?.phone || "";
  const bioText = member?.bio?.trim() ? member.bio.trim() : "—";

  const languages = useMemo(() => {
    const arr = Array.isArray(member?.languages) ? member.languages : [];
    return arr.length ? arr : ["English"];
  }, [member?.languages]);

  const whatsappLink = memberPhone
    ? `https://wa.me/${memberPhone.replace(/[^\d]/g, "")}`
    : null;

  const telLink = memberPhone ? `tel:${memberPhone}` : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch agent by slug
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingMember(true);
        const res = await fetch(`${API_BASE}/public/agents/${encodeURIComponent(slug)}`);
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

  // ✅ Fetch listings for this agent (NEW stable endpoint)
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

  if (loadingMember) return null;
  if (!member) return null;

  return (
    <main className="tm">
      {/* HERO */}
      <section className="tm-hero" style={{ backgroundImage: `url(${heroImg})` }} />

      {/* CARD */}
      <section className="tm-cardWrap">
        <div className="tm-card">
          <div className="tm-topRow">
            <div className="tm-leftBlock">
              <div className="tm-avatar">
                <img
                  src={memberImg}
                  alt={memberName}
                  onError={(e) => {
                    e.currentTarget.src = avatarUrl(memberName);
                  }}
                />
              </div>

              <div className="tm-nameBlock">
                <div className="tm-langRow">
                  {languages.map((lang) => (
                    <div key={lang} className="tm-lang">
                      {lang} <FaCheck className="tm-lang-check" />
                    </div>
                  ))}
                </div>

                <h1 className="tm-name">{memberName}</h1>
                <div className="tm-role">{memberRole}</div>

                <div className="tm-contactRow">
                  {memberEmail ? (
                    <a href={`mailto:${memberEmail}`} className="tm-emailPill">
                      <FaEnvelope />
                      {memberEmail}
                    </a>
                  ) : null}

                  {telLink ? (
                    <a href={telLink} className="tm-emailPill">
                      <FaPhoneAlt />
                      {memberPhone}
                    </a>
                  ) : null}

                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="tm-emailPill"
                    >
                      <FaWhatsapp />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <p className="tm-bio">{bioText}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="tm-under">
        <div className="tm-bc">
          <span className="strong">Aouad</span>
          <span>›</span>
          <Link className="strong" to="/our-team" style={{ textDecoration: "none" }}>
            Team
          </Link>
          <span>›</span>
          <span className="muted">{memberName}</span>
        </div>
      </div>

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
                className="tm-propCard"
                style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => window.scrollTo(0, 0)}
              >
                <div className="tm-propMedia">
                  <img
                    src={p.image}
                    alt={p.title}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-listing.jpg";
                    }}
                  />

                  <div className="tm-propBadges">
                    {p.featured && (
                      <span className="tm-badge light">
                        Featured <FaStar />
                      </span>
                    )}
                    {p.handover && (
                      <span className="tm-badge dark">{p.handover}</span>
                    )}
                    {p.developer && <span className="tm-badge black">{p.developer}</span>}
                  </div>
                </div>

                <div className="tm-propBody">
                  <h3>{p.title}</h3>

                  <div className="tm-propRow">
                    <FaMapMarkerAlt />
                    {p.location}
                  </div>

                  <div className="tm-propRow">
                    <FaRegCircle />
                    Payment Plan: {p.paymentPlan}
                  </div>

                  <div className="tm-propDivider" />

                  <div className="tm-propBottom">
                    <strong>{p.price}</strong>

                    <div className="tm-propActions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          telLink && (window.location.href = telLink);
                        }}
                        title="Call"
                      >
                        <FaPhoneAlt />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          whatsappLink && window.open(whatsappLink, "_blank");
                        }}
                        title="WhatsApp"
                      >
                        <FaWhatsapp />
                      </button>
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
