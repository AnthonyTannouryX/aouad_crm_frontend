// frontend/src/agent/pages/AgentLeadsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import "../../admin/pages/leadsPage.css";

/** ---------------- constants (keep aligned with Prisma enums) ---------------- */
const CLIENT_TYPES = ["LEAD", "CLIENT", "INVESTOR", "OWNER"];

const SOURCES = [
    "INSTAGRAM",
    "PERSONAL_PR",
    "COLD_CALL",
    "WEBSITE",
    "REFERRAL",
    "WHATSAPP",
    "WALK_IN",
    "OTHER",
    "MANUAL",
];

const URGENCY = ["HOT", "WARM", "COLD"];
const STATUS_ADMIN = ["OPEN", "FOLLOW_UP", "CLOSED"];
const STATUS_SCHEDULE = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "SPAM"];

/** ---------------- helpers (same-ish as admin) ---------------- */
function isoDate(d) {
    if (!d) return "—";
    try {
        return new Date(d).toISOString().slice(0, 10);
    } catch {
        return "—";
    }
}

function isoDateToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function toNumOrNull(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function normPhone(s) {
    return String(s || "").trim();
}

function fmtBudget(min, max) {
    const a = Number(min);
    const b = Number(max);
    const aOk = Number.isFinite(a) && a > 0;
    const bOk = Number.isFinite(b) && b > 0;
    if (!aOk && !bOk) return "-";
    const left = aOk ? a.toLocaleString() : "?";
    const right = bOk ? b.toLocaleString() : "?";
    return `${left}–${right}`;
}

function pillTone(v) {
    const x = String(v || "").toUpperCase();
    if (x === "HOT") return "is-hot";
    if (x === "WARM") return "is-warm";
    return "is-cold";
}

function bedsLabel(v) {
    if (v == null || v === "") return "-";
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    if (n === 0) return "STUDIO";
    if (n >= 4) return "4+";
    return String(n);
}

function normText(s) {
    return String(s || "").toLowerCase().trim();
}

function uniqSorted(arr) {
    const set = new Set(
        (arr || [])
            .map((x) => String(x || "").trim())
            .filter(Boolean)
            .map((x) => x.replace(/\s+/g, " "))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Client “bedrooms requirement” normalization
// null => Any, 0 => Studio, 1/2/3 => exact, 4 => 4+
function toBedsReq(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n >= 4 ? 4 : n;
}

function listingBeds(p) {
    const n = Number(p?.bedrooms);
    return Number.isFinite(n) ? n : null;
}

function listingPrice(p) {
    const n = Number(p?.startingPrice ?? p?.price);
    return Number.isFinite(n) ? n : 0;
}

function fullNameFromRow(r) {
    // supports both shapes:
    // - SCHEDULE_CALL => firstName/lastName
    // - ADMIN_LEAD (Client) => name
    const fn = String(r.firstName || "").trim();
    const ln = String(r.lastName || "").trim();
    const name = `${fn} ${ln}`.trim();
    return name || r.name || "—";
}

function useIsMobile(breakpointPx = 900) {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < breakpointPx;
    });

    useEffect(() => {
        function onResize() {
            setIsMobile(window.innerWidth < breakpointPx);
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [breakpointPx]);

    return isMobile;
}

/**
 * ✅ NEW: normalize rows coming from backend so UI can show BOTH:
 * - schedule calls (kind=SCHEDULE_CALL)
 * - admin-assigned leads/clients (Client rows assigned to agent)
 *
 * We map any alternative field names that might come from backend.
 */
function normalizeAgentLeadRow(x) {
    if (!x) return null;

    const kind = String(x.kind || "ADMIN_LEAD").toUpperCase();
    const isSchedule = kind === "SCHEDULE_CALL";

    // tolerate alternate fields
    const status = String(x.status || x.clientStatus || "").toUpperCase() || (isSchedule ? "NEW" : "OPEN");
    const source = String(x.source || x.leadSource || "").toUpperCase() || "MANUAL";
    const urgency = String(x.urgency || "").toUpperCase() || (isSchedule ? "WARM" : "WARM"); // schedule call doesn't use it, harmless
    const clientType = String(x.clientType || "LEAD").toUpperCase();

    const name =
        String(x.name || "").trim() ||
        `${String(x.firstName || "").trim()} ${String(x.lastName || "").trim()}`.trim() ||
        "—";

    // ensure id exists
    const id = x.id;

    return {
        ...x,
        id,
        kind: isSchedule ? "SCHEDULE_CALL" : "ADMIN_LEAD",
        status,
        source,
        urgency,
        clientType,
        name,
        phone: x.phone ?? null,
        email: x.email ?? null,
        interestedArea: x.interestedArea ?? x.country ?? null,
        budgetMin: x.budgetMin ?? null,
        budgetMax: x.budgetMax ?? null,
        bedrooms: x.bedrooms ?? null,
        dateContacted: x.dateContacted ?? x.createdAt ?? null,
        projectShared: x.projectShared ?? null,
        feedback: x.feedback ?? null,
        note: x.note ?? x.projectShared ?? x.feedback ?? null,
    };
}

function normalizeAgentLeadRows(rows) {
    const arr = Array.isArray(rows) ? rows : [];
    return arr.map(normalizeAgentLeadRow).filter(Boolean);
}

/** ---------------- page ---------------- */
export default function AgentLeadsPage() {
    const isMobile = useIsMobile(900);

    // list
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // selection
    const [selectedId, setSelectedId] = useState(null);
    const [detailsOpenMobile, setDetailsOpenMobile] = useState(false);

    // filters (match admin UX)
    const [search, setSearch] = useState("");
    const [urgencyFilter, setUrgencyFilter] = useState("All");
    const [sourceFilter, setSourceFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // countries dropdown options (from listings)
    const [countries, setCountries] = useState([]);
    const [countriesLoading, setCountriesLoading] = useState(false);

    // create modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formErr, setFormErr] = useState("");

    // edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editLead, setEditLead] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editErr, setEditErr] = useState("");

    // search listings modal
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLead, setSearchLead] = useState(null);
    const [listingLoading, setListingLoading] = useState(false);
    const [listingErr, setListingErr] = useState("");
    const [listingsRaw, setListingsRaw] = useState([]);
    const [popupQuery, setPopupQuery] = useState("");

    // close deal confirm
    const [closeOpen, setCloseOpen] = useState(false);
    const [closeLead, setCloseLead] = useState(null);
    const [closing, setClosing] = useState(false);
    const [closeErr, setCloseErr] = useState("");

    const [form, setForm] = useState({
        clientType: "LEAD",
        name: "",
        dateContacted: isoDateToday(),
        source: "MANUAL",
        phone: "",
        email: "",
        interestedArea: "",
        budgetMin: "",
        budgetMax: "",
        bedrooms: "",
        urgency: "WARM",
        status: "OPEN",
        projectShared: "",
        feedback: "",
    });

    const [editForm, setEditForm] = useState({
        clientType: "LEAD",
        name: "",
        dateContacted: isoDateToday(),
        source: "MANUAL",
        phone: "",
        email: "",
        interestedArea: "",
        budgetMin: "",
        budgetMax: "",
        bedrooms: "",
        urgency: "WARM",
        status: "OPEN",
        projectShared: "",
        feedback: "",
    });

    const canCreate = useMemo(() => {
        return form.name.trim().length >= 2 && normPhone(form.phone).length >= 6;
    }, [form.name, form.phone]);

    const canEditSave = useMemo(() => {
        return editForm.name.trim().length >= 2 && normPhone(editForm.phone).length >= 6;
    }, [editForm.name, editForm.phone]);

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const res = await api.get("/agent/leads?limit=500");
            const rows = Array.isArray(res.data?.items) ? res.data.items : [];
            const normalized = normalizeAgentLeadRows(rows);

            setItems(normalized);
            setSelectedId((prev) => (prev && normalized.some((x) => x.id === prev) ? prev : normalized[0]?.id || null));
        } catch (e) {
            setErr(e?.response?.data?.error || e.message || "Failed to load leads");
            setItems([]);
            setSelectedId(null);
        } finally {
            setLoading(false);
        }
    }

    async function loadCountries() {
        setCountriesLoading(true);
        try {
            // assumes your api baseURL already includes /api
            const res = await api.get("/public/listings?limit=800");
            const data = res.data;
            const list = Array.isArray(data) ? data : data?.items;
            const arr = Array.isArray(list) ? list : [];
            setCountries(uniqSorted(arr.map((p) => p?.country)));
        } catch (e) {
            console.error(e);
            setCountries([]);
        } finally {
            setCountriesLoading(false);
        }
    }

    useEffect(() => {
        load();
        loadCountries();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return items.filter((x) => {
            const kind = String(x?.kind || "ADMIN_LEAD").toUpperCase();
            const isSchedule = kind === "SCHEDULE_CALL";

            // normalize fields for filtering
            const urgency = String(x?.urgency || "").toUpperCase();
            const source = String(x?.source || "").toUpperCase();
            const status = String(x?.status || "").toUpperCase();

            // Filters apply primarily to ADMIN_LEAD; for schedule calls we still allow status filtering
            if (!isSchedule) {
                if (urgencyFilter !== "All" && urgency !== urgencyFilter) return false;
                if (sourceFilter !== "All" && source !== sourceFilter) return false;
                if (statusFilter !== "All" && status !== statusFilter) return false;
            } else {
                // schedule calls: only status filter makes sense
                if (statusFilter !== "All" && status !== statusFilter) return false;
            }

            if (!q) return true;

            const listingTitle = x?.listing?.title || "";
            const hay = `${fullNameFromRow(x)} ${x?.phone || ""} ${x?.email || ""} ${x?.note || ""} ${x?.feedback || ""} ${x?.projectShared || ""
                } ${listingTitle} ${x?.kind || ""} ${x?.interestedArea || ""} ${x?.source || ""} ${x?.urgency || ""} ${x?.status || ""
                } ${x?.bedrooms ?? ""}`;

            return hay.toLowerCase().includes(q);
        });
    }, [items, search, urgencyFilter, sourceFilter, statusFilter]);

    const selectedLead = useMemo(() => {
        return filtered.find((x) => x.id === selectedId) || items.find((x) => x.id === selectedId) || null;
    }, [filtered, items, selectedId]);

    function onSelectLead(id) {
        setSelectedId(id);
        if (isMobile) setDetailsOpenMobile(true);
    }

    /** ---------------- create ---------------- */
    function openCreate() {
        setFormErr("");
        setForm({
            clientType: "LEAD",
            name: "",
            dateContacted: isoDateToday(),
            source: "MANUAL",
            phone: "",
            email: "",
            interestedArea: "",
            budgetMin: "",
            budgetMax: "",
            bedrooms: "",
            urgency: "WARM",
            status: "OPEN",
            projectShared: "",
            feedback: "",
        });
        setOpen(true);
    }

    function closeCreate() {
        if (saving) return;
        setOpen(false);
    }

    async function onCreate(e) {
        e.preventDefault();
        if (!canCreate || saving) return;

        setSaving(true);
        setFormErr("");

        try {
            const payload = {
                clientType: form.clientType,
                name: form.name.trim(),
                dateContacted: form.dateContacted,
                source: form.source,
                phone: normPhone(form.phone) || null,
                email: form.email.trim() || null,
                interestedArea: String(form.interestedArea || "").trim() || null,
                budgetMin: toNumOrNull(form.budgetMin),
                budgetMax: toNumOrNull(form.budgetMax),
                bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
                urgency: form.urgency,
                status: form.status,
                projectShared: form.projectShared.trim() || null,
                feedback: form.feedback.trim() || null,
            };

            // ✅ your backend creates Client(clientType=LEAD)
            const res = await api.post("/agent/leads/manual", payload);

            const createdClient = res.data?.item || res.data;
            if (!createdClient?.id) throw new Error("Create failed");

            // normalize to same UI shape
            const mergedRow = normalizeAgentLeadRow({
                kind: "ADMIN_LEAD",
                id: createdClient.id,
                createdAt: createdClient.createdAt,
                name: createdClient.name,
                phone: createdClient.phone,
                email: createdClient.email,
                interestedArea: createdClient.interestedArea,
                budgetMin: createdClient.budgetMin,
                budgetMax: createdClient.budgetMax,
                bedrooms: createdClient.bedrooms,
                urgency: createdClient.urgency,
                status: createdClient.status,
                source: createdClient.source,
                dateContacted: createdClient.dateContacted,
                projectShared: createdClient.projectShared,
                feedback: createdClient.feedback,
                clientType: createdClient.clientType || "LEAD",
            });

            setItems((prev) => [mergedRow, ...prev].filter(Boolean));
            setSelectedId(mergedRow.id);
            setOpen(false);
        } catch (e2) {
            console.error(e2);
            setFormErr(e2?.response?.data?.error || e2.message || "Failed to create lead");
        } finally {
            setSaving(false);
        }
    }

    /** ---------------- edit ---------------- */
    function openEdit(l) {
        if (!l) return;
        const isSchedule = String(l.kind || "").toUpperCase() === "SCHEDULE_CALL";
        if (isSchedule) {
            // schedule call edit is inline in details; keep admin-lead edit modal only
            return;
        }

        setEditErr("");
        setEditLead(l);

        setEditForm({
            clientType: l.clientType || "LEAD",
            name: l.name || fullNameFromRow(l),
            dateContacted: l.dateContacted ? String(l.dateContacted).slice(0, 10) : isoDateToday(),
            source: l.source || "MANUAL",
            phone: l.phone || "",
            email: l.email || "",
            interestedArea: l.interestedArea || "",
            budgetMin: l.budgetMin ?? "",
            budgetMax: l.budgetMax ?? "",
            bedrooms: l.bedrooms == null ? "" : String(l.bedrooms),
            urgency: l.urgency || "WARM",
            status: l.status || "OPEN",
            projectShared: l.projectShared || "",
            feedback: l.feedback || "",
        });

        setEditOpen(true);
    }

    function closeEdit() {
        if (editing) return;
        setEditOpen(false);
        setEditLead(null);
        setEditErr("");
    }

    async function onSaveEdit(e) {
        e.preventDefault();
        if (!editLead || editing || !canEditSave) return;

        setEditing(true);
        setEditErr("");

        const payload = {
            clientType: editForm.clientType,
            name: editForm.name.trim(),
            dateContacted: editForm.dateContacted,
            source: editForm.source,
            phone: normPhone(editForm.phone) || null,
            email: editForm.email.trim() || null,
            interestedArea: String(editForm.interestedArea || "").trim() || null,
            budgetMin: toNumOrNull(editForm.budgetMin),
            budgetMax: toNumOrNull(editForm.budgetMax),
            bedrooms: editForm.bedrooms === "" ? null : Number(editForm.bedrooms),
            urgency: editForm.urgency,
            status: editForm.status,
            projectShared: editForm.projectShared.trim() || null,
            feedback: editForm.feedback.trim() || null,
        };

        const prevItems = items;
        // optimistic update
        setItems((curr) => curr.map((x) => (x.id === editLead.id ? normalizeAgentLeadRow({ ...x, ...payload }) : x)));

        try {
            const res = await api.patch(`/agent/leads/${editLead.id}`, payload);
            const updated = res.data?.item || res.data;

            if (updated?.id) {
                const norm = normalizeAgentLeadRow({ ...updated, kind: "ADMIN_LEAD" });
                setItems((curr) => curr.map((x) => (x.id === norm.id ? { ...x, ...norm } : x)));
                setSelectedId(norm.id);
            }

            closeEdit();
        } catch (e2) {
            console.error(e2);
            setItems(prevItems);
            setEditErr(e2?.response?.data?.error || e2.message || "Failed to update lead");
        } finally {
            setEditing(false);
        }
    }

    /** ---------------- close deal ---------------- */
    function openCloseDeal(l) {
        if (!l) return;
        const isSchedule = String(l.kind || "").toUpperCase() === "SCHEDULE_CALL";
        if (isSchedule) return; // schedule calls use "Complete" in details
        setCloseErr("");
        setCloseLead(l);
        setCloseOpen(true);
    }

    function closeCloseDeal() {
        if (closing) return;
        setCloseOpen(false);
        setCloseLead(null);
        setCloseErr("");
    }

    async function confirmCloseDeal() {
        if (!closeLead || closing) return;

        setClosing(true);
        setCloseErr("");

        const prevItems = items;
        setItems((curr) => curr.map((x) => (x.id === closeLead.id ? normalizeAgentLeadRow({ ...x, status: "CLOSED" }) : x)));

        try {
            const res = await api.patch(`/agent/leads/${closeLead.id}`, { status: "CLOSED" });
            const updated = res.data?.item || res.data;
            if (updated?.id) {
                const norm = normalizeAgentLeadRow({ ...updated, kind: "ADMIN_LEAD" });
                setItems((curr) => curr.map((x) => (x.id === norm.id ? { ...x, ...norm } : x)));
            }
            closeCloseDeal();
        } catch (e) {
            console.error(e);
            setItems(prevItems);
            setCloseErr(e?.response?.data?.error || e.message || "Failed to close deal");
        } finally {
            setClosing(false);
        }
    }

    /** ---------------- search listings modal (same as admin) ---------------- */
    async function openSearchForLead(l) {
        if (!l) return;
        const isSchedule = String(l.kind || "").toUpperCase() === "SCHEDULE_CALL";
        if (isSchedule) return;

        setSearchLead(l);
        setSearchOpen(true);
        setPopupQuery("");
        setListingErr("");
        setListingsRaw([]);
        setListingLoading(true);

        try {
            const res = await api.get("/public/listings?limit=800");
            const data = res.data;
            const list = Array.isArray(data) ? data : data?.items;
            setListingsRaw(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error(e);
            setListingErr(e?.response?.data?.error || e.message || "Failed to load listings");
        } finally {
            setListingLoading(false);
        }
    }

    function closeSearch() {
        setSearchOpen(false);
        setSearchLead(null);
        setPopupQuery("");
    }

    const matchedListings = useMemo(() => {
        if (!searchLead) return [];

        const bedsReq = toBedsReq(searchLead.bedrooms);
        const min = Number(searchLead.budgetMin) || null;
        const max = Number(searchLead.budgetMax) || null;

        const country = normText(searchLead.interestedArea);
        const countryOn = country.length >= 2;

        const q = normText(popupQuery);
        const qOn = q.length >= 2;

        const res = listingsRaw.filter((p) => {
            if (p?.isHidden) return false;
            if (p?.deletedAt) return false;

            if (countryOn) {
                if (!normText(p?.country).includes(country)) return false;
            }

            if (bedsReq != null) {
                const b = listingBeds(p);
                if (b == null) return false;
                if (bedsReq === 4) {
                    if (b < 4) return false;
                } else {
                    if (b !== bedsReq) return false;
                }
            }

            const price = listingPrice(p);
            if (min != null && price && price < min) return false;
            if (max != null && price && price > max) return false;

            if (qOn) {
                const hay = `${p?.title || ""} ${p?.country || ""} ${p?.city || ""} ${p?.area || ""} ${p?.community || ""} ${p?.locationLabel || ""
                    }`;
                if (!normText(hay).includes(q)) return false;
            }

            return true;
        });

        res.sort((a, b) => listingPrice(a) - listingPrice(b));
        return res;
    }, [listingsRaw, searchLead, popupQuery]);

    /** ---------------- schedule call edit/save/delete (keep your existing endpoints) ---------------- */
    async function saveRow(id, patch) {
        const prev = items;
        setItems((arr) => arr.map((x) => (x.id === id ? normalizeAgentLeadRow({ ...x, ...patch }) : x)));
        try {
            const res = await api.patch(`/agent/leads/${id}`, patch);
            const updated = res.data?.item || res.data;
            if (updated?.id) {
                const norm = normalizeAgentLeadRow(updated);
                setItems((arr) => arr.map((x) => (x.id === norm.id ? { ...x, ...norm } : x)));
            }
        } catch (e) {
            setItems(prev);
            alert(e?.response?.data?.error || e.message || "Save failed");
        }
    }

    async function deleteRow(id) {
        if (!confirm("Delete this lead?")) return;
        const prev = items;
        setItems((arr) => arr.filter((x) => x.id !== id));
        try {
            await api.delete(`/agent/leads/${id}`);
            setSelectedId((cur) => (cur === id ? null : cur));
        } catch (e) {
            setItems(prev);
            alert(e?.response?.data?.error || e.message || "Delete failed");
        }
    }

    function markComplete(r) {
        // schedule call: status
        const isSchedule = String(r.kind || "").toUpperCase() === "SCHEDULE_CALL";
        if (isSchedule) return saveRow(r.id, { status: "CLOSED" });

        // admin lead: set status closed
        return saveRow(r.id, { status: "CLOSED" });
    }

    /** ---------------- esc to close modals (match admin) ---------------- */
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") {
                if (open) setOpen(false);
                if (editOpen) closeEdit();
                if (searchOpen) closeSearch();
                if (detailsOpenMobile) setDetailsOpenMobile(false);
                if (closeOpen) closeCloseDeal();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, editOpen, searchOpen, detailsOpenMobile, closeOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="leads">
            {/* topbar */}
            <div className="leads-topbar">
                <div className="leads-searchWrap">
                    <input
                        className="leads-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name / phone / email / country / listing"
                    />
                </div>

                <SelectPill value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency" options={["All", ...URGENCY]} />
                <SelectPill value={sourceFilter} onChange={setSourceFilter} label="Source" options={["All", ...SOURCES]} />
                <SelectPill
                    value={statusFilter}
                    onChange={setStatusFilter}
                    label="Status"
                    options={["All", ...STATUS_ADMIN, ...STATUS_SCHEDULE]}
                />

                <div className="leads-spacer" />

                <button className="leads-btnGhost" type="button" onClick={load} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>

                <button className="leads-btnPrimary" type="button" onClick={openCreate}>
                    Create Lead
                </button>
            </div>

            {/* content */}
            <div className="leads-split">
                {/* LEFT: cards */}
                <div className="leads-left">
                    <div className="leads-card">
                        {err ? <div className="leads-err">{err}</div> : null}

                        {loading ? (
                            <div className="leads-muted">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="leads-muted">No leads found.</div>
                        ) : (
                            <div className="leads-gridCards">
                                {filtered.map((r) => {
                                    const active = r.id === selectedId;
                                    const isSchedule = String(r.kind || "").toUpperCase() === "SCHEDULE_CALL";
                                    const name = fullNameFromRow(r);

                                    const subLeft = isSchedule ? "SCHEDULE CALL" : String(r.clientType || "LEAD").toUpperCase();
                                    const statusChip = String(r.status || "").toUpperCase() || "-";
                                    const listingTitle = r.listing?.title || "—";

                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            className={`leads-leadCard ${active ? "is-active" : ""}`}
                                            onClick={() => onSelectLead(r.id)}
                                        >
                                            <div className="leads-leadTop">
                                                <div className="leads-leadName">{name}</div>
                                                {isSchedule ? (
                                                    <span className="leads-pill is-warm">{statusChip}</span>
                                                ) : (
                                                    <span className={`leads-pill ${pillTone(r.urgency)}`}>{String(r.urgency || "-").toUpperCase()}</span>
                                                )}
                                            </div>

                                            <div className="leads-leadMeta">
                                                <span className="leads-uc">{subLeft}</span>
                                                <span className="leads-dot">•</span>
                                                <span className="leads-uc">
                                                    {isSchedule ? "Created" : "Contacted"}: {isoDate(r.createdAt || r.dateContacted)}
                                                </span>
                                            </div>

                                            <div className="leads-leadRow">
                                                <div className="leads-kv">
                                                    <div className="leads-k">Phone</div>
                                                    <div className="leads-v">{r.phone || "-"}</div>
                                                </div>

                                                <div className="leads-kv">
                                                    <div className="leads-k">{isSchedule ? "Listing" : "Country"}</div>
                                                    <div className="leads-v">{isSchedule ? listingTitle : r.interestedArea || "-"}</div>
                                                </div>
                                            </div>

                                            {!isSchedule ? (
                                                <div className="leads-leadRow">
                                                    <div className="leads-kv">
                                                        <div className="leads-k">Beds</div>
                                                        <div className="leads-v leads-uc">{bedsLabel(r.bedrooms)}</div>
                                                    </div>
                                                    <div className="leads-kv">
                                                        <div className="leads-k">Budget</div>
                                                        <div className="leads-v">{fmtBudget(r.budgetMin, r.budgetMax)}</div>
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="leads-leadFoot">
                                                <div className="leads-subline">
                                                    Email: {r.email || "-"}
                                                    {r.note ? ` · Note: ${r.note}` : ""}
                                                    {r.projectShared ? ` · Project: ${r.projectShared}` : ""}
                                                </div>
                                                {!isSchedule ? <div className="leads-statusChip">{statusChip}</div> : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: details (desktop) */}
                <div className="leads-right">
                    <div className="leads-card leads-detailsCard">
                        {!selectedLead ? (
                            <div className="leads-muted">Select a lead to view details.</div>
                        ) : (
                            <AgentLeadDetails
                                lead={selectedLead}
                                onSearch={() => openSearchForLead(selectedLead)}
                                onCloseDeal={() => openCloseDeal(selectedLead)}
                                onEdit={() => openEdit(selectedLead)}
                                onComplete={() => markComplete(selectedLead)}
                                onSaveSchedule={(patch) => saveRow(selectedLead.id, patch)}
                                onDelete={() => deleteRow(selectedLead.id)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* DETAILS (mobile sheet) */}
            {detailsOpenMobile && selectedLead && (
                <div className="leads-modalOverlay leads-modalOverlay--sheet" onClick={() => setDetailsOpenMobile(false)} role="presentation">
                    <div className="leads-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="leads-sheetTop">
                            <div>
                                <div className="leads-modalTitle">{fullNameFromRow(selectedLead)}</div>
                                <div className="leads-modalSub">
                                    {String(selectedLead.kind || "ADMIN_LEAD").toUpperCase()} · {String(selectedLead.status || "-").toUpperCase()}
                                </div>
                            </div>
                            <button className="leads-btnGhost" type="button" onClick={() => setDetailsOpenMobile(false)}>
                                Close
                            </button>
                        </div>

                        <div className="leads-sheetBody">
                            <AgentLeadDetails
                                lead={selectedLead}
                                onSearch={() => openSearchForLead(selectedLead)}
                                onCloseDeal={() => openCloseDeal(selectedLead)}
                                onEdit={() => openEdit(selectedLead)}
                                onComplete={() => markComplete(selectedLead)}
                                onSaveSchedule={(patch) => saveRow(selectedLead.id, patch)}
                                onDelete={() => deleteRow(selectedLead.id)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* CLOSE DEAL CONFIRM MODAL */}
            {closeOpen && closeLead && (
                <div className="leads-modalOverlay" onClick={closeCloseDeal} role="presentation">
                    <div className="leads-modal leads-confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="leads-modalTop">
                            <div>
                                <div className="leads-modalTitle">Close deal?</div>
                                <div className="leads-modalSub">
                                    This will set <b>{fullNameFromRow(closeLead)}</b> status to <b>CLOSED</b>.
                                </div>
                            </div>
                            <button className="leads-btnGhost" type="button" onClick={closeCloseDeal} disabled={closing}>
                                Close
                            </button>
                        </div>

                        {closeErr ? <div className="leads-err">{closeErr}</div> : null}

                        <div className="leads-confirmBody">
                            <div className="leads-confirmHint">CLOSE THE DEAL</div>

                            <div className="leads-confirmBtns">
                                <button className="leads-btnGhost" type="button" onClick={closeCloseDeal} disabled={closing}>
                                    Cancel
                                </button>
                                <button className="leads-btnPrimary leads-btnDanger" type="button" onClick={confirmCloseDeal} disabled={closing}>
                                    {closing ? "Closing..." : "Close Deal"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL (ADMIN_LEAD only) */}
            {editOpen && editLead && (
                <div className="leads-modalOverlay" onClick={closeEdit} role="presentation">
                    <div className="leads-modal leads-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="leads-modalTop">
                            <div>
                                <div className="leads-modalTitle">Edit Lead</div>
                                <div className="leads-modalSub">Update details and save changes.</div>
                            </div>

                            <button className="leads-btnGhost" type="button" onClick={closeEdit} disabled={editing}>
                                Close
                            </button>
                        </div>

                        {editErr ? <div className="leads-err">{editErr}</div> : null}

                        <form onSubmit={onSaveEdit} className="leads-form">
                            <div className="leads-grid">
                                <Field label="Client Type">
                                    <select className="leads-input" value={editForm.clientType} onChange={(e) => setEditForm((p) => ({ ...p, clientType: e.target.value }))}>
                                        {CLIENT_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Client Name *">
                                    <input className="leads-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                                </Field>

                                <Field label="Date Contacted">
                                    <input className="leads-input" type="date" value={editForm.dateContacted} onChange={(e) => setEditForm((p) => ({ ...p, dateContacted: e.target.value }))} />
                                </Field>

                                <Field label="Source">
                                    <select className="leads-input" value={editForm.source} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}>
                                        {SOURCES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Phone *">
                                    <input className="leads-input" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+961..." />
                                </Field>

                                <Field label="Email">
                                    <input className="leads-input" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="name@email.com" />
                                </Field>

                                <Field label="Interested Country">
                                    <select className="leads-input" value={editForm.interestedArea} onChange={(e) => setEditForm((p) => ({ ...p, interestedArea: e.target.value }))}>
                                        <option value="">Any</option>
                                        {countriesLoading ? (
                                            <option value="" disabled>
                                                Loading countries...
                                            </option>
                                        ) : countries.length === 0 ? (
                                            <option value="" disabled>
                                                No countries found (check listings.country)
                                            </option>
                                        ) : (
                                            countries.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="leads-hint">
                                        Tip: countries are pulled from your listings (field: <b>country</b>).
                                    </div>
                                </Field>

                                <Field label="Bedrooms requirement">
                                    <select className="leads-input" value={editForm.bedrooms} onChange={(e) => setEditForm((p) => ({ ...p, bedrooms: e.target.value }))}>
                                        <option value="">Any</option>
                                        <option value="0">Studio</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4+</option>
                                    </select>
                                </Field>

                                <Field label="Budget Min">
                                    <input className="leads-input" value={editForm.budgetMin} onChange={(e) => setEditForm((p) => ({ ...p, budgetMin: e.target.value }))} inputMode="numeric" placeholder="600000" />
                                </Field>

                                <Field label="Budget Max">
                                    <input className="leads-input" value={editForm.budgetMax} onChange={(e) => setEditForm((p) => ({ ...p, budgetMax: e.target.value }))} inputMode="numeric" placeholder="850000" />
                                </Field>

                                <Field label="Urgency">
                                    <select className="leads-input" value={editForm.urgency} onChange={(e) => setEditForm((p) => ({ ...p, urgency: e.target.value }))}>
                                        {URGENCY.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Status">
                                    <select className="leads-input" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                                        {STATUS_ADMIN.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="leads-span2">
                                    <Field label="Project Shared">
                                        <input className="leads-input" value={editForm.projectShared} onChange={(e) => setEditForm((p) => ({ ...p, projectShared: e.target.value }))} placeholder="Project name / listing sent" />
                                    </Field>
                                </div>

                                <div className="leads-span2">
                                    <Field label="Feedback">
                                        <textarea className="leads-textarea" value={editForm.feedback} onChange={(e) => setEditForm((p) => ({ ...p, feedback: e.target.value }))} placeholder="Client feedback..." />
                                    </Field>
                                </div>
                            </div>

                            <div className="leads-modalBottom">
                                <div className="leads-footnote">Required: client name, phone.</div>
                                <div className="leads-modalBtns">
                                    <button className="leads-btnGhost" type="button" onClick={closeEdit} disabled={editing}>
                                        Cancel
                                    </button>
                                    <button className="leads-btnPrimary" type="submit" disabled={!canEditSave || editing}>
                                        {editing ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {open && (
                <div className="leads-modalOverlay" onClick={closeCreate} role="presentation">
                    <div className="leads-modal leads-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="leads-modalTop">
                            <div>
                                <div className="leads-modalTitle">Create Lead</div>
                                <div className="leads-modalSub">Manual lead (will appear in your inbox).</div>
                            </div>

                            <button className="leads-btnGhost" type="button" onClick={closeCreate} disabled={saving}>
                                Close
                            </button>
                        </div>

                        {formErr ? <div className="leads-err">{formErr}</div> : null}

                        <form onSubmit={onCreate} className="leads-form">
                            <div className="leads-grid">
                                <Field label="Client Type">
                                    <select className="leads-input" value={form.clientType} onChange={(e) => setForm((p) => ({ ...p, clientType: e.target.value }))}>
                                        {CLIENT_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Client Name *">
                                    <input className="leads-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                                </Field>

                                <Field label="Date Contacted">
                                    <input className="leads-input" type="date" value={form.dateContacted} onChange={(e) => setForm((p) => ({ ...p, dateContacted: e.target.value }))} />
                                </Field>

                                <Field label="Source">
                                    <select className="leads-input" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}>
                                        {SOURCES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Phone *">
                                    <input className="leads-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+961..." />
                                </Field>

                                <Field label="Email">
                                    <input className="leads-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="name@email.com" />
                                </Field>

                                <Field label="Interested Country">
                                    <select className="leads-input" value={form.interestedArea} onChange={(e) => setForm((p) => ({ ...p, interestedArea: e.target.value }))}>
                                        <option value="">Any</option>
                                        {countriesLoading ? (
                                            <option value="" disabled>
                                                Loading countries...
                                            </option>
                                        ) : countries.length === 0 ? (
                                            <option value="" disabled>
                                                No countries found (check listings.country)
                                            </option>
                                        ) : (
                                            countries.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="leads-hint">
                                        Tip: countries are pulled from your listings (field: <b>country</b>).
                                    </div>
                                </Field>

                                <Field label="Bedrooms requirement">
                                    <select className="leads-input" value={form.bedrooms} onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))}>
                                        <option value="">Any</option>
                                        <option value="0">Studio</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4+</option>
                                    </select>
                                </Field>

                                <Field label="Budget Min">
                                    <input className="leads-input" value={form.budgetMin} onChange={(e) => setForm((p) => ({ ...p, budgetMin: e.target.value }))} inputMode="numeric" placeholder="600000" />
                                </Field>

                                <Field label="Budget Max">
                                    <input className="leads-input" value={form.budgetMax} onChange={(e) => setForm((p) => ({ ...p, budgetMax: e.target.value }))} inputMode="numeric" placeholder="850000" />
                                </Field>

                                <Field label="Urgency">
                                    <select className="leads-input" value={form.urgency} onChange={(e) => setForm((p) => ({ ...p, urgency: e.target.value }))}>
                                        {URGENCY.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Status">
                                    <select className="leads-input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                                        {STATUS_ADMIN.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="leads-span2">
                                    <Field label="Project Shared">
                                        <input className="leads-input" value={form.projectShared} onChange={(e) => setForm((p) => ({ ...p, projectShared: e.target.value }))} placeholder="Project name / listing sent" />
                                    </Field>
                                </div>

                                <div className="leads-span2">
                                    <Field label="Feedback">
                                        <textarea className="leads-textarea" value={form.feedback} onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))} placeholder="Client feedback..." />
                                    </Field>
                                </div>
                            </div>

                            <div className="leads-modalBottom">
                                <div className="leads-footnote">Required: name, phone.</div>
                                <div className="leads-modalBtns">
                                    <button className="leads-btnGhost" type="button" onClick={closeCreate} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="leads-btnPrimary" type="submit" disabled={!canCreate || saving}>
                                        {saving ? "Creating..." : "Create Lead"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SEARCH LISTINGS MODAL */}
            {searchOpen && searchLead && (
                <div className="leads-modalOverlay" onClick={closeSearch} role="presentation">
                    <div className="leads-modal leads-modal--xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="leads-modalTop leads-modalTop--stack">
                            <div>
                                <div className="leads-modalTitle">Matching Listings</div>
                                <div className="leads-modalSub">
                                    <b>{fullNameFromRow(searchLead)}</b> · Country: {searchLead.interestedArea || "Any"} · Beds: {bedsLabel(searchLead.bedrooms)} · Budget:{" "}
                                    {fmtBudget(searchLead.budgetMin, searchLead.budgetMax)}
                                </div>
                            </div>

                            <div className="leads-modalTools">
                                <input
                                    className="leads-input leads-input--compact"
                                    value={popupQuery}
                                    onChange={(e) => setPopupQuery(e.target.value)}
                                    placeholder="Filter results (title / city / area)…"
                                />
                                <button className="leads-btnGhost" type="button" onClick={closeSearch}>
                                    Close
                                </button>
                            </div>
                        </div>

                        {listingErr ? <div className="leads-err">{listingErr}</div> : null}

                        {listingLoading ? (
                            <div className="leads-muted">Loading listings…</div>
                        ) : matchedListings.length === 0 ? (
                            <div className="leads-muted">No matching listings found.</div>
                        ) : (
                            <div className="leads-results">
                                {matchedListings.slice(0, 80).map((p) => (
                                    <a key={p.id} className="leads-resultCard" href={`/listing/${p.id}`} target="_blank" rel="noreferrer">
                                        <div className="leads-resultTop">
                                            <div className="leads-resultTitle">{p.title || "Untitled"}</div>
                                            <div className="leads-resultMeta">
                                                {p.startingPrice ? `${p.currency || "USD"} ${Number(p.startingPrice).toLocaleString()}` : "Price on request"}
                                            </div>
                                        </div>

                                        <div className="leads-resultSub">
                                            <span>{p.country || "-"}</span>
                                            <span>·</span>
                                            <span>{p.city || p.area || "-"}</span>
                                            <span>·</span>
                                            <span>{bedsLabel(p.bedrooms)} beds</span>
                                        </div>

                                        <div className="leads-resultBadges">
                                            <span className="leads-badge">{String(p.category || "LISTING")}</span>
                                            <span className="leads-badge">{String(p.status || "AVAILABLE")}</span>
                                            {p.developerName ? <span className="leads-badge">{p.developerName}</span> : null}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/** ---------------- details ---------------- */
function AgentLeadDetails({ lead, onSearch, onCloseDeal, onEdit, onComplete, onSaveSchedule, onDelete }) {
    const kind = String(lead.kind || "ADMIN_LEAD").toUpperCase();
    const isSchedule = kind === "SCHEDULE_CALL";

    const name = fullNameFromRow(lead);
    const statusText = String(lead.status || "-").toUpperCase();

    const listingTitle = lead.listing?.title || "—";
    const listingId = lead.listing?.id || lead.listingId || "";

    const wa = `https://wa.me/${String(lead.phone || "").replace(/[^\d]/g, "")}`;

    // schedule call local fields (inline save only for schedule)
    const [schedStatus, setSchedStatus] = useState(String(lead.status || "NEW").toUpperCase());
    const [note, setNote] = useState(lead.note || "");

    useEffect(() => {
        setSchedStatus(String(lead.status || "NEW").toUpperCase());
        setNote(lead.note || "");
    }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function doSaveSchedule() {
        onSaveSchedule({
            status: schedStatus,
            note: note || null,
        });
    }

    const typeLabel = isSchedule ? "SCHEDULE CALL" : String(lead.clientType || "LEAD").toUpperCase();
    const isClosed = !isSchedule && statusText === "CLOSED";

    return (
        <div className="leads-details">
            <div className="leads-detailsHeader">
                <div>
                    <div className="leads-detailsName">{name}</div>
                    <div className="leads-detailsSub">
                        <span className="leads-uc">{typeLabel}</span>
                        <span className="leads-dot">•</span>
                        <span className="leads-uc">{statusText}</span>
                        <span className="leads-dot">•</span>
                        <span className="leads-uc">
                            {isSchedule ? "Created" : "Contacted"}: {isoDate(lead.createdAt || lead.dateContacted)}
                        </span>
                    </div>
                </div>

                <div className="leads-detailsActions">
                    {!isSchedule ? (
                        <>
                            <button className="leads-btnPrimary" type="button" onClick={onSearch}>
                                Search Listings
                            </button>

                            <button
                                className={`leads-btnGhost ${isClosed ? "is-disabled" : ""}`}
                                type="button"
                                onClick={onCloseDeal}
                                disabled={isClosed}
                                title={isClosed ? "Already closed" : "Close this deal"}
                            >
                                {isClosed ? "Deal Closed" : "Close Deal"}
                            </button>

                            <a className="leads-btnGhost" href={wa} target="_blank" rel="noreferrer">
                                WhatsApp
                            </a>

                            <button className="leads-btnGhost" type="button" onClick={onEdit}>
                                Edit
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="leads-btnPrimary" type="button" onClick={doSaveSchedule}>
                                Save
                            </button>

                            <button className="leads-btnGhost" type="button" onClick={onComplete}>
                                Complete
                            </button>

                            <button className="leads-btnPrimary leads-btnDanger" type="button" onClick={onDelete}>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="leads-detailsGrid">
                <KV label="Phone" value={lead.phone || "-"} />
                <KV label="Email" value={lead.email || "-"} />

                <KV
                    label="Listing"
                    value={
                        listingId ? (
                            <Link to={`/listing/${listingId}`} target="_blank" rel="noreferrer">
                                {listingTitle}
                            </Link>
                        ) : (
                            "—"
                        )
                    }
                />

                {!isSchedule ? (
                    <>
                        <KV label="Country" value={lead.interestedArea || "-"} />
                        <KV label="Beds" value={bedsLabel(lead.bedrooms)} />
                        <KV label="Budget" value={fmtBudget(lead.budgetMin, lead.budgetMax)} />
                        <KV
                            label="Urgency"
                            value={<span className={`leads-pill ${pillTone(lead.urgency)}`}>{String(lead.urgency || "-").toUpperCase()}</span>}
                        />
                        <KV label="Source" value={String(lead.source || "-").toUpperCase()} />
                        <KV label="Lead ID" value={lead.id} />
                    </>
                ) : (
                    <>
                        <KV label="Lead ID" value={lead.id} />
                        <Field label="Status">
                            <select className="leads-input" value={schedStatus} onChange={(e) => setSchedStatus(e.target.value)}>
                                {STATUS_SCHEDULE.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </>
                )}
            </div>

            {!isSchedule ? (
                <div className="leads-detailsBlocks">
                    <Block label="Project Shared" value={lead.projectShared || "-"} />
                    <Block label="Feedback" value={lead.feedback || "-"} />
                </div>
            ) : (
                <div className="leads-detailsBlocks">
                    <Block
                        label="Note"
                        value={<textarea className="leads-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note..." />}
                    />
                </div>
            )}
        </div>
    );
}

/** ---------------- ui atoms (same as admin) ---------------- */
function KV({ label, value }) {
    return (
        <div className="leads-kvBox">
            <div className="leads-k">{label}</div>
            <div className="leads-v">{value}</div>
        </div>
    );
}

function Block({ label, value }) {
    return (
        <div className="leads-block">
            <div className="leads-k">{label}</div>
            <div className="leads-blockValue">{value}</div>
        </div>
    );
}

function SelectPill({ label, value, onChange, options }) {
    return (
        <div className="leads-pillSel">
            <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o === "All" ? `${label}: All` : o}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="leads-field">
            <div className="leads-label">{label}</div>
            {children}
        </label>
    );
}