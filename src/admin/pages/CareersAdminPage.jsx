import { useEffect, useMemo, useState } from "react";
import "./CareersAdminPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];
const LOCATIONS = ["Dubai", "Abu Dhabi", "Lebanon", "Remote"];
const DEPTS = ["Sales", "Administrative", "Marketing", "Operations", "Finance"];
const SENIORITY = ["Junior", "Mid", "Senior", "Lead"];
const CURRENCIES = ["AED", "USD", "EUR"];

function tokenOrThrow() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing token. Please login again.");
    return token;
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

function formatDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function salaryLabel(j) {
    const cur = j.currency || "AED";
    const a = Number(j.salaryMin);
    const b = Number(j.salaryMax);
    const aOk = Number.isFinite(a) && a > 0;
    const bOk = Number.isFinite(b) && b > 0;
    if (!aOk && !bOk) return "";
    if (aOk && bOk) return `${cur} ${a.toLocaleString()} - ${b.toLocaleString()}`;
    if (aOk) return `${cur} ${a.toLocaleString()}+`;
    return `${cur} up to ${b.toLocaleString()}`;
}

function emptyForm() {
    return {
        title: "",
        type: "Full-time",
        workMode: "On-site",
        location: "Dubai",
        dept: "Sales",

        seniority: "Mid",
        currency: "AED",
        salaryMin: "",
        salaryMax: "",

        summary: "",
        responsibilities: "",
        requirements: "",
        benefits: "",

        applyEmail: "hr@aouad.com",
        isActive: true,
    };
}

