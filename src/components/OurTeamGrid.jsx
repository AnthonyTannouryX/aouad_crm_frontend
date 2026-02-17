import { useEffect, useState } from "react";
import "./ourTeamGrid.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export default function OurTeamGrid() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);

                const res = await fetch(`${API_BASE}/public/agents`);
                const data = await res.json().catch(() => ({}));
                if (!alive) return;

                const items = Array.isArray(data.items) ? data.items : [];

                // ✅ backend already ordered by sortOrder asc
                const mapped = items.map((a) => ({
                    id: a.id,
                    name: a.fullName || "Unnamed",
                    role: a.title || "Property Consultant",
                    img: a.photoUrl || "/placeholder-agent.jpg",
                }));

                setTeam(mapped);
            } catch (err) {
                console.error(err);
                if (alive) setTeam([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <section className="teamGrid">
            <div className="teamGrid-inner">
                <h1 className="teamGrid-title">OUR TEAM</h1>

                {loading && (
                    <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>
                        Loading...
                    </div>
                )}

                <div className="teamGrid-grid">
                    {team.map((p) => (
                        <article className="teamGrid-card" key={p.id}>
                            <div className="teamGrid-imgWrap">
                                <img
                                    className="teamGrid-img"
                                    src={p.img}
                                    alt={p.name}
                                    onError={(e) => {
                                        e.currentTarget.src = "/placeholder-agent.jpg";
                                    }}
                                />
                            </div>

                            <div className="teamGrid-meta">
                                <div className="teamGrid-name">{p.name}</div>
                                <div className="teamGrid-role">{p.role}</div>
                            </div>
                        </article>
                    ))}
                </div>

                {!loading && team.length === 0 && (
                    <div style={{ fontSize: 13, opacity: 0.6 }}>
                        No team members found.
                    </div>
                )}
            </div>
        </section>
    );
}
