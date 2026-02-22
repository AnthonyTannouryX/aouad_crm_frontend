// src/admin/pages/AddListingPage.jsx
import { useEffect, useMemo, useState } from "react";
import "./AddListingPage.css";
import LocationPicker from "../components/LocationPicker.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const LISTING_TYPES = [
  { value: "OFF_PLAN", label: "Off-Plan" },
  { value: "FOR_SALE", label: "For Sale" },
  { value: "FOR_RENT", label: "For Rent" },
];

const CURRENCIES = ["USD", "AED", "EUR"];

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "LAND", label: "Land" },
];

const CATEGORIES = [
  { value: "OFF_PLAN", label: "Off-Plan" },
  { value: "READY", label: "Ready" },
  { value: "SECONDARY", label: "Secondary" },
];

/** Countries used by PopularCountries (slug must match query param country=slug) */
const COUNTRIES = [
  { name: "Dubai", slug: "dubai", center: { lat: 25.2048, lng: 55.2708 } },
  { name: "Lebanon", slug: "lebanon", center: { lat: 33.8938, lng: 35.5018 } },
  { name: "Saudi Arabia", slug: "saudi-arabia", center: { lat: 24.7136, lng: 46.6753 } },
  { name: "Greece", slug: "greece", center: { lat: 37.9838, lng: 23.7275 } },
  { name: "Cyprus", slug: "cyprus", center: { lat: 35.1856, lng: 33.3823 } },
  { name: "France", slug: "france", center: { lat: 48.8566, lng: 2.3522 } },
  { name: "Spain", slug: "spain", center: { lat: 40.4168, lng: -3.7038 } },
  { name: "Italy", slug: "italy", center: { lat: 41.9028, lng: 12.4964 } },
];

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
  if (!res.ok) throw new Error("Failed to upload file to storage");
}

function coverUrl(listing) {
  const imgs = listing?.images || [];
  const cover = imgs.find((x) => x.isCover) || imgs[0];
  return cover?.url || "";
}

function badgeLabel(type) {
  return LISTING_TYPES.find((x) => x.value === type)?.label || type || "-";
}

function isHidden(listing) {
  return !!(listing?.isHidden || listing?.hidden);
}

function hasLocation(listing) {
  return (
    listing?.latitude != null &&
    listing?.longitude != null &&
    listing.latitude !== "" &&
    listing.longitude !== ""
  );
}

