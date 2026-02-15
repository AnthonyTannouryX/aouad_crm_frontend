// frontend/src/admin/pages/LeadsPage.jsx
import { useEffect, useMemo, useState } from "react";
import "./leadsPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ✅ Prisma enums
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
];
const URGENCY = ["HOT", "WARM", "COLD"];
const STATUS = ["OPEN", "FOLLOW_UP", "CLOSED"];

function tokenOrThrow() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Missing token. Please login again.");
  return token;
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

function normText(s) {
  return String(s || "").toLowerCase().trim();
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

function bedsLabel(v) {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "STUDIO";
  if (n >= 4) return "4+";
  return String(n);
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

export default function LeadsPage() {
  const isMobile = useIsMobile(900);

  // list
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // agents
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // ✅ countries dropdown options (from listings)
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  // create modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // ✅ edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState("");

  // selected lead (details)
  const [selectedId, setSelectedId] = useState(null);
  const [detailsOpenMobile, setDetailsOpenMobile] = useState(false);

  // search listings modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLead, setSearchLead] = useState(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingErr, setListingErr] = useState("");
  const [listingsRaw, setListingsRaw] = useState([]);
  const [popupQuery, setPopupQuery] = useState("");

  // ✅ close deal modal
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeLead, setCloseLead] = useState(null);
  const [closing, setClosing] = useState(false);
  const [closeErr, setCloseErr] = useState("");

  const [form, setForm] = useState({
    clientType: "LEAD",
    name: "",
    dateContacted: isoDateToday(),
    source: "INSTAGRAM",
    phone: "",
    email: "",
    interestedArea: "", // country
    budgetMin: "",
    budgetMax: "",
    bedrooms: "",
    urgency: "WARM",
    status: "OPEN",
    agentAssignedId: "",
    projectShared: "",
    feedback: "",
  });

  const [editForm, setEditForm] = useState({
    clientType: "LEAD",
    name: "",
    dateContacted: isoDateToday(),
    source: "INSTAGRAM",
    phone: "",
    email: "",
    interestedArea: "",
    budgetMin: "",
    budgetMax: "",
    bedrooms: "",
    urgency: "WARM",
    status: "OPEN",
    agentAssignedId: "",
    projectShared: "",
    feedback: "",
  });

  const canCreate = useMemo(() => {
    return form.name.trim().length >= 2 && normPhone(form.phone).length >= 6;
  }, [form.name, form.phone]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setEdit = (key) => (e) => setEditForm((p) => ({ ...p, [key]: e.target.value }));

  const canEditSave = useMemo(() => {
    return editForm.name.trim().length >= 2 && normPhone(editForm.phone).length >= 6;
  }, [editForm.name, editForm.phone]);

  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/agents`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load agents");
      setAgents(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }

  async function loadLeads() {
    setLoading(true);
    setErr("");
    try {
      const token = tokenOrThrow();
      const res = await fetch(`${API_BASE}/admin/clients?limit=300`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load leads");
      const arr = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);

      setSelectedId((prev) => {
        if (prev && arr.some((x) => x.id === prev)) return prev;
        return arr[0]?.id || null;
      });
    } catch (e) {
      console.error(e);
      setItems([]);
      setErr(e.message || "Failed to load leads");
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadCountries() {
    setCountriesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/listings?limit=800`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load listings");
      const list = Array.isArray(data) ? data : data.items;
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
    loadAgents();
    loadLeads();
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agentNameById = useMemo(() => {
    const map = new Map(agents.map((a) => [a.id, a.fullName]));
    return (id) => map.get(id) || "-";
  }, [agents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((x) => {
      const urgency = String(x?.urgency || "").toUpperCase();
      const source = String(x?.source || "").toUpperCase();
      const status = String(x?.status || "").toUpperCase();

      if (urgencyFilter !== "All" && urgency !== urgencyFilter) return false;
      if (sourceFilter !== "All" && source !== sourceFilter) return false;
      if (statusFilter !== "All" && status !== statusFilter) return false;

      if (!q) return true;

      const hay = `${x?.name || ""} ${x?.phone || ""} ${x?.email || ""} ${x?.interestedArea || ""
        } ${x?.source || ""} ${x?.projectShared || ""} ${x?.clientType || ""
        } ${x?.bedrooms ?? ""}`;

      return hay.toLowerCase().includes(q);
    });
  }, [items, search, urgencyFilter, sourceFilter, statusFilter]);

  const selectedLead = useMemo(() => {
    return (
      filtered.find((x) => x.id === selectedId) ||
      items.find((x) => x.id === selectedId) ||
      null
    );
  }, [filtered, items, selectedId]);

  function openCreate() {
    setFormErr("");
    setForm({
      clientType: "LEAD",
      name: "",
      dateContacted: isoDateToday(),
      source: "INSTAGRAM",
      phone: "",
      email: "",
      interestedArea: "",
      budgetMin: "",
      budgetMax: "",
      bedrooms: "",
      urgency: "WARM",
      status: "OPEN",
      agentAssignedId: "",
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
      const token = tokenOrThrow();
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
        agentAssignedId: form.agentAssignedId || null,
        projectShared: form.projectShared.trim() || null,
        feedback: form.feedback.trim() || null,
      };

      const res = await fetch(`${API_BASE}/admin/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create lead");

      const created = data?.item || data;
      setItems((prev) => [created, ...prev].filter(Boolean));
      setSelectedId(created?.id || null);
      setOpen(false);
    } catch (e2) {
      console.error(e2);
      setFormErr(e2.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  function onSelectLead(id) {
    setSelectedId(id);
    if (isMobile) setDetailsOpenMobile(true);
  }

  // ✅ EDIT FLOW
  function openEdit(l) {
    if (!l) return;
    setEditErr("");
    setEditLead(l);

    setEditForm({
      clientType: l.clientType || "LEAD",
      name: l.name || "",
      dateContacted: l.dateContacted ? String(l.dateContacted).slice(0, 10) : isoDateToday(),
      source: l.source || "INSTAGRAM",
      phone: l.phone || "",
      email: l.email || "",
      interestedArea: l.interestedArea || "",
      budgetMin: l.budgetMin ?? "",
      budgetMax: l.budgetMax ?? "",
      bedrooms: l.bedrooms == null ? "" : String(l.bedrooms),
      urgency: l.urgency || "WARM",
      status: l.status || "OPEN",
      agentAssignedId: l.agentAssignedId || "",
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
      agentAssignedId: editForm.agentAssignedId || null,
      projectShared: editForm.projectShared.trim() || null,
      feedback: editForm.feedback.trim() || null,
    };

    const prevItems = items;
    // optimistic update
    setItems((curr) => curr.map((x) => (x.id === editLead.id ? { ...x, ...payload } : x)));

    try {
      const token = tokenOrThrow();
      const res = await fetch(`${API_BASE}/admin/clients/${editLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update lead");

      const updated = data?.item || data;

      if (updated?.id) {
        setItems((curr) => curr.map((x) => (x.id === updated.id ? updated : x)));
        setSelectedId(updated.id);
      }

      closeEdit();
    } catch (e2) {
      console.error(e2);
      // rollback
      setItems(prevItems);
      setEditErr(e2.message || "Failed to update lead");
    } finally {
      setEditing(false);
    }
  }

  async function openSearchForLead(l) {
    setSearchLead(l);
    setSearchOpen(true);
    setPopupQuery("");
    setListingErr("");
    setListingsRaw([]);
    setListingLoading(true);

    try {
      const res = await fetch(`${API_BASE}/public/listings?limit=800`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load listings");
      const list = Array.isArray(data) ? data : data.items;
      setListingsRaw(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setListingErr(e.message || "Failed to load listings");
    } finally {
      setListingLoading(false);
    }
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
        const hay = `${p?.title || ""} ${p?.country || ""} ${p?.city || ""} ${p?.area || ""} ${p?.community || ""
          } ${p?.locationLabel || ""}`;
        if (!normText(hay).includes(q)) return false;
      }

      return true;
    });

    res.sort((a, b) => listingPrice(a) - listingPrice(b));
    return res;
  }, [listingsRaw, searchLead, popupQuery]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchLead(null);
    setPopupQuery("");
  }

  // ✅ Close deal flow
  function openCloseDeal(l) {
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

    // Optimistic UI update
    const prevItems = items;
    setItems((curr) => curr.map((x) => (x.id === closeLead.id ? { ...x, status: "CLOSED" } : x)));

    try {
      const token = tokenOrThrow();

      const res = await fetch(`${API_BASE}/admin/clients/${closeLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to close deal");

      const updated = data?.item || data;

      if (updated?.id) {
        setItems((curr) => curr.map((x) => (x.id === updated.id ? updated : x)));
      }

      closeCloseDeal();
    } catch (e) {
      console.error(e);
      // rollback
      setItems(prevItems);
      setCloseErr(e.message || "Failed to close deal");
    } finally {
      setClosing(false);
    }
  }

  // ESC to close modals
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
            placeholder="Search name / phone / email / country"
          />
        </div>

        <SelectPill value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency" options={["All", ...URGENCY]} />
        <SelectPill value={sourceFilter} onChange={setSourceFilter} label="Source" options={["All", ...SOURCES]} />
        <SelectPill value={statusFilter} onChange={setStatusFilter} label="Status" options={["All", ...STATUS]} />

        <div className="leads-spacer" />

        <button className="leads-btnGhost" type="button" onClick={loadLeads} disabled={loading}>
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
                {filtered.map((l) => {
                  const active = l.id === selectedId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`leads-leadCard ${active ? "is-active" : ""}`}
                      onClick={() => onSelectLead(l.id)}
                    >
                      <div className="leads-leadTop">
                        <div className="leads-leadName">{l.name || "-"}</div>
                        <span className={`leads-pill ${pillTone(l.urgency)}`}>
                          {String(l.urgency || "-").toUpperCase()}
                        </span>
                      </div>

                      <div className="leads-leadMeta">
                        <span className="leads-uc">{String(l.clientType || "LEAD").toUpperCase()}</span>
                        <span className="leads-dot">•</span>
                        <span className="leads-uc">{String(l.source || "-").toUpperCase()}</span>
                      </div>

                      <div className="leads-leadRow">
                        <div className="leads-kv">
                          <div className="leads-k">Country</div>
                          <div className="leads-v">{l.interestedArea || "-"}</div>
                        </div>
                        <div className="leads-kv">
                          <div className="leads-k">Beds</div>
                          <div className="leads-v leads-uc">{bedsLabel(l.bedrooms)}</div>
                        </div>
                      </div>

                      <div className="leads-leadRow">
                        <div className="leads-kv">
                          <div className="leads-k">Budget</div>
                          <div className="leads-v">{fmtBudget(l.budgetMin, l.budgetMax)}</div>
                        </div>
                      </div>

                      <div className="leads-leadFoot">
                        <div className="leads-subline">
                          {l.dateContacted ? `Contacted: ${String(l.dateContacted).slice(0, 10)}` : "Contacted: -"}
                          {l.projectShared ? ` · Project: ${l.projectShared}` : ""}
                        </div>
                        <div className="leads-statusChip">{String(l.status || "-").toUpperCase()}</div>
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
              <LeadDetails
                lead={selectedLead}
                agentNameById={agentNameById}
                onSearch={() => openSearchForLead(selectedLead)}
                onCloseDeal={() => openCloseDeal(selectedLead)}
                onEdit={() => openEdit(selectedLead)}
              />
            )}
          </div>
        </div>
      </div>

      {/* DETAILS (mobile sheet) */}
      {detailsOpenMobile && selectedLead && (
        <div
          className="leads-modalOverlay leads-modalOverlay--sheet"
          onClick={() => setDetailsOpenMobile(false)}
          role="presentation"
        >
          <div className="leads-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="leads-sheetTop">
              <div>
                <div className="leads-modalTitle">{selectedLead.name || "-"}</div>
                <div className="leads-modalSub">
                  {String(selectedLead.clientType || "LEAD").toUpperCase()} ·{" "}
                  {String(selectedLead.source || "-").toUpperCase()}
                </div>
              </div>
              <button className="leads-btnGhost" type="button" onClick={() => setDetailsOpenMobile(false)}>
                Close
              </button>
            </div>

            <div className="leads-sheetBody">
              <LeadDetails
                lead={selectedLead}
                agentNameById={agentNameById}
                onSearch={() => openSearchForLead(selectedLead)}
                onCloseDeal={() => openCloseDeal(selectedLead)}
                onEdit={() => openEdit(selectedLead)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ CLOSE DEAL CONFIRM MODAL */}
      {closeOpen && closeLead && (
        <div className="leads-modalOverlay" onClick={closeCloseDeal} role="presentation">
          <div className="leads-modal leads-confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="leads-modalTop">
              <div>
                <div className="leads-modalTitle">Close deal?</div>
                <div className="leads-modalSub">
                  This will set <b>{closeLead.name}</b> status to <b>CLOSED</b>.
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
                <button
                  className="leads-btnPrimary leads-btnDanger"
                  type="button"
                  onClick={confirmCloseDeal}
                  disabled={closing}
                >
                  {closing ? "Closing..." : "Close Deal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ EDIT MODAL */}
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
                  <select className="leads-input" value={editForm.clientType} onChange={setEdit("clientType")}>
                    {CLIENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Client Name *">
                  <input className="leads-input" value={editForm.name} onChange={setEdit("name")} placeholder="John Doe" />
                </Field>

                <Field label="Date Contacted">
                  <input
                    className="leads-input"
                    type="date"
                    value={editForm.dateContacted}
                    onChange={setEdit("dateContacted")}
                  />
                </Field>

                <Field label="Source">
                  <select className="leads-input" value={editForm.source} onChange={setEdit("source")}>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Phone *">
                  <input className="leads-input" value={editForm.phone} onChange={setEdit("phone")} placeholder="+961..." />
                </Field>

                <Field label="Email">
                  <input
                    className="leads-input"
                    value={editForm.email}
                    onChange={setEdit("email")}
                    placeholder="name@email.com"
                  />
                </Field>

                <Field label="Interested Country">
                  <select className="leads-input" value={editForm.interestedArea} onChange={setEdit("interestedArea")}>
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
                  <select className="leads-input" value={editForm.bedrooms} onChange={setEdit("bedrooms")}>
                    <option value="">Any</option>
                    <option value="0">Studio</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </Field>

                <Field label="Agent assigned">
                  <select className="leads-input" value={editForm.agentAssignedId} onChange={setEdit("agentAssignedId")}>
                    <option value="">None</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                  {agentsLoading ? <div className="leads-hint">Loading agents…</div> : null}
                </Field>

                <Field label="Budget Min">
                  <input
                    className="leads-input"
                    value={editForm.budgetMin}
                    onChange={setEdit("budgetMin")}
                    inputMode="numeric"
                    placeholder="600000"
                  />
                </Field>

                <Field label="Budget Max">
                  <input
                    className="leads-input"
                    value={editForm.budgetMax}
                    onChange={setEdit("budgetMax")}
                    inputMode="numeric"
                    placeholder="850000"
                  />
                </Field>

                <Field label="Urgency">
                  <select className="leads-input" value={editForm.urgency} onChange={setEdit("urgency")}>
                    {URGENCY.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select className="leads-input" value={editForm.status} onChange={setEdit("status")}>
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="leads-span2">
                  <Field label="Project Shared">
                    <input
                      className="leads-input"
                      value={editForm.projectShared}
                      onChange={setEdit("projectShared")}
                      placeholder="Project name / listing sent"
                    />
                  </Field>
                </div>

                <div className="leads-span2">
                  <Field label="Feedback">
                    <textarea
                      className="leads-textarea"
                      value={editForm.feedback}
                      onChange={setEdit("feedback")}
                      placeholder="Client feedback..."
                    />
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
                <div className="leads-modalSub">Fill all details and assign to an agent.</div>
              </div>

              <button className="leads-btnGhost" type="button" onClick={closeCreate} disabled={saving}>
                Close
              </button>
            </div>

            {formErr ? <div className="leads-err">{formErr}</div> : null}

            <form onSubmit={onCreate} className="leads-form">
              <div className="leads-grid">
                <Field label="Client Type">
                  <select className="leads-input" value={form.clientType} onChange={set("clientType")}>
                    {CLIENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Client Name *">
                  <input className="leads-input" value={form.name} onChange={set("name")} placeholder="John Doe" />
                </Field>

                <Field label="Date Contacted">
                  <input className="leads-input" type="date" value={form.dateContacted} onChange={set("dateContacted")} />
                </Field>

                <Field label="Source">
                  <select className="leads-input" value={form.source} onChange={set("source")}>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Phone *">
                  <input className="leads-input" value={form.phone} onChange={set("phone")} placeholder="+961..." />
                </Field>

                <Field label="Email">
                  <input className="leads-input" value={form.email} onChange={set("email")} placeholder="name@email.com" />
                </Field>

                <Field label="Interested Country">
                  <select className="leads-input" value={form.interestedArea} onChange={set("interestedArea")}>
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
                  <select className="leads-input" value={form.bedrooms} onChange={set("bedrooms")}>
                    <option value="">Any</option>
                    <option value="0">Studio</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </Field>

                <Field label="Agent assigned">
                  <select className="leads-input" value={form.agentAssignedId} onChange={set("agentAssignedId")}>
                    <option value="">None</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                  {agentsLoading ? <div className="leads-hint">Loading agents…</div> : null}
                </Field>

                <Field label="Budget Min">
                  <input className="leads-input" value={form.budgetMin} onChange={set("budgetMin")} inputMode="numeric" placeholder="600000" />
                </Field>

                <Field label="Budget Max">
                  <input className="leads-input" value={form.budgetMax} onChange={set("budgetMax")} inputMode="numeric" placeholder="850000" />
                </Field>

                <Field label="Urgency">
                  <select className="leads-input" value={form.urgency} onChange={set("urgency")}>
                    {URGENCY.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select className="leads-input" value={form.status} onChange={set("status")}>
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="leads-span2">
                  <Field label="Project Shared">
                    <input
                      className="leads-input"
                      value={form.projectShared}
                      onChange={set("projectShared")}
                      placeholder="Project name / listing sent"
                    />
                  </Field>
                </div>

                <div className="leads-span2">
                  <Field label="Feedback">
                    <textarea className="leads-textarea" value={form.feedback} onChange={set("feedback")} placeholder="Client feedback..." />
                  </Field>
                </div>
              </div>

              <div className="leads-modalBottom">
                <div className="leads-footnote">Required: client name, phone.</div>
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
                  <b>{searchLead.name}</b> · Country: {searchLead.interestedArea || "Any"} · Beds:{" "}
                  {bedsLabel(searchLead.bedrooms)} · Budget: {fmtBudget(searchLead.budgetMin, searchLead.budgetMax)}
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

function LeadDetails({ lead, agentNameById, onSearch, onCloseDeal, onEdit }) {
  const wa = `https://wa.me/${String(lead.phone || "").replace(/[^\d]/g, "")}`;
  const isClosed = String(lead.status || "").toUpperCase() === "CLOSED";

  return (
    <div className="leads-details">
      <div className="leads-detailsHeader">
        <div>
          <div className="leads-detailsName">{lead.name || "-"}</div>
          <div className="leads-detailsSub">
            <span className="leads-uc">{String(lead.clientType || "LEAD").toUpperCase()}</span>
            <span className="leads-dot">•</span>
            <span className="leads-uc">{String(lead.source || "-").toUpperCase()}</span>
            <span className="leads-dot">•</span>
            <span className="leads-uc">{String(lead.status || "-").toUpperCase()}</span>
          </div>
        </div>

        <div className="leads-detailsActions">
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
        </div>
      </div>

      <div className="leads-detailsGrid">
        <KV label="Phone" value={lead.phone || "-"} />
        <KV label="Email" value={lead.email || "-"} />
        <KV label="Country" value={lead.interestedArea || "-"} />
        <KV label="Beds" value={bedsLabel(lead.bedrooms)} />
        <KV label="Budget" value={fmtBudget(lead.budgetMin, lead.budgetMax)} />
        <KV
          label="Urgency"
          value={
            <span className={`leads-pill ${pillTone(lead.urgency)}`}>
              {String(lead.urgency || "-").toUpperCase()}
            </span>
          }
        />
        <KV label="Date Contacted" value={lead.dateContacted ? String(lead.dateContacted).slice(0, 10) : "-"} />
        <KV label="Agent" value={lead.agentAssignedId ? agentNameById(lead.agentAssignedId) : "-"} />
      </div>

      <div className="leads-detailsBlocks">
        <Block label="Project Shared" value={lead.projectShared || "-"} />
        <Block label="Feedback" value={lead.feedback || "-"} />
      </div>
    </div>
  );
}

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
