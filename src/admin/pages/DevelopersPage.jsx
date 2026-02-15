import { useMemo, useState } from "react";

export default function DevelopersPage() {
    // TEMP mock data (replace with API later)
    const [items, setItems] = useState([
        { id: "dev_1", name: "Emaar", country: "UAE", website: "https://www.emaar.com" },
        { id: "dev_2", name: "DAMAC", country: "UAE", website: "https://www.damacproperties.com" },
    ]);

    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return items;
        return items.filter((d) => {
            const hay = `${d.name || ""} ${d.country || ""} ${d.website || ""}`.toLowerCase();
            return hay.includes(qq);
        });
    }, [items, q]);

    return (
        <div className="adm-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Developers</div>
                    <div className="adm-muted">Manage developers (add/edit/delete)</div>
                </div>

                <input
                    className="adm-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search developers…"
                    style={{ maxWidth: 320 }}
                />
            </div>

            <div className="adm-tableWrap" style={{ marginTop: 16 }}>
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th className="adm-th">Name</th>
                            <th className="adm-th">Country</th>
                            <th className="adm-th">Website</th>
                            <th className="adm-th" style={{ width: 140 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((d) => (
                            <tr key={d.id} className="adm-row">
                                <td className="adm-td" style={{ fontWeight: 800 }}>{d.name}</td>
                                <td className="adm-td">{d.country || "—"}</td>
                                <td className="adm-td">
                                    {d.website ? (
                                        <a href={d.website} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                                            {d.website}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                                <td className="adm-td" style={{ textAlign: "right" }}>
                                    <button
                                        className="adm-btn"
                                        type="button"
                                        onClick={() => {
                                            if (!confirm(`Delete ${d.name}?`)) return;
                                            setItems((prev) => prev.filter((x) => x.id !== d.id));
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filtered.length === 0 ? (
                            <tr>
                                <td className="adm-td" colSpan={4}>
                                    <span className="adm-muted">No developers found.</span>
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