export default function AddListingPage() {
  // list
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // agents
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // edit mode
  const [editingId, setEditingId] = useState(null);
  const [editingCoverUrl, setEditingCoverUrl] = useState("");
  const [editingGalleryImages, setEditingGalleryImages] = useState([]); // ✅ NEW: [{id,url}...]

  const [form, setForm] = useState({
    country: "dubai",

    // ✅ map fields
    latitude: "",
    longitude: "",
    addressText: "",

    propertyType: "APARTMENT",
    category: "OFF_PLAN",
    city: "Dubai",
    area: "",

    listingType: "OFF_PLAN",
    featured: true,

    completionYear: "",
    developerName: "",
    locationLabel: "",

    startingPrice: "",
    currency: "USD",
    paymentPlan: "",
    description: "",

    bedrooms: "",
    bathrooms: "",
    parking: "",
    sizeSqft: "",
    sizeSqm: "",

    title: "",
    assignedAgentId: "",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const isEdit = !!editingId;

  const canSave = useMemo(() => {
    const baseOk =
      form.title.trim().length >= 2 &&
      form.area.trim().length >= 2 &&
      form.city.trim().length >= 2;

    const hasCover =
      !!coverFile || (isEdit && (editingCoverUrl || "").trim().length > 0);

    return baseOk && hasCover;
  }, [form.title, form.area, form.city, coverFile, isEdit, editingCoverUrl]);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: val }));
  };

  const tokenOrThrow = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing token. Please login again.");
    return token;
  };

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

  async function loadListings() {
    setLoading(true);
    setListError("");
    try {
      const token = tokenOrThrow();

      const res = await fetch(
        `${API_BASE}/listings?includeHidden=true&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load listings");
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
      setItems([]);
      setListError(e.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAll = () => {
    setError("");
    setEditingId(null);
    setEditingCoverUrl("");
    setEditingGalleryImages([]); // ✅ NEW

    setForm({
      country: "dubai",

      latitude: "",
      longitude: "",
      addressText: "",

      propertyType: "APARTMENT",
      category: "OFF_PLAN",
      city: "Dubai",
      area: "",

      listingType: "OFF_PLAN",
      featured: true,

      completionYear: "",
      developerName: "",
      locationLabel: "",

      startingPrice: "",
      currency: "USD",
      paymentPlan: "",
      description: "",

      bedrooms: "",
      bathrooms: "",
      parking: "",
      sizeSqft: "",
      sizeSqm: "",

      title: "",
      assignedAgentId: "",
    });

    setCoverFile(null);
    setGalleryFiles([]);
    setCoverPreview(null);
    setGalleryPreviews([]);
  };

  const openModalCreate = () => {
    resetAll();
    setOpen(true);
  };

  const openModalEdit = (listing) => {
    setError("");
    setEditingId(listing.id);
    setEditingCoverUrl(coverUrl(listing) || "");

    // ✅ NEW: show all existing images for this listing (excluding cover)
    const imgs = Array.isArray(listing?.images) ? listing.images : [];
    const cover = imgs.find((x) => x.isCover) || imgs[0] || null;

    setEditingGalleryImages(
      imgs
        .filter((x) => x && x.id && x.url)
        .filter((x) => (cover?.url ? x.url !== cover.url : true))
        .map((x) => ({ id: x.id, url: x.url }))
    );

    setForm({
      country: listing.country || "dubai",

      latitude: listing.latitude ?? "",
      longitude: listing.longitude ?? "",
      addressText: listing.addressText ?? "",

      propertyType: listing.propertyType || "APARTMENT",
      category: listing.category || "OFF_PLAN",
      city: listing.city || "Dubai",
      area: listing.area || "",

      listingType: listing.listingType || "OFF_PLAN",
      featured: !!listing.featured,

      completionYear: listing.completionYear ?? "",
      developerName: listing.developerName || "",
      locationLabel: listing.locationLabel || "",

      startingPrice: listing.startingPrice ?? "",
      currency: listing.currency || "USD",
      paymentPlan: listing.paymentPlan || "",
      description: listing.description || "",

      bedrooms: listing.bedrooms ?? "",
      bathrooms: listing.bathrooms ?? "",
      parking: listing.parking ?? "",
      sizeSqft: listing.sizeSqft ?? "",
      sizeSqm: listing.sizeSqm ?? "",

      title: listing.title || "",
      assignedAgentId: listing.assignedAgentId || "",
    });

    setCoverFile(null);
    setGalleryFiles([]);

    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
  };

  const onCountryChange = (e) => {
    const slug = e.target.value;
    const c = COUNTRIES.find((x) => x.slug === slug);
    setForm((p) => ({
      ...p,
      country: slug,
      city: c?.name || p.city,
    }));
  };

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Max 100MB.");
      return;
    }

    setError("");
    setCoverFile(file);
    e.target.value = "";
  };

  const onPickGallery = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setError("Gallery must be image files only.");
        e.target.value = "";
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("A gallery image is too large. Max 100MB each.");
        e.target.value = "";
        return;
      }
    }

    setError("");
    setGalleryFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const filtered = files.filter((f) => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...filtered];
    });

    e.target.value = "";
  };

  const removeGalleryItem = (idx) =>
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAllGallery = () => setGalleryFiles([]);

  // ✅ NEW: delete an EXISTING DB image (not the local preview)
  const deleteExistingImage = async (imageId) => {
    if (!editingId || !imageId) return;
    const ok = window.confirm("Delete this photo?");
    if (!ok) return;

    try {
      const token = tokenOrThrow();

      const res = await fetch(
        `${API_BASE}/uploads/listing/${editingId}/images/${imageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete image");

      // remove from modal gallery
      setEditingGalleryImages((prev) => prev.filter((x) => x.id !== imageId));

      // also update the list row locally so counts stay correct
      setItems((prev) =>
        prev.map((l) => {
          if (l.id !== editingId) return l;
          const imgs = Array.isArray(l.images) ? l.images : [];
          return { ...l, images: imgs.filter((im) => im.id !== imageId) };
        })
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to delete image");
    }
  };

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    galleryPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    const next = galleryFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setGalleryPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryFiles]);

  const onDeleteListing = async (listing) => {
    if (deletingId) return;

    const ok = window.confirm(
      `Delete listing "${listing.title}"?\n\nThis is a soft delete.`
    );
    if (!ok) return;

    setDeletingId(listing.id);
    setListError("");

    try {
      const token = tokenOrThrow();
      setItems((prev) => prev.filter((x) => x.id !== listing.id));

      const res = await fetch(`${API_BASE}/listings/${listing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await loadListings();
        throw new Error(data?.error || "Failed to delete listing");
      }
    } catch (e) {
      console.error(e);
      setListError(e.message || "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  const onToggleHidden = async (listing) => {
    if (togglingId) return;

    const nextHidden = !isHidden(listing);
    const ok = window.confirm(`${nextHidden ? "Hide" : "Unhide"} "${listing.title}"?`);
    if (!ok) return;

    setTogglingId(listing.id);
    setListError("");

    setItems((prev) =>
      prev.map((x) => (x.id === listing.id ? { ...x, isHidden: nextHidden } : x))
    );

    try {
      const token = tokenOrThrow();

      const res = await fetch(`${API_BASE}/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isHidden: nextHidden }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await loadListings();
        throw new Error(data?.error || "Failed to update visibility");
      }
    } catch (e) {
      console.error(e);
      setListError(e.message || "Failed to update visibility");
      await loadListings();
    } finally {
      setTogglingId(null);
    }
  };

  const toIntOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return n;
  };

  const toFloatOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setError("");

    try {
      const token = tokenOrThrow();

      const payload = {
        title: form.title,
        country: form.country,

        // ✅ map fields
        latitude: toFloatOrNull(form.latitude),
        longitude: toFloatOrNull(form.longitude),
        addressText: form.addressText?.trim() ? form.addressText.trim() : null,

        propertyType: form.propertyType,
        category: form.category,
        city: form.city,
        area: form.area,

        paymentPlan: form.paymentPlan || null,

        listingType: form.listingType,
        featured: !!form.featured,

        completionYear: toIntOrNull(form.completionYear),
        developerName: form.developerName || null,
        locationLabel: form.locationLabel || null,

        startingPrice: toIntOrNull(form.startingPrice),
        currency: form.currency,
        description: form.description || null,

        bedrooms: toIntOrNull(form.bedrooms),
        bathrooms: toIntOrNull(form.bathrooms),
        parking: toIntOrNull(form.parking),
        sizeSqft: toIntOrNull(form.sizeSqft),
        sizeSqm: toIntOrNull(form.sizeSqm),

        assignedAgentId: form.assignedAgentId?.trim()
          ? form.assignedAgentId.trim()
          : null,
      };

      let listingId = editingId;

      if (!editingId) {
        const createRes = await fetch(`${API_BASE}/listings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payload, isHidden: false }),
        });

        const createJson = await createRes.json().catch(() => ({}));
        if (!createRes.ok) throw new Error(createJson?.error || "Failed to create listing");

        listingId = createJson.id;
        if (!listingId) throw new Error("Create listing response missing id");
      } else {
        const updateRes = await fetch(`${API_BASE}/listings/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const updateJson = await updateRes.json().catch(() => ({}));
        if (!updateRes.ok) throw new Error(updateJson?.error || "Failed to update listing");
      }

      const hasNewMedia = !!coverFile || galleryFiles.length > 0;

      if (!editingId || hasNewMedia) {
        const filesForPresign = [
          ...(coverFile
            ? [
              {
                contentType: coverFile.type || "application/octet-stream",
                ext: fileExt(coverFile),
                isCover: true,
                sizeBytes: coverFile.size,
              },
            ]
            : []),
          ...galleryFiles.map((f) => ({
            contentType: f.type || "application/octet-stream",
            ext: fileExt(f),
            isCover: false,
            sizeBytes: f.size,
          })),
        ];

        if (filesForPresign.length > 0) {
          const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ listingId, files: filesForPresign }),
          });

          const presignJson = await presignRes.json().catch(() => ({}));
          if (!presignRes.ok) throw new Error(presignJson?.error || "Failed to presign uploads");

          const uploads = presignJson.uploads || [];
          if (!uploads.length) throw new Error("No uploads returned from presign");

          const allFilesInOrder = [...(coverFile ? [coverFile] : []), ...galleryFiles];

          for (let i = 0; i < uploads.length; i++) {
            await putToSignedUrl(uploads[i].uploadUrl, allFilesInOrder[i]);
          }

          const saveRes = await fetch(`${API_BASE}/uploads/listing/${listingId}/images`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              images: uploads.map((u) => ({
                key: u.key,
                url: u.publicUrl,
                isCover: !!u.isCover,
              })),
            }),
          });

          const saveJson = await saveRes.json().catch(() => ({}));
          if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save images to DB");
        }
      }

      setOpen(false);
      resetAll();
      await loadListings();
      alert(editingId ? "✅ Listing updated" : "✅ Listing created");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  const countryCenter = useMemo(() => {
    const c = COUNTRIES.find((x) => x.slug === form.country);
    return c?.center || { lat: 25.2048, lng: 55.2708 };
  }, [form.country]);

  const locationValue =
    form.latitude !== "" && form.longitude !== ""
      ? { lat: Number(form.latitude), lng: Number(form.longitude) }
      : null;

  return (
    <div className="al">
      <div className="al-card">
        <div className="al-top">
          <div>
            <div className="al-title">Listings</div>
            <div className="al-sub">Manage your listings and their media.</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="al-btn al-btnGhost" type="button" onClick={loadListings} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="al-btn al-btnPrimary" type="button" onClick={openModalCreate}>
              + Add Listing
            </button>
          </div>
        </div>

        {listError && <div className="al-alert">{listError}</div>}

        {loading ? (
          <div className="al-muted" style={{ marginTop: 14 }}>
            Loading…
          </div>
        ) : (
          <div className="al-list">
            {items.length === 0 ? (
              <div className="al-empty">No listings yet.</div>
            ) : (
              items.map((l) => (
                <div key={l.id} className="al-row">
                  <div className="al-leftRow">
                    <img
                      className="al-thumb"
                      src={coverUrl(l) || "https://via.placeholder.com/80x80?text=No+Img"}
                      alt={l.title || "Listing"}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/80x80?text=No+Img";
                      }}
                    />

                    <div className="al-meta">
                      <div className="al-nameRow">
                        <div className="al-name">{l.title}</div>
                        {l.featured ? <span className="al-tag">Featured</span> : null}
                        <span className="al-tag al-tagSoft">{badgeLabel(l.listingType)}</span>
                        {isHidden(l) ? <span className="al-tag al-tagHidden">Hidden</span> : null}
                        {hasLocation(l) ? <span className="al-tag al-tagSoft">Has location</span> : null}
                      </div>

                      <div className="al-line">
                        {l.area} · {l.city}
                        {l.country ? ` · ${l.country}` : ""}
                      </div>

                      <div className="al-line al-lineMuted">
                        {l.developerName ? `${l.developerName} · ` : ""}
                        {l.startingPrice
                          ? `${l.currency || "USD"} ${Number(l.startingPrice).toLocaleString()}`
                          : "No price"}{" "}
                        · {Array.isArray(l.images) ? `${l.images.length} photos` : "0 photos"}
                      </div>
                    </div>
                  </div>

                  <div className="al-actionsRow">
                    <button type="button" className="al-btn al-btnGhost" onClick={() => openModalEdit(l)} title="Edit listing">
                      Edit
                    </button>

                    <button
                      type="button"
                      className="al-btn al-btnGhost"
                      disabled={togglingId === l.id}
                      onClick={() => onToggleHidden(l)}
                      title={isHidden(l) ? "Unhide listing" : "Hide listing"}
                    >
                      {togglingId === l.id ? "Updating…" : isHidden(l) ? "Unhide" : "Hide"}
                    </button>

                    <button
                      type="button"
                      className="al-btn al-btnDanger"
                      disabled={deletingId === l.id}
                      onClick={() => onDeleteListing(l)}
                      title="Delete listing"
                    >
                      {deletingId === l.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="al-modalOverlay" onClick={closeModal} role="presentation">
          <div className="al-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="al-modalHeader">
              <div>
                <div className="al-modalTitle">{isEdit ? "Edit Listing" : "Add Listing"}</div>
                <div className="al-modalSub">
                  {isEdit
                    ? "Update fields. Media is optional unless you want to replace it."
                    : "Create a new listing and upload cover + gallery images."}
                </div>
              </div>

              <button className="al-btn al-btnGhost" type="button" onClick={closeModal} disabled={saving}>
                Close
              </button>
            </div>

            {error && <div className="al-alert">{error}</div>}

            <form onSubmit={onSubmit} className="al-form">
              <div className="al-grid">
                {/* LEFT: Media */}
                <div className="al-mediaCard">
                  <div className="al-label">Cover image {isEdit ? "(optional)" : "*"}</div>
                  <input className="al-file" type="file" accept="image/*" onChange={onPickCover} />

                  <div className="al-drop">
                    {coverPreview ? (
                      <img className="al-previewImg" src={coverPreview} alt="Cover preview" />
                    ) : isEdit && editingCoverUrl ? (
                      <img
                        className="al-previewImg"
                        src={editingCoverUrl}
                        alt="Current cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="al-dropInner">
                        <div className="al-dropTitle">{isEdit ? "Keep current cover or pick a new one" : "Choose cover image"}</div>
                        <div className="al-dropHint">PNG/JPG · Max 100MB</div>
                      </div>
                    )}
                  </div>

                  <div className="al-sep" />

                  <div className="al-mediaTop">
                    <div>
                      <div className="al-label" style={{ marginBottom: 2 }}>
                        Gallery images
                      </div>
                      <div className="al-miniHint">Optional</div>
                    </div>

                    {galleryFiles.length > 0 && (
                      <button type="button" className="al-btn al-btnGhost" onClick={clearAllGallery} disabled={saving}>
                        Clear
                      </button>
                    )}
                  </div>

                  <input className="al-file" type="file" accept="image/*" multiple onChange={onPickGallery} />

                  {/* ✅ NEW: show either NEW picks, or EXISTING DB gallery with X delete */}
                  {galleryPreviews.length > 0 ? (
                    <div className="al-galleryGrid">
                      {galleryPreviews.map((p, idx) => (
                        <div key={`${p.name}-${idx}`} className="al-galleryItem">
                          <img src={p.url} alt={p.name} />
                          <button
                            type="button"
                            className="al-galleryRemove"
                            onClick={() => removeGalleryItem(idx)}
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : isEdit && editingGalleryImages.length > 0 ? (
                    <div className="al-galleryGrid">
                      {editingGalleryImages.map((img, idx) => (
                        <div key={`${img.id}-${idx}`} className="al-galleryItem">
                          <img
                            src={img.url}
                            alt={`Gallery ${idx + 1}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <button
                            type="button"
                            className="al-galleryRemove"
                            onClick={() => deleteExistingImage(img.id)}
                            aria-label="Delete image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="al-emptyGallery">
                      {isEdit
                        ? "No gallery images for this listing yet."
                        : "No gallery images selected."}
                    </div>
                  )}
                </div>

                {/* RIGHT: Fields */}
                <div className="al-fieldsCard">
                  <div className="al-fieldsGrid">
                    <div className="al-span2">
                      <div className="al-label">Country *</div>
                      <select className="al-input" value={form.country} onChange={onCountryChange}>
                        {COUNTRIES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="al-miniHint">This powers /listings?country={form.country}</div>
                    </div>

                    <div className="al-span2">
                      <div className="al-label">Title *</div>
                      <input className="al-input" value={form.title} onChange={set("title")} />
                    </div>

                    {/* ✅ MAP */}
                    <div className="al-span2">
                      <div className="al-label">Map Location (click to drop pin)</div>
                      <LocationPicker
                        value={locationValue}
                        defaultCenter={countryCenter}
                        onChange={({ lat, lng }) => {
                          setForm((p) => ({
                            ...p,
                            latitude: String(lat),
                            longitude: String(lng),
                          }));
                        }}
                        height={260}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                        <div>
                          <div className="al-label">Latitude</div>
                          <input className="al-input" value={form.latitude} onChange={set("latitude")} placeholder="25.2048" />
                        </div>
                        <div>
                          <div className="al-label">Longitude</div>
                          <input className="al-input" value={form.longitude} onChange={set("longitude")} placeholder="55.2708" />
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div className="al-label">Address label (optional)</div>
                        <input
                          className="al-input"
                          value={form.addressText}
                          onChange={set("addressText")}
                          placeholder="Dubai Marina, near Metro..."
                        />
                        <div className="al-miniHint" style={{ marginTop: 6 }}>
                          Leave empty if you only want pin coordinates.
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="al-label">Listing Type</div>
                      <select className="al-input" value={form.listingType} onChange={set("listingType")}>
                        {LISTING_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="al-checkWrap">
                      <div className="al-label">Featured</div>
                      <label className="al-check">
                        <input type="checkbox" checked={form.featured} onChange={set("featured")} />
                        <span>Show on homepage</span>
                      </label>
                    </div>

                    <div>
                      <div className="al-label">City *</div>
                      <input className="al-input" value={form.city} onChange={set("city")} />
                    </div>

                    <div>
                      <div className="al-label">Area / Community *</div>
                      <input className="al-input" value={form.area} onChange={set("area")} />
                    </div>

                    <div>
                      <div className="al-label">Property Type</div>
                      <select className="al-input" value={form.propertyType} onChange={set("propertyType")}>
                        {PROPERTY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="al-label">Category</div>
                      <select className="al-input" value={form.category} onChange={set("category")}>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="al-label">Developer</div>
                      <input className="al-input" value={form.developerName} onChange={set("developerName")} />
                    </div>

                    <div>
                      <div className="al-label">Location Label</div>
                      <input className="al-input" value={form.locationLabel} onChange={set("locationLabel")} />
                    </div>

                    <div>
                      <div className="al-label">Completion Year</div>
                      <input className="al-input" value={form.completionYear} onChange={set("completionYear")} inputMode="numeric" />
                    </div>

                    <div>
                      <div className="al-label">Starting Price</div>
                      <input className="al-input" value={form.startingPrice} onChange={set("startingPrice")} inputMode="numeric" />
                    </div>

                    <div>
                      <div className="al-label">Currency</div>
                      <select className="al-input" value={form.currency} onChange={set("currency")}>
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="al-label">Payment Plan</div>
                      <input className="al-input" value={form.paymentPlan} onChange={set("paymentPlan")} placeholder="10/40/50" />
                    </div>

                    <div>
                      <div className="al-label">Bedrooms</div>
                      <input className="al-input" value={form.bedrooms} onChange={set("bedrooms")} inputMode="numeric" placeholder="1" />
                    </div>
                    <div>
                      <div className="al-label">Bathrooms (Toilets)</div>
                      <input className="al-input" value={form.bathrooms} onChange={set("bathrooms")} inputMode="numeric" placeholder="2" />
                    </div>
                    <div>
                      <div className="al-label">Parking</div>
                      <input className="al-input" value={form.parking} onChange={set("parking")} inputMode="numeric" placeholder="1" />
                    </div>
                    <div>
                      <div className="al-label">Size (sqft)</div>
                      <input className="al-input" value={form.sizeSqft} onChange={set("sizeSqft")} inputMode="numeric" placeholder="762" />
                    </div>

                    <div>
                      <div className="al-label">Size (m²)</div>
                      <input className="al-input" value={form.sizeSqm} onChange={set("sizeSqm")} inputMode="numeric" placeholder="71" />
                      <div className="al-miniHint">Optional. If empty, you can compute it from sqft in the public API.</div>
                    </div>

                    <div>
                      <div className="al-label">Assigned Agent</div>
                      <select className="al-input" value={form.assignedAgentId} onChange={set("assignedAgentId")}>
                        <option value="">None</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.fullName}
                          </option>
                        ))}
                      </select>
                      {agentsLoading && <div className="al-miniHint">Loading agents…</div>}
                      {!agentsLoading && agents.length === 0 && <div className="al-miniHint">No agents found.</div>}
                    </div>

                    <div className="al-span2">
                      <div className="al-label">Description</div>
                      <textarea className="al-textarea" value={form.description} onChange={set("description")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="al-footer">
                <div className="al-footNote">
                  Required: title, city, area, {isEdit ? "cover image (existing is OK)." : "cover image."}
                </div>
                <div className="al-footerBtns">
                  <button type="button" className="al-btn al-btnGhost" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="al-btn al-btnPrimary" disabled={!canSave || saving}>
                    {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Listing"}
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