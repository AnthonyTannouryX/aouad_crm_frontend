import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./ourTeam.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getCardsPerPage() {
  const w = window.innerWidth;
  if (w > 1020) return 4;
  if (w > 780) return 3;
  return 2; // 2 per slide on mobile
}

export default function OurTeam() {
  const trackRef = useRef(null);

  const [cardsPerPage, setCardsPerPage] = useState(() =>
    typeof window !== "undefined" ? getCardsPerPage() : 4
  );
  const [activePage, setActivePage] = useState(0);

  const [team, setTeam] = useState([]); // ✅ fetched from backend
  const [loading, setLoading] = useState(true);

  // ✅ fetch team from backend (PUBLIC)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/public/agents`);
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        const items = Array.isArray(data.items) ? data.items : [];

        // Map backend -> your existing shape
        const mapped = items.map((a) => ({
          slug: a.slug || String(a.id), // slug preferred; fallback to id
          name: a.fullName || "Unnamed",
          role: a.title || "Property Consultant",
          img: a.photoUrl || "/placeholder-agent.jpg",
          hero: "dubai",
        }));

        setTeam(mapped);
      } catch {
        if (alive) setTeam([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(team.length / cardsPerPage));
  }, [team.length, cardsPerPage]);

  useEffect(() => {
    const onResize = () => setCardsPerPage(getCardsPerPage());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const page = Math.round(el.scrollLeft / el.clientWidth);
        setActivePage(Math.max(0, Math.min(page, pageCount - 1)));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [pageCount]);

  const scrollToPage = (pageIdx) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: pageIdx * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="team">
      <div className="team-inner">
        <h2 className="team-title">OUR TEAM</h2>

        {loading && (
          <div style={{ fontSize: 13, color: "rgba(0,0,0,0.55)", marginBottom: 10 }}>
            Loading...
          </div>
        )}

        <div className="tcar-track" ref={trackRef} aria-label="Team carousel">
          {team.map((p) => (
            <Link
              className="tcar-card"
              key={p.slug}
              to={`/team/${p.slug}`}
              onClick={() => window.scrollTo(0, 0)}
              aria-label={`Open team member: ${p.name}`}
            >
              <div className="tcar-imgWrap">
                <img className="tcar-img" src={p.img} alt={p.name} />
              </div>

              <div className="tcar-meta">
                <div className="tcar-name">{p.name}</div>
                <div className="tcar-role">{p.role}</div>
              </div>
            </Link>
          ))}
        </div>

        {pageCount > 1 && (
          <div className="tcar-dots" aria-label="Carousel pagination">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`tcar-dot ${i === activePage ? "is-active" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activePage ? "true" : "false"}
                onClick={() => scrollToPage(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
