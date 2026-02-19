// src/admin/pages/ClientStoriesAdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { FaEye, FaEyeSlash, FaPlus, FaSave, FaTrash, FaTimes } from "react-icons/fa";

function safeStr(v) {
    return String(v ?? "").trim();
}

export default function ClientStoriesAdminPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // side panel
    const [panelOpen, setPanelOpen] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const emptyForm = {
        clientName: "",
        clientTitle: "",
        quote: "",
        isHidden: false,
    };

    const [form, setForm] = useState(emptyForm);
    const isEditing = !!editingId;

    async function load() {
        try {
            setLoading(true);
            setErr("");
            const res = await api.get("/admin/client-stories");
            setItems(res.data?.items || []);
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed to load");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!alive) return;
            await load();
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selected = useMemo(() => {
        if (!editingId) return null;
        return items.find((x) => x.id === editingId) || null;
    }, [items, editingId]);

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setPanelOpen(true);
    }

    function startEdit(x) {
        setEditingId(x.id);
        setForm({
            clientName: x.clientName || "",
            clientTitle: x.clientTitle || "",
            quote: x.quote || "",
            isHidden: !!x.isHidden,
        });
        setPanelOpen(true);
    }

    async function onSave() {
        try {
            setErr("");

            const payload = {
                clientName: safeStr(form.clientName),
                clientTitle: safeStr(form.clientTitle) || null,
                quote: safeStr(form.quote),
                isHidden: !!form.isHidden,
            };

            if (payload.clientName.length < 2) return setErr("Client name is required.");
            if (payload.quote.length < 10) return setErr("Text should be at least 10 characters.");

            if (isEditing) {
                await api.patch(`/admin/client-stories/${editingId}`, payload);
            } else {
                await api.post("/admin/client-stories", payload);
            }

            await load();
            if (!isEditing) setForm(emptyForm);
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed to save");
        }
    }

    async function onToggleHidden(x) {
        try {
            setErr("");
            await api.patch(`/admin/client-stories/${x.id}`, { isHidden: !x.isHidden });
            await load();
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed to update");
        }
    }

    async function onDelete(x) {
        const ok = window.confirm(`Delete story for "${x.clientName}"?`);
        if (!ok) return;

        try {
            setErr("");
            await api.delete(`/admin/client-stories/${x.id}`);
            if (editingId === x.id) {
                setEditingId(null);
                setForm(emptyForm);
            }
            await load();
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed to delete");
        }
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: panelOpen ? "1fr 420px" : "1fr", gap: 16 }}>
            {/* LEFT */}
            <div className="adm-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>Client Stories</div>
                        <div style={{ color: "#666", fontSize: 13 }}>
                            Add / edit feedback shown on the website. Hide removes it from public.
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button className="adm-miniBtn" type="button" onClick={() => setPanelOpen((v) => !v)}>
                            {panelOpen ? "Hide Panel" : "Show Panel"}
                        </button>
                        <button className="adm-miniBtn" type="button" onClick={startCreate}>
                            <FaPlus style={{ marginRight: 8 }} />
                            New Story
                        </button>
                    </div>
                </div>

                {err ? <div style={{ marginTop: 12, color: "#b00020", fontSize: 13 }}>{err}</div> : null}

                <div className="adm-tableWrap" style={{ marginTop: 14 }}>
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th className="adm-th">Name</th>
                                <th className="adm-th">Status</th>
                                <th className="adm-th">Visibility</th>
                                <th className="adm-th" style={{ width: 260 }}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className="adm-td" colSpan={4}>Loading…</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td className="adm-td" colSpan={4}>No stories yet.</td>
                                </tr>
                            ) : (
                                items.map((x) => (
                                    <tr
                                        key={x.id}
                                        className="adm-row"
                                        style={{ background: editingId === x.id ? "rgba(0,0,0,0.03)" : "transparent" }}
                                    >
                                        <td className="adm-td" style={{ fontWeight: 800 }}>
                                            {x.clientName}
                                            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                                                {String(x.quote || "").slice(0, 60)}{String(x.quote || "").length > 60 ? "…" : ""}
                                            </div>
                                        </td>

                                        <td className="adm-td">{x.clientTitle || "—"}</td>

                                        <td className="adm-td">
                                            {x.isHidden ? (
                                                <span className="adm-chip" style={{ background: "rgba(176,0,32,0.08)", color: "#b00020" }}>
                                                    Hidden
                                                </span>
                                            ) : (
                                                <span className="adm-chip" style={{ background: "rgba(0,120,0,0.08)", color: "#0a6" }}>
                                                    Visible
                                                </span>
                                            )}
                                        </td>

                                        <td className="adm-td">
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <button className="adm-miniBtn" type="button" onClick={() => startEdit(x)}>
                                                    Edit
                                                </button>

                                                <button className="adm-miniBtn" type="button" onClick={() => onToggleHidden(x)}>
                                                    {x.isHidden ? (
                                                        <>
                                                            <FaEye style={{ marginRight: 6 }} /> Show
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaEyeSlash style={{ marginRight: 6 }} /> Hide
                                                        </>
                                                    )}
                                                </button>

                                                <button className="adm-miniBtn" type="button" onClick={() => onDelete(x)}>
                                                    <FaTrash style={{ marginRight: 6 }} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT */}
            {panelOpen ? (
                <aside className="adm-card" style={{ padding: 16, position: "sticky", top: 16, height: "fit-content" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>{isEditing ? "Edit Story" : "Create Story"}</div>
                        <button className="adm-miniBtn" type="button" onClick={() => setPanelOpen(false)}>
                            <FaTimes style={{ marginRight: 6 }} />
                            Close
                        </button>
                    </div>

                    {isEditing && selected ? (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                            Editing: <b>{selected.clientName}</b>
                        </div>
                    ) : null}

                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                        <Field label="Name">
                            <input
                                className="adm-input"
                                value={form.clientName}
                                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                                placeholder="e.g. Alex Morgan"
                            />
                        </Field>

                        <Field label="Status (optional)">
                            <input
                                className="adm-input"
                                value={form.clientTitle}
                                onChange={(e) => setForm((f) => ({ ...f, clientTitle: e.target.value }))}
                                placeholder="e.g. First-time Home Buyer"
                            />
                        </Field>

                        <Field label="Text">
                            <textarea
                                className="adm-input"
                                rows={7}
                                value={form.quote}
                                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                                placeholder="Write the client story..."
                            />
                        </Field>

                        <Field label="Visibility">
                            <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#333" }}>
                                <input
                                    type="checkbox"
                                    checked={!!form.isHidden}
                                    onChange={(e) => setForm((f) => ({ ...f, isHidden: e.target.checked }))}
                                />
                                Hidden (don’t show on website)
                            </label>
                        </Field>

                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                            <button className="adm-btn" type="button" onClick={onSave}>
                                <FaSave style={{ marginRight: 8 }} />
                                {isEditing ? "Save Changes" : "Create Story"}
                            </button>

                            <button
                                className="adm-miniBtn"
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm(emptyForm);
                                }}
                                title="Reset form"
                            >
                                Reset
                            </button>
                        </div>

                        {err ? <div style={{ marginTop: 8, color: "#b00020", fontSize: 13 }}>{err}</div> : null}
                    </div>
                </aside>
            ) : null}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{label}</div>
            {children}
        </div>
    );
}
