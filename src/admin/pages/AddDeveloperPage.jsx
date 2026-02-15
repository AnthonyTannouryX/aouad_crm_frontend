// src/admin/pages/AddDeveloperPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./developersAdmin.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function tokenOrThrow() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing token. Please login again.");
    return token;
}

function cx(...a) {
    return a.filter(Boolean).join(" ");
}

function fmtUrl(u) {
    const s = String(u || "").trim();
    if (!s) return "";
    return s;
}

export default function AddDeveloperPage() {
    const fileRef = useRef(null);

    // list
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // search
    const [q, setQ] = useState("");

    // modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState("");

    const [logoFile, setLogoFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        website: "",
        isFeatured: true,
        featuredOrder: 0,
    });

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((x) => {
            const hay = `${x?.name || ""} ${x?.description || ""} ${x?.website || ""}`.toLowerCase();
            return hay.includes(s);
        });
    }, [items, q]);

    const canSave = useMemo(() => {
        return (
            form.name.trim().length >= 2 &&
            form.description.trim().length >= 2 &&
            !!logoFile &&
            !saving
        );
    }, [form, logoFile, saving]);

    const set = (key) => (e) => {
        const v =
            e?.target?.type === "checkbox"
                ? e.target.checked
                : e?.target?.value;
        setForm((p) => ({ ...p, [key]: v }));
    };

    async function loadDevelopers() {
        setLoading(true);
        setErr("");
        try {
            const token = tokenOrThrow();
            const url = `${API_BASE}/admin/developers${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to load developers");
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            console.error(e);
            setItems([]);
            setErr(e.message || "Failed to load developers");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDevelopers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // reload list when q changes (debounced)
    useEffect(() => {
        const t = setTimeout(() => loadDevelopers(), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    function openCreate() {
        setFormErr("");
        setLogoFile(null);
        setPreview(null);
        setForm({
            name: "",
            description: "",
            website: "",
            isFeatured: true,
            featuredOrder: 0,
        });
        setOpen(true);
    }

    function closeCreate() {
        if (saving) return;
        setOpen(false);
    }

    function onPickLogo() {
        fileRef.current?.click();
    }

    function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setPreview(URL.createObjectURL(file));
    }

    async function onCreate(e) {
        e.preventDefault();
        if (!canSave) return;

        setSaving(true);
        setFormErr("");

        try {
            const token = tokenOrThrow();
            const fd = new FormData();
            fd.append("name", form.name.trim());
            fd.append("description", form.description.trim());
            if (fmtUrl(form.website)) fd.append("website", fmtUrl(form.website));
            fd.append("isFeatured", String(!!form.isFeatured));
            fd.append("featuredOrder", String(Number(form.featuredOrder) || 0));
            fd.append("logo", logoFile); // ✅ must match upload.single("logo")

            const res = await fetch(`${API_BASE}/admin/developers`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to create developer");

            const created = data?.item || data;

            setItems((prev) => [created, ...prev].filter(Boolean));
            setOpen(false);
        } catch (e2) {
            console.error(e2);
            setFormErr(e2.message || "Failed to create developer");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id) {
        if (!id) return;
        const ok = confirm("Delete this developer?");
        if (!ok) return;

        try {
            const token = tokenOrThrow();
            const res = await fetch(`${API_BASE}/admin/developers/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to delete developer");
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            alert(e.message || "Failed to delete developer");
        }
    }

    // ESC closes modal
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape" && open) closeCreate();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, saving]);

    return (
        <div className="devAdm">
            {/* Topbar */}
            <div className="devAdm-topbar">
                <div className="devAdm-titleWrap">
                    <div className="devAdm-title">Developers</div>
                    <div className="devAdm-sub">Manage featured developers shown on the homepage.</div>
                </div>

                <div className="devAdm-spacer" />

                <div className="devAdm-searchWrap">
                    <input
                        className="devAdm-search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search developers…"
                    />
                </div>

                <button className="devAdm-btnGhost" type="button" onClick={loadDevelopers} disabled={loading}>
                    {loading ? "Loading…" : "Refresh"}
                </button>

                <button className="devAdm-btnPrimary" type="button" onClick={openCreate}>
                    + Add Developer
                </button>
            </div>

            {/* Body */}
            <div className="devAdm-card">
                {err ? <div className="devAdm-err">{err}</div> : null}

                {loading ? (
                    <div className="devAdm-muted">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="devAdm-muted">No developers found.</div>
                ) : (
                    <div className="devAdm-grid">
                        {filtered.map((d) => (
                            <article className="devCard" key={d.id}>
                                <div className="devCard-top">
                                    <div className="devCard-logo">
                                        {d.logoUrl ? <img src={d.logoUrl} alt={d.name} loading="lazy" /> : <div className="devCard-logoPh" />}
                                    </div>

                                    <div className="devCard-meta">
                                        <div className="devCard-name">{d.name || "Developer"}</div>
                                        <div className="devCard-badges">
                                            <span className={cx("devBadge", d.isFeatured ? "is-on" : "is-off")}>
                                                {d.isFeatured ? "FEATURED" : "HIDDEN"}
                                            </span>
                                            <span className="devBadge devBadge--soft">Order: {Number(d.featuredOrder) || 0}</span>
                                        </div>
                                    </div>

                                    <div className="devCard-actions">
                                        {d.website ? (
                                            <a className="devIconBtn" href={d.website} target="_blank" rel="noreferrer" title="Open website">
                                                ↗
                                            </a>
                                        ) : (
                                            <button className="devIconBtn is-disabled" type="button" disabled title="No website">
                                                ↗
                                            </button>
                                        )}
                                        <button className="devIconBtn danger" type="button" onClick={() => onDelete(d.id)} title="Delete">
                                            🗑
                                        </button>
                                    </div>
                                </div>

                                <p className="devCard-desc">{d.description || "-"}</p>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            {open && (
                <div className="devModalOverlay" onClick={closeCreate} role="presentation">
                    <div className="devModal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="devModal-top">
                            <div>
                                <div className="devModal-title">Add Developer</div>
                                <div className="devModal-sub">Upload logo, write description, set featured order.</div>
                            </div>
                            <button className="devAdm-btnGhost" type="button" onClick={closeCreate} disabled={saving}>
                                Close
                            </button>
                        </div>

                        {formErr ? <div className="devAdm-err">{formErr}</div> : null}

                        <form onSubmit={onCreate} className="devForm">
                            <div className="devForm-grid">
                                <label className="devField">
                                    <div className="devLabel">Developer Name *</div>
                                    <input
                                        className="devInput"
                                        value={form.name}
                                        onChange={set("name")}
                                        placeholder="Emaar, DAMAC, Sobha..."
                                    />
                                </label>

                                <label className="devField">
                                    <div className="devLabel">Website (optional)</div>
                                    <input
                                        className="devInput"
                                        value={form.website}
                                        onChange={set("website")}
                                        placeholder="https://developer.com"
                                    />
                                </label>

                                <div className="devLogoBox">
                                    <div className="devLabel">Logo *</div>

                                    <button className="devDrop" type="button" onClick={onPickLogo}>
                                        <div className="devDrop-inner">
                                            {preview ? (
                                                <img src={preview} alt="Preview" />
                                            ) : (
                                                <div className="devDrop-ph">
                                                    <div className="devDrop-phIcon">⬆</div>
                                                    <div className="devDrop-phText">Click to upload logo</div>
                                                    <div className="devDrop-phHint">PNG / JPG / WEBP</div>
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={onFileChange}
                                    />
                                </div>

                                <label className="devField devSpan2">
                                    <div className="devLabel">Description *</div>
                                    <textarea
                                        className="devTextarea"
                                        rows={5}
                                        value={form.description}
                                        onChange={set("description")}
                                        placeholder="Short text shown under the developer logo"
                                    />
                                </label>

                                <label className="devField">
                                    <div className="devLabel">Featured Order</div>
                                    <input
                                        className="devInput"
                                        inputMode="numeric"
                                        value={String(form.featuredOrder)}
                                        onChange={set("featuredOrder")}
                                        placeholder="0"
                                    />
                                </label>

                                <label className="devField devToggle">
                                    <div className="devLabel">Featured</div>
                                    <div className="devSwitch">
                                        <input
                                            type="checkbox"
                                            checked={!!form.isFeatured}
                                            onChange={set("isFeatured")}
                                        />
                                        <span />
                                    </div>
                                </label>
                            </div>

                            <div className="devModal-bottom">
                                <div className="devFootnote">Required: name, description, logo.</div>
                                <div className="devBtns">
                                    <button className="devAdm-btnGhost" type="button" onClick={closeCreate} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="devAdm-btnPrimary" type="submit" disabled={!canSave}>
                                        {saving ? "Saving..." : "Save Developer"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