function absUrlMaybe(relativeUrl) {
    if (!relativeUrl) return "";
    if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) return relativeUrl;
    // API_BASE is ".../api" => remove "/api" to get server origin
    const origin = API_BASE.replace(/\/api\/?$/, "");
    return `${origin}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;
}

export default function CareersAdminPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [q, setQ] = useState("");

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState(emptyForm());

    // ===== Applicants modal state =====
    const [appsOpen, setAppsOpen] = useState(false);
    const [appsJob, setAppsJob] = useState(null);
    const [appsLoading, setAppsLoading] = useState(false);
    const [appsErr, setAppsErr] = useState("");
    const [apps, setApps] = useState([]);

    const set = (key) => (e) => {
        const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((p) => ({ ...p, [key]: v }));
    };

    async function loadJobs() {
        setLoading(true);
        try {
            setError("");
            const token = tokenOrThrow();

            const res = await fetch(`${API_BASE}/admin/careers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to load careers");

            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (e) {
            console.error(e);
            setItems([]);
            setError(e.message || "Failed to load careers");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadJobs();
    }, []);

    const activeCount = useMemo(() => items.filter((x) => x.isActive).length, [items]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((x) => {
            const hay = [
                x.title,
                x.dept,
                x.location,
                x.type,
                x.workMode,
                x.seniority,
                x.summary,
                x.responsibilities,
                x.requirements,
                x.benefits,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return hay.includes(s);
        });
    }, [items, q]);

    const canSave = useMemo(() => {
        return form.title.trim().length >= 3 && form.applyEmail.trim().includes("@");
    }, [form.title, form.applyEmail]);

    const openCreate = () => {
        setError("");
        setEditing(null);
        setForm(emptyForm());
        setOpen(true);
    };

    const openEdit = (job) => {
        setError("");
        setEditing(job);
        setForm({
            title: job.title || "",
            type: job.type || "Full-time",
            workMode: job.workMode || "On-site",
            location: job.location || "Dubai",
            dept: job.dept || "Sales",

            seniority: job.seniority || "Mid",
            currency: job.currency || "AED",
            salaryMin: job.salaryMin ?? "",
            salaryMax: job.salaryMax ?? "",

            summary: job.summary || "",
            responsibilities: job.responsibilities || "",
            requirements: job.requirements || "",
            benefits: job.benefits || "",

            applyEmail: job.applyEmail || "hr@aouad.com",
            isActive: job.isActive !== false,
        });
        setOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setOpen(false);
    };

    const toPayload = () => ({
        title: form.title.trim(),
        type: form.type,
        workMode: form.workMode,
        location: form.location,
        dept: form.dept,

        seniority: form.seniority || null,
        currency: form.currency || null,
        salaryMin: form.salaryMin === "" ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === "" ? null : Number(form.salaryMax),

        summary: form.summary.trim() || null,
        responsibilities: form.responsibilities.trim() || null,
        requirements: form.requirements.trim() || null,
        benefits: form.benefits.trim() || null,

        applyEmail: form.applyEmail.trim() || null,
        isActive: !!form.isActive,
    });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSave || saving) return;

        setSaving(true);
        setError("");

        try {
            const token = tokenOrThrow();
            const payload = toPayload();

            if (!editing) {
                const res = await fetch(`${API_BASE}/admin/careers`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || "Failed to create job");

                setOpen(false);
                await loadJobs();
                return;
            }

            const res = await fetch(`${API_BASE}/admin/careers/${editing.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to update job");

            setOpen(false);
            setEditing(null);
            await loadJobs();
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (job) => {
        const ok = window.confirm(`Delete job "${job.title}"? This cannot be undone.`);
        if (!ok) return;

        try {
            setError("");
            const token = tokenOrThrow();

            setItems((prev) => prev.filter((x) => x.id !== job.id));

            const res = await fetch(`${API_BASE}/admin/careers/${job.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                await loadJobs();
                throw new Error(data?.error || "Failed to delete job");
            }
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to delete job");
        }
    };

    const toggleActive = async (job) => {
        try {
            setError("");
            const token = tokenOrThrow();

            setItems((prev) => prev.map((x) => (x.id === job.id ? { ...x, isActive: !x.isActive } : x)));

            const res = await fetch(`${API_BASE}/admin/careers/${job.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !job.isActive }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                await loadJobs();
                throw new Error(data?.error || "Failed to update status");
            }
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to update status");
        }
    };

    // ===== Applicants actions =====
    const openApplicants = async (job) => {
        setAppsOpen(true);
        setAppsJob(job);
        setApps([]);
        setAppsErr("");
        setAppsLoading(true);

        try {
            const token = tokenOrThrow();
            const res = await fetch(`${API_BASE}/admin/careers/${job.id}/applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to load applications");

            setApps(Array.isArray(data.items) ? data.items : []);
        } catch (e) {
            console.error(e);
            setAppsErr(e.message || "Failed to load applications");
            setApps([]);
        } finally {
            setAppsLoading(false);
        }
    };

    const closeApplicants = () => {
        if (appsLoading) return;
        setAppsOpen(false);
        setAppsJob(null);
        setApps([]);
        setAppsErr("");
    };

    const deleteApplication = async (app) => {
        const ok = window.confirm(`Delete application from "${app.fullName}"?`);
        if (!ok) return;

        try {
            const token = tokenOrThrow();
            // optimistic
            setApps((prev) => prev.filter((x) => x.id !== app.id));

            const res = await fetch(`${API_BASE}/admin/careers/applications/${app.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to delete application");

            // refresh counts on jobs list
            await loadJobs();
        } catch (e) {
            console.error(e);
            setAppsErr(e.message || "Failed to delete application");
            // reload list to recover
            if (appsJob) openApplicants(appsJob);
        }
    };

    return (
        <div className="cadm">
            <div className="cadm-card">
                <div className="cadm-top">
                    <div>
                        <div className="cadm-title">Careers</div>
                        <div className="cadm-sub">
                            Manage open positions shown on your Careers page.{" "}
                            <span className="cadm-pill">{activeCount} active</span>
                        </div>
                    </div>

                    <div className="cadm-topRight">
                        <div className="cadm-searchWrap">
                            <input className="cadm-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…" />
                        </div>

                        <button className="cadm-btn cadm-btnPrimary" type="button" onClick={openCreate}>
                            + Add Job
                        </button>
                    </div>
                </div>

                {error && <div className="cadm-alert">{error}</div>}

                {loading ? (
                    <div className="cadm-empty">Loading…</div>
                ) : (
                    <div className="cadm-list">
                        {filtered.length === 0 ? (
                            <div className="cadm-empty">{items.length === 0 ? "No jobs yet. Click “Add Job”." : "No matches."}</div>
                        ) : (
                            filtered.map((j, idx) => {
                                const count = j?._count?.applications ?? 0;

                                return (
                                    <div key={j.id} className="cadm-row">
                                        <div className="cadm-left">
                                            <div className="cadm-num">{idx + 1}</div>

                                            <div className="cadm-meta">
                                                <div className="cadm-nameRow">
                                                    <div className="cadm-name">{j.title}</div>
                                                    <span className={"cadm-status " + (j.isActive ? "is-active" : "is-inactive")}>
                                                        {j.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <div className="cadm-line">
                                                    {j.type} · {j.workMode || "—"} · {j.location} · {j.dept}
                                                    {j.seniority ? ` · ${j.seniority}` : ""}
                                                    {salaryLabel(j) ? ` · ${salaryLabel(j)}` : ""}
                                                </div>

                                                {j.summary ? <div className="cadm-desc">{j.summary}</div> : null}

                                                <div className="cadm-detailsGrid">
                                                    <div className="cadm-block">
                                                        <div className="cadm-h">Responsibilities</div>
                                                        <pre className="cadm-pre">{j.responsibilities || "—"}</pre>
                                                    </div>

                                                    <div className="cadm-block">
                                                        <div className="cadm-h">Requirements</div>
                                                        <pre className="cadm-pre">{j.requirements || "—"}</pre>
                                                    </div>

                                                    <div className="cadm-block cadm-span2">
                                                        <div className="cadm-h">Benefits</div>
                                                        <pre className="cadm-pre">{j.benefits || "—"}</pre>
                                                    </div>
                                                </div>

                                                <div className="cadm-foot">
                                                    <span>
                                                        Apply email: <b>{j.applyEmail || "hr@aouad.com"}</b>
                                                    </span>
                                                    <span className="cadm-dot">•</span>
                                                    <span>Updated: {formatDate(j.updatedAt || j.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cadm-actions">
                                            {/* ✅ NEW: Applicants button */}
                                            <button className="cadm-btn" type="button" onClick={() => openApplicants(j)}>
                                                Applicants {count ? `(${count})` : ""}
                                            </button>

                                            {/* keep toggle */}
                                            <button className="cadm-btn cadm-btnGhost" type="button" onClick={() => toggleActive(j)}>
                                                {j.isActive ? "Disable" : "Enable"}
                                            </button>

                                            <button className="cadm-btn" type="button" onClick={() => openEdit(j)}>
                                                Edit
                                            </button>

                                            <button className="cadm-btn cadm-btnDanger" type="button" onClick={() => onDelete(j)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ===== Applicants Modal ===== */}
            {appsOpen && (
                <div className="cadm-modalOverlay" onClick={closeApplicants} role="presentation">
                    <div className="cadm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="cadm-modalHeader">
                            <div>
                                <div className="cadm-modalTitle">Applicants</div>
                                <div className="cadm-modalSub">
                                    {appsJob?.title ? (
                                        <>
                                            For: <b>{appsJob.title}</b>
                                        </>
                                    ) : (
                                        "Applications"
                                    )}
                                </div>
                            </div>

                            <button className="cadm-btn cadm-btnGhost" type="button" onClick={closeApplicants} disabled={appsLoading}>
                                Close
                            </button>
                        </div>

                        {appsErr ? <div className="cadm-alert">{appsErr}</div> : null}

                        {appsLoading ? (
                            <div className="cadm-empty">Loading applications…</div>
                        ) : apps.length === 0 ? (
                            <div className="cadm-empty">No applications yet.</div>
                        ) : (
                            <div className="cadm-appList">
                                {apps.map((a) => (
                                    <div key={a.id} className="cadm-appRow">
                                        <div className="cadm-appMain">
                                            <div className="cadm-appName">{a.fullName}</div>
                                            <div className="cadm-appMeta">
                                                <span>
                                                    Email: <b>{a.email}</b>
                                                </span>
                                                {a.phone ? (
                                                    <>
                                                        <span className="cadm-dot">•</span>
                                                        <span>Phone: {a.phone}</span>
                                                    </>
                                                ) : null}
                                                <span className="cadm-dot">•</span>
                                                <span>Submitted: {formatDateTime(a.createdAt)}</span>
                                            </div>

                                            {a.coverLetter ? (
                                                <div className="cadm-appLetter">
                                                    <div className="cadm-h">Cover letter</div>
                                                    <pre className="cadm-pre">{a.coverLetter}</pre>
                                                </div>
                                            ) : null}

                                            <div className="cadm-appFiles">
                                                <div>
                                                    CV:{" "}
                                                    {a.cvUrl ? (
                                                        <a className="cadm-link" href={absUrlMaybe(a.cvUrl)} target="_blank" rel="noreferrer">
                                                            Download / View
                                                        </a>
                                                    ) : (
                                                        <span>—</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cadm-appActions">
                                            <button className="cadm-btn cadm-btnDanger" type="button" onClick={() => deleteApplication(a)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== Job Modal ===== */}
            {open && (
                <div className="cadm-modalOverlay" onClick={closeModal} role="presentation">
                    <div className="cadm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="cadm-modalHeader">
                            <div>
                                <div className="cadm-modalTitle">{editing ? "Edit Job" : "Add Job"}</div>
                                <div className="cadm-modalSub">This appears under “Open Positions”. Use bullets for responsibilities/requirements.</div>
                            </div>

                            <button className="cadm-btn cadm-btnGhost" type="button" onClick={closeModal} disabled={saving}>
                                Close
                            </button>
                        </div>

                        <form onSubmit={onSubmit} className="cadm-form">
                            <div className="cadm-grid">
                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Title *</div>
                                    <input className="cadm-input" value={form.title} onChange={set("title")} placeholder="Property Consultant" />
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Job Type</div>
                                    <select className="cadm-input" value={form.type} onChange={set("type")}>
                                        {JOB_TYPES.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Work Mode</div>
                                    <select className="cadm-input" value={form.workMode} onChange={set("workMode")}>
                                        {WORK_MODES.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Location</div>
                                    <select className="cadm-input" value={form.location} onChange={set("location")}>
                                        {LOCATIONS.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Department</div>
                                    <select className="cadm-input" value={form.dept} onChange={set("dept")}>
                                        {DEPTS.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Seniority</div>
                                    <select className="cadm-input" value={form.seniority} onChange={set("seniority")}>
                                        {SENIORITY.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Currency</div>
                                    <select className="cadm-input" value={form.currency} onChange={set("currency")}>
                                        {CURRENCIES.map((x) => (
                                            <option key={x} value={x}>
                                                {x}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Salary Min</div>
                                    <input className="cadm-input" inputMode="numeric" value={form.salaryMin} onChange={set("salaryMin")} placeholder="e.g. 12000" />
                                </div>

                                <div className="cadm-field">
                                    <div className="cadm-label">Salary Max</div>
                                    <input className="cadm-input" inputMode="numeric" value={form.salaryMax} onChange={set("salaryMax")} placeholder="e.g. 18000" />
                                </div>

                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Short Summary</div>
                                    <textarea className="cadm-textarea" value={form.summary} onChange={set("summary")} rows={3} placeholder="1–2 lines shown in the list..." />
                                </div>

                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Responsibilities</div>
                                    <textarea className="cadm-textarea" value={form.responsibilities} onChange={set("responsibilities")} rows={6} placeholder={"- Handle inbound leads\n- Conduct viewings\n- Close deals"} />
                                </div>

                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Requirements</div>
                                    <textarea className="cadm-textarea" value={form.requirements} onChange={set("requirements")} rows={6} placeholder={"- 2+ years in sales\n- Strong communication\n- English required"} />
                                </div>

                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Benefits</div>
                                    <textarea className="cadm-textarea" value={form.benefits} onChange={set("benefits")} rows={5} placeholder={"- Competitive commission\n- Visa sponsorship\n- Training & mentorship"} />
                                </div>

                                <div className="cadm-field cadm-span2">
                                    <div className="cadm-label">Apply Email *</div>
                                    <input className="cadm-input" value={form.applyEmail} onChange={set("applyEmail")} placeholder="hr@aouad.com" />
                                </div>

                                <div className="cadm-field cadm-span2 cadm-inline">
                                    <label className="cadm-check">
                                        <input type="checkbox" checked={!!form.isActive} onChange={set("isActive")} />
                                        <span>Active (visible on public Careers page)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="cadm-footer">
                                <div className="cadm-footNote">Required: title + apply email</div>

                                <div className="cadm-footerBtns">
                                    <button className="cadm-btn cadm-btnGhost" type="button" onClick={closeModal} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="cadm-btn cadm-btnPrimary" type="submit" disabled={!canSave || saving}>
                                        {saving ? "Saving..." : editing ? "Save Changes" : "Save Job"}
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
