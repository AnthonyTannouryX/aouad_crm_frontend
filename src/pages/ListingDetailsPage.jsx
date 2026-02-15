// src/pages/ListingDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { FaBed, FaBath, FaCar, FaRulerCombined } from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./listingDetailsPage.css";

/**
 * Fix: default Leaflet marker icons don't load in many bundlers (Vite/CRA)
 * This makes sure the marker shows.
 */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Optional: try to force English labels by using an EN tile provider.
const TILE_URL_EN = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

export default function ListingDetailsPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // ✅ fetch listing from backend
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`/api/public/listings/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "Failed to load listing");
        if (!alive) return;

        setItem(data.item || null);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setItem(null);
        setErr(e.message || "Failed to load listing");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  // ✅ Build gallery array (cover first + rest)
  const imgs = useMemo(() => {
    if (!item) return [];
    const arr = [];

    if (item.mainImageUrl) arr.push(item.mainImageUrl);
    (item.images || []).forEach((im) => {
      if (im?.url && im.url !== item.mainImageUrl) arr.push(im.url);
    });

    return Array.from(new Set(arr));
  }, [item]);

  const main = imgs[0];
  const sideTop = imgs[1];
  const sideBottom = imgs[2];

  const breadcrumbLabel = useMemo(() => {
    const t = item?.listingType;
    if (t === "OFF_PLAN") return "Off-Plan";
    if (t === "FOR_SALE") return "For Sale";
    if (t === "FOR_RENT") return "For Rent";
    return "Listing";
  }, [item?.listingType]);

  const breadcrumbLink = useMemo(() => {
    const t = item?.listingType;
    if (t === "OFF_PLAN") return "/off-plan";
    if (t === "FOR_SALE") return "/sale";
    if (t === "FOR_RENT") return "/rent";
    return "/";
  }, [item?.listingType]);

  const open = (i) => {
    if (!imgs.length) return;
    setLbIndex(i);
    setLbOpen(true);
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    setLbOpen(false);
    document.body.style.overflow = "";
  };

  const next = () => setLbIndex((i) => (i + 1) % imgs.length);
  const prev = () => setLbIndex((i) => (i - 1 + imgs.length) % imgs.length);

  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbOpen, imgs.length]);

  const money = (n, ccy) => {
    if (n == null || n === "") return "-";
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return `${ccy || "USD"} ${num.toLocaleString()}`;
  };

  const formatSize = (it) => {
    const sqm =
      it?.sizeSqm != null && it?.sizeSqm !== "" ? Number(it.sizeSqm) : null;
    const sqft =
      it?.sizeSqft != null && it?.sizeSqft !== "" ? Number(it.sizeSqft) : null;

    const sqmOk = sqm != null && !Number.isNaN(sqm) && sqm > 0;
    const sqftOk = sqft != null && !Number.isNaN(sqft) && sqft > 0;

    if (sqmOk && sqftOk)
      return `${sqm.toLocaleString()} m² (${sqft.toLocaleString()} sqft)`;
    if (sqmOk) return `${sqm.toLocaleString()} m²`;
    if (sqftOk) return `${sqft.toLocaleString()} sqft`;
    return null;
  };

  const showFacts = useMemo(() => {
    if (!item) return false;
    return (
      item.bedrooms != null ||
      item.bathrooms != null ||
      item.parking != null ||
      item.sizeSqm != null ||
      item.sizeSqft != null
    );
  }, [item]);

  // ✅ map values
  const lat =
    item?.latitude != null && item.latitude !== "" ? Number(item.latitude) : null;
  const lng =
    item?.longitude != null && item.longitude !== ""
      ? Number(item.longitude)
      : null;
  const hasMap = Number.isFinite(lat) && Number.isFinite(lng);

  // ✅ google maps link
  const googleMapsUrl = hasMap ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  // -------- states ----------
  if (loading) {
    return (
      <section className="ld">
        <div className="ld-inner">
          <div className="ld-crumbs">Loading…</div>
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className="ld">
        <div className="ld-inner">
          <nav className="ld-crumbs">
            <Link to="/" className="ld-crumb">
              Aouad Real Estate
            </Link>
            <span className="ld-sep">›</span>
            <span className="ld-crumb ld-crumb--active">Error</span>
          </nav>

          <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
            {err}
          </div>
        </div>
      </section>
    );
  }

  if (!item) return null;

  // ✅ agent values
  const agentName = item.agent?.fullName || "Agent Name";
  const agentTitle = item.agent?.title || "Property Consultant";
  const agentPhoto =
    item.agent?.photoUrl || "https://via.placeholder.com/64x64?text=Agent";

  const sizeLabel = formatSize(item);

  return (
    <section className="ld">
      <div className="ld-inner">
        {/* ===== BREADCRUMB ===== */}
        <nav className="ld-crumbs">
          <Link to="/" className="ld-crumb">
            Aouad Real Estate
          </Link>
          <span className="ld-sep">›</span>
          <Link to={breadcrumbLink} className="ld-crumb">
            {breadcrumbLabel}
          </Link>
          <span className="ld-sep">›</span>
          <span className="ld-crumb ld-crumb--active">{item.title}</span>
        </nav>

        {/* ===== GALLERY ===== */}
        <div className="ld-gallery">
          <button
            className="ld-main"
            onClick={() => open(0)}
            type="button"
            disabled={!main}
          >
            {main ? <img src={main} alt={item.title} /> : <div className="ld-mainEmpty" />}
          </button>

          <div className="ld-side">
            {sideTop && (
              <button className="ld-thumb" onClick={() => open(1)} type="button">
                <img src={sideTop} alt="" />
              </button>
            )}

            {sideBottom && (
              <button className="ld-thumb" onClick={() => open(2)} type="button">
                <img src={sideBottom} alt="" />
                <span className="ld-pill">
                  <FaCamera />
                  +{Math.max(0, imgs.length - 2)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ===== CONTENT GRID ===== */}
        <div className="ld-content">
          {/* LEFT */}
          <div className="ld-left">
            <span className="ld-typebadge">
              {item.propertyType || item.listingType || "Property"}
            </span>

            <h1 className="ld-title">{item.title}</h1>
            <div className="ld-sub">{item.developerName || ""}</div>

            <div className="ld-from">
              {item.startingPrice
                ? `From ${money(item.startingPrice, item.currency)}`
                : "Price on request"}
            </div>

            {/* bedrooms / bathrooms / parking / size row */}
            {showFacts && (
              <div className="ld-facts">
                {item.bedrooms != null && (
                  <div className="ld-fact">
                    <FaBed className="ld-factIcon" />
                    <span className="ld-factVal">{item.bedrooms}</span>
                  </div>
                )}

                {item.bathrooms != null && (
                  <div className="ld-fact">
                    <FaBath className="ld-factIcon" />
                    <span className="ld-factVal">{item.bathrooms}</span>
                  </div>
                )}

                {item.parking != null && (
                  <div className="ld-fact">
                    <FaCar className="ld-factIcon" />
                    <span className="ld-factVal">{item.parking}</span>
                  </div>
                )}

                {sizeLabel && (
                  <div className="ld-fact">
                    <FaRulerCombined className="ld-factIcon" />
                    <span className="ld-factVal">{sizeLabel}</span>
                  </div>
                )}
              </div>
            )}

            <div className="ld-pay">
              <span className="ld-paylabel">Payment Terms:</span>
              <span className="ld-payvalue">{item.paymentPlan || "-"}</span>
              <span className="ld-paydot">i</span>
            </div>

            <a className="ld-btn" href="#" onClick={(e) => e.preventDefault()}>
              Download Brochure
            </a>

            <div className="ld-section">
              <h2 className="ld-h2">About</h2>
              <p className="ld-p">{item.description || "-"}</p>
            </div>

            <div className="ld-section">
              <h2 className="ld-h2">General information</h2>

              <div className="ld-info">
                <InfoRow label="Development type" value={item.listingType || "-"} />
                <InfoRow label="Property type" value={item.propertyType || "-"} />
                <InfoRow label="Bedrooms" value={item.bedrooms ?? "-"} />
                <InfoRow label="Bathrooms" value={item.bathrooms ?? "-"} />
                <InfoRow label="Parking" value={item.parking ?? "-"} />
                <InfoRow label="Size" value={sizeLabel || "-"} />
                <InfoRow label="Completion Date" value={item.completionYear || "-"} />
                <InfoRow label="Developer" value={item.developerName || "-"} />
                <InfoRow label="Community" value={item.community || item.area || "-"} />

                <InfoRow
                  label="Location"
                  value={
                    item.locationLabel ||
                    item.addressText ||
                    `${item.area || ""}${item.city ? `, ${item.city}` : ""}` ||
                    "-"
                  }
                />

                <InfoRow
                  label="Starting Price"
                  value={
                    item.startingPrice ? money(item.startingPrice, item.currency) : "-"
                  }
                />
              </div>
            </div>

            {/* ✅ MAP SECTION */}
            <div className="ld-section">
              <h2 className="ld-h2">Location</h2>

              {/* ✅ clickable address */}
              {item.addressText && googleMapsUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginBottom: 10, opacity: 0.8, display: "inline-block" }}
                >
                  {item.addressText}
                </a>
              ) : item.addressText ? (
                <div style={{ marginBottom: 10, opacity: 0.8 }}>{item.addressText}</div>
              ) : null}

              <div className="ld-map" style={{ overflow: "hidden", borderRadius: 14 }}>
                {hasMap ? (
                  // ✅ clickable map
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block" }}
                    aria-label="Open in Google Maps"
                    title="Open in Google Maps"
                  >
                    <MapContainer
                      center={[lat, lng]}
                      zoom={14}
                      style={{ height: 280, width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url={TILE_URL_EN}
                      />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  </a>
                ) : (
                  <div className="ld-mapEmpty">Map not set</div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT (agent card) */}
          <aside className="ld-right">
            <div className="ld-card">
              <div className="ld-agent">
                <img
                  className="ld-agentimg"
                  src={agentPhoto}
                  alt={agentName}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/64x64?text=Agent";
                  }}
                />
                <div className="ld-agentmeta">
                  <div className="ld-agentname">{agentName}</div>
                  <div className="ld-agentrole">{agentTitle}</div>
                </div>
              </div>

              <div className="ld-cardtitle">SCHEDULE A CALL</div>
              <div className="ld-cardsub">
                Fill out the form below, and one of our experts will contact you
                shortly with more details.
              </div>

              <div className="ld-divider" />

              <form className="ld-form" onSubmit={(e) => e.preventDefault()}>
                <div className="ld-row2">
                  <label className="ld-field">
                    <span>First Name *</span>
                    <input />
                  </label>
                  <label className="ld-field">
                    <span>Last Name *</span>
                    <input />
                  </label>
                </div>

                <label className="ld-field">
                  <span>Email *</span>
                  <input />
                </label>

                <label className="ld-field">
                  <span>Phone *</span>
                  <input placeholder="+971" />
                </label>

                <button className="ld-submit" type="submit">
                  Submit
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      {lbOpen && (
        <div className="lb" onClick={close}>
          <button className="lb-x" onClick={close} type="button">
            ✕
          </button>

          {imgs.length > 1 && (
            <>
              <button
                className="lb-nav lb-prev"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
              >
                ‹
              </button>
              <button
                className="lb-nav lb-next"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                ›
              </button>
            </>
          )}

          <img
            className="lb-img"
            src={imgs[lbIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="ld-info-row">
      <div className="ld-info-k">{label}</div>
      <div className="ld-info-v">{value}</div>
    </div>
  );
}
