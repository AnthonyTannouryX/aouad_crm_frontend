import { useEffect, useMemo, useRef, useState } from "react";
import "./AgentsPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fileExt(file) {
  const name = file?.name || "";
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "jpg";
  return name.slice(dot + 1).toLowerCase();
}

async function putToSignedUrl(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error("Image upload failed");
}

function avatarUrl(fullName) {
  const name = fullName?.trim() ? fullName.trim() : "Agent";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0D1B2A&color=ffffff&bold=true&size=128`;
}

function tokenOrThrow() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Missing token. Please login again.");
  return token;
}

export default function AgentsPage() {
  const fileRef = useRef(null);

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [error, setError] = useState("");

  // show inactive
  const [showHidden, setShowHidden] = useState(false);

  // edit mode
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  // ✅ Languages are now an array (checkboxes)
  const LANG_OPTIONS = ["Arabic", "English", "French"];

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "", // create required
    newPassword: "", // edit optional

    slug: "",
    title: "Property Consultant",
    bio: "",
    languages: ["English"],
    sortOrder: 0,
  });

  const suggestedSlug = useMemo(() => slugify(form.fullName), [form.fullName]);

  const set = (key) => (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [key]: v }));
  };

  const toggleLang = (lang) => {
    setForm((p) => {
      const has = p.languages.includes(lang);
      const next = has
        ? p.languages.filter((x) => x !== lang)
        : [...p.languages, lang];
      return { ...p, languages: next };
    });
  };

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function loadAgents(opts = {}) {
    const includeInactive = opts.includeInactive ?? showHidden;

    setLoading(true);
    try {
      setError("");
      const token = tokenOrThrow();

      const qs = new URLSearchParams();
      qs.set("role", "AGENT");
      if (includeInactive) qs.set("includeInactive", "true");

      const res = await fetch(`${API_BASE}/users?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load agents");
      setAgents(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setAgents([]);
      setError(e.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents({ includeInactive: showHidden });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden]);

  const canCreate = useMemo(() => {
    return (
      form.fullName.trim().length >= 2 &&
      form.email.trim().includes("@") &&
      form.password.trim().length >= 6
    );
  }, [form.fullName, form.email, form.password]);

  const canEdit = useMemo(() => {
    if (form.fullName.trim().length < 2) return false;
    if (!form.email.trim().includes("@")) return false;
    if (form.newPassword && form.newPassword.trim().length > 0) {
      return form.newPassword.trim().length >= 6;
    }
    return true;
  }, [form.fullName, form.email, form.newPassword]);

  const resetFormCreate = () => {
    setMode("create");
    setEditingId(null);
    setExistingPhotoUrl(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      newPassword: "",
      slug: "",
      title: "Property Consultant",
      bio: "",
      languages: ["English"],
      sortOrder: 0,
    });
  };

  const openCreateModal = () => {
    setError("");
    resetFormCreate();
    setOpen(true);
  };

  const openEditModal = (agent) => {
    setError("");
    setMode("edit");
    setEditingId(agent.id);
    setExistingPhotoUrl(agent.photoUrl || null);
    setPhotoFile(null);
    setPhotoPreview(null);

    setForm({
      fullName: agent.fullName || "",
      email: agent.email || "",
      phone: agent.phone || "",
      password: "", // unused in edit
      newPassword: "",

      slug: agent.slug || "",
      title: agent.title || "Property Consultant",
      bio: agent.bio || "",
      languages: Array.isArray(agent.languages) && agent.languages.length ? agent.languages : ["English"],
      sortOrder: Number(agent.sortOrder) || 0,
    });

    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
  };

  const pickPhoto = () => fileRef.current?.click();

  const onPickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (f.size > 7 * 1024 * 1024) {
      setError("Image is too large. Max 7MB.");
      return;
    }

    setError("");
    setPhotoFile(f);
    e.target.value = "";
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // In edit mode, removing means "clear photo"
    if (mode === "edit") setExistingPhotoUrl(null);
  };

  const uploadPhotoIfAny = async (token) => {
    // If user picked a new file, upload it and return the new public URL
    if (photoFile) {
      const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "agent-photo",
          contentType: photoFile.type || "application/octet-stream",
          ext: fileExt(photoFile),
        }),
      });

      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) throw new Error(presignData?.error || "Presign failed");

      const first = presignData?.uploads?.[0];
      if (!first?.uploadUrl || !first?.publicUrl) {
        throw new Error("Presign response missing uploadUrl/publicUrl");
      }

      await putToSignedUrl(first.uploadUrl, photoFile);
      return first.publicUrl;
    }

    // No new file picked:
    // - create mode: null
    // - edit mode: keep existingPhotoUrl (may be null if user removed)
    return mode === "edit" ? existingPhotoUrl : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (mode === "create" && !canCreate) return;
    if (mode === "edit" && !canEdit) return;

    setSaving(true);
    setError("");

    try {
      const token = tokenOrThrow();

      const finalSlug = form.slug.trim() ? slugify(form.slug) : suggestedSlug;
      if (!finalSlug) throw new Error("Slug cannot be empty.");

      const photoUrl = await uploadPhotoIfAny(token);

      if (mode === "create") {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() ? form.phone.trim() : null,
          password: form.password.trim(),

          slug: finalSlug,
          title: form.title.trim() ? form.title.trim() : null,
          bio: form.bio.trim() ? form.bio.trim() : null,
          languages: Array.isArray(form.languages) ? form.languages : [],
          photoUrl,
          sortOrder: Number(form.sortOrder) || 0,
        };

        const res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to create agent");

        setOpen(false);
        await loadAgents({ includeInactive: showHidden });
        return;
      }

      // edit
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() ? form.phone.trim() : null,

        slug: finalSlug,
        title: form.title.trim() ? form.title.trim() : null,
        bio: form.bio.trim() ? form.bio.trim() : null,
        languages: Array.isArray(form.languages) ? form.languages : [],
        photoUrl: photoUrl || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      // optional password change (backend expects "password")
      if (form.newPassword && form.newPassword.trim().length > 0) {
        payload.password = form.newPassword.trim();
      }

      const res = await fetch(`${API_BASE}/users/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update agent");

      setOpen(false);
      await loadAgents({ includeInactive: showHidden });
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Hide/Unhide (isActive toggle)
  const setAgentActive = async (agent, nextActive) => {
    if (togglingId) return;

    const verb = nextActive ? "Unhide" : "Hide";
    const ok = window.confirm(`${verb} agent "${agent.fullName}"?`);
    if (!ok) return;

    setTogglingId(agent.id);
    setError("");

    // optimistic UI
    setAgents((prev) =>
      prev.map((x) => (x.id === agent.id ? { ...x, isActive: nextActive } : x))
    );

    try {
      const token = tokenOrThrow();

      const res = await fetch(`${API_BASE}/users/${agent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextActive }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await loadAgents({ includeInactive: showHidden });
        throw new Error(data?.error || "Failed to update agent");
      }

      if (!showHidden && nextActive === false) {
        setAgents((prev) => prev.filter((x) => x.id !== agent.id));
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update agent");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="ag">
      <div className="ag-card">
        <div className="ag-top">
          <div>
            <div className="ag-title">Agents</div>
            <div className="ag-sub">Manage your team members and their profiles.</div>
          </div>

          <div className="ag-topRight">
            <label className={`ag-pill ${showHidden ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span>Show hidden</span>
            </label>

            <button className="ag-btn ag-btnPrimary" type="button" onClick={openCreateModal}>
              + Add Agent
            </button>
          </div>
        </div>

        {error && <div className="ag-alert">{error}</div>}

        {loading ? (
          <div className="ag-muted" style={{ marginTop: 14 }}>
            Loading…
          </div>
        ) : (
          <div className="ag-list">
            {agents.length === 0 ? (
              <div className="ag-empty">
                {showHidden ? "No agents (active or hidden)." : "No active agents yet."}
              </div>
            ) : (
              agents.map((a) => {
                const isHidden = a.isActive === false;

                return (
                  <div key={a.id} className={`ag-row ${isHidden ? "is-hidden" : ""}`}>
                    <div className="ag-left">
                      <img
                        className="ag-avatar"
                        src={a.photoUrl || avatarUrl(a.fullName)}
                        alt={a.fullName || "Agent"}
                        onError={(e) => {
                          e.currentTarget.src = avatarUrl("Agent");
                        }}
                      />
                      <div className="ag-meta">
                        <div className="ag-name">
                          {a.fullName}
                          {isHidden && <span className="ag-badge">Hidden</span>}
                        </div>

                        <div className="ag-line">
                          {a.title || "Property Consultant"} · {a.email}
                        </div>

                        {!!a.languages?.length && (
                          <div className="ag-line ag-lineMuted">{a.languages.join(" · ")}</div>
                        )}
                      </div>
                    </div>

                    <div className="ag-actions">
                      <div className="ag-slug">{a.slug ? `/${a.slug}` : ""}</div>

                      <button
                        type="button"
                        onClick={() => openEditModal(a)}
                        className="ag-btn ag-btnGhost"
                        title="Edit agent"
                        disabled={togglingId === a.id}
                      >
                        Edit
                      </button>

                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => setAgentActive(a, true)}
                          disabled={togglingId === a.id}
                          className="ag-btn ag-btnGhost"
                          title="Unhide agent"
                        >
                          {togglingId === a.id ? "Saving…" : "Unhide"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAgentActive(a, false)}
                          disabled={togglingId === a.id}
                          className="ag-btn ag-btnDanger"
                          title="Hide agent"
                        >
                          {togglingId === a.id ? "Saving…" : "Hide"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {open && (
        <div className="ag-modalOverlay" onClick={closeModal} role="presentation">
          <div className="ag-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ag-modalHeader">
              <div>
                <div className="ag-modalTitle">{mode === "edit" ? "Edit Agent" : "Add Agent"}</div>
                <div className="ag-modalSub">
                  {mode === "edit"
                    ? "Update agent profile. Leave password empty to keep it unchanged."
                    : "Create a new agent and upload a profile photo."}
                </div>
              </div>
              <button className="ag-btn ag-btnGhost" type="button" onClick={closeModal} disabled={saving}>
                Close
              </button>
            </div>

            <form onSubmit={onSubmit} className="ag-form">
              <div className="ag-grid">
                {/* PHOTO */}
                <div className="ag-photoCard">
                  <div className="ag-label">Profile photo</div>

                  <div className="ag-drop" onClick={pickPhoto} role="button" tabIndex={0}>
                    {photoPreview ? (
                      <img className="ag-photoPreview" src={photoPreview} alt="Preview" />
                    ) : existingPhotoUrl ? (
                      <img className="ag-photoPreview" src={existingPhotoUrl} alt="Current" />
                    ) : (
                      <div className="ag-dropInner">
                        <div className="ag-dropTitle">Click to upload</div>
                        <div className="ag-dropHint">PNG/JPG · Max 7MB</div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickPhoto}
                    style={{ display: "none" }}
                  />

                  <div className="ag-photoBtns">
                    <button type="button" className="ag-btn ag-btnGhost" onClick={pickPhoto} disabled={saving}>
                      Choose file
                    </button>
                    <button
                      type="button"
                      className="ag-btn ag-btnGhost"
                      onClick={removePhoto}
                      disabled={saving || (!photoFile && !existingPhotoUrl)}
                      style={{ opacity: !photoFile && !existingPhotoUrl ? 0.55 : 1 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* FIELDS */}
                <div className="ag-fieldsCard">
                  <div className="ag-fieldsGrid">
                    <div>
                      <div className="ag-label">Full name *</div>
                      <input className="ag-input" value={form.fullName} onChange={set("fullName")} />
                    </div>

                    <div>
                      <div className="ag-label">Email *</div>
                      <input className="ag-input" value={form.email} onChange={set("email")} />
                    </div>

                    <div>
                      <div className="ag-label">Phone</div>
                      <input className="ag-input" value={form.phone} onChange={set("phone")} />
                    </div>

                    {mode === "create" ? (
                      <div>
                        <div className="ag-label">Password (min 6) *</div>
                        <input
                          className="ag-input"
                          type="password"
                          value={form.password}
                          onChange={set("password")}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="ag-label">New password (optional)</div>
                        <input
                          className="ag-input"
                          type="password"
                          value={form.newPassword}
                          onChange={set("newPassword")}
                          placeholder="Leave empty to keep current"
                        />
                      </div>
                    )}

                    <div className="ag-span2">
                      <div className="ag-label">Title</div>
                      <input className="ag-input" value={form.title} onChange={set("title")} />
                    </div>

                    {/* LANGUAGES */}
                    <div className="ag-span2">
                      <div className="ag-label">Languages</div>

                      <div className="ag-langGrid">
                        {LANG_OPTIONS.map((lang) => {
                          const checked = form.languages.includes(lang);
                          return (
                            <label key={lang} className={`ag-langItem ${checked ? "is-checked" : ""}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleLang(lang)} />
                              <span>{lang}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="ag-chips">
                        {(form.languages.length ? form.languages : ["English"]).map((lang) => (
                          <span key={lang} className="ag-chip">
                            {lang}
                            <span className="ag-chipTick">✓</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ag-span2">
                      <div className="ag-label">Slug</div>
                      <input
                        className="ag-input"
                        value={form.slug}
                        onChange={set("slug")}
                        placeholder={suggestedSlug || "e.g. abdullah"}
                      />
                      <div className="ag-hint">
                        Suggested: <b>{suggestedSlug || "-"}</b>
                      </div>
                    </div>

                    <div className="ag-span2">
                      <div className="ag-label">Sort order</div>
                      <input
                        className="ag-input"
                        type="number"
                        value={form.sortOrder}
                        onChange={set("sortOrder")}
                      />
                      <div className="ag-hint">Lower comes first.</div>
                    </div>

                    <div className="ag-span2">
                      <div className="ag-label">Bio</div>
                      <textarea className="ag-textarea" value={form.bio} onChange={set("bio")} style={{ minHeight: 120 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ag-footer">
                <div className="ag-footNote">
                  {mode === "create" ? "Required: full name, email, password." : "Required: full name, email."}
                </div>

                <div className="ag-footerBtns">
                  <button type="button" className="ag-btn ag-btnGhost" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ag-btn ag-btnPrimary"
                    disabled={mode === "create" ? !canCreate || saving : !canEdit || saving}
                  >
                    {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Create Agent"}
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
