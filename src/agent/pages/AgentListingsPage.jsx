// src/agent/pages/AgentAddListingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./AgentListingsPage.css";
import LocationPicker from "../../admin/components/LocationPicker.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB images
const MAX_PDF_BYTES = 50 * 1024 * 1024; // brochures max (match your frontend preference)

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
    if (dot === -1) return "bin";
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

function pickBrochureUrl(listing) {
    return (
        listing?.brochureUrl ||
        listing?.brochurePDF ||
        listing?.brochurePdfUrl ||
        listing?.brochure ||
        ""
    );
}

function fmtBytes(n) {
    const v = Number(n || 0);
    if (!Number.isFinite(v) || v <= 0) return "";
    const mb = v / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
    const kb = v / 1024;
    return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
}

export default function AgentAddListingPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [togglingId, setTogglingId] = useState(null);

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editingCoverUrl, setEditingCoverUrl] = useState("");

    // ✅ Brochure modal state
    const [broOpen, setBroOpen] = useState(false);
    const [broListing, setBroListing] = useState(null);
    const [broFile, setBroFile] = useState(null);
    const [broUploading, setBroUploading] = useState(false);
    const [broErr, setBroErr] = useState("");

    const [form, setForm] = useState({
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

        const hasCover = !!coverFile || (isEdit && (editingCoverUrl || "").trim().length > 0);
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

    async function loadListings() {
        setLoading(true);
        setListError("");
        try {
            const token = tokenOrThrow();
            const res = await fetch(`${API_BASE}/agent/listings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to load listings");

            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (e) {
            console.error(e);
            setItems([]);
            setListError(e.message || "Failed to load listings");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetAll = () => {
        setError("");
        setEditingId(null);
        setEditingCoverUrl("");

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

    const removeGalleryItem = (idx) => setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    const clearAllGallery = () => setGalleryFiles([]);

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

    const onToggleHidden = async (listing) => {
        if (togglingId) return;

        const nextHidden = !isHidden(listing);
        const ok = window.confirm(`${nextHidden ? "Hide" : "Unhide"} "${listing.title}"?`);
        if (!ok) return;

        setTogglingId(listing.id);
        setListError("");

        setItems((prev) => prev.map((x) => (x.id === listing.id ? { ...x, isHidden: nextHidden } : x)));

        try {
            const token = tokenOrThrow();

            const res = await fetch(`${API_BASE}/agent/listings/${listing.id}`, {
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
                city: form.city,
                area: form.area,

                latitude: toFloatOrNull(form.latitude),
                longitude: toFloatOrNull(form.longitude),
                addressText: form.addressText?.trim() ? form.addressText.trim() : null,

                propertyType: form.propertyType,
                category: form.category,
                listingType: form.listingType,
                featured: !!form.featured,

                completionYear: toIntOrNull(form.completionYear),
                developerName: form.developerName || null,
                locationLabel: form.locationLabel || null,

                startingPrice: toIntOrNull(form.startingPrice),
                currency: form.currency,
                paymentPlan: form.paymentPlan || null,
                description: form.description || null,

                bedrooms: toIntOrNull(form.bedrooms),
                bathrooms: toIntOrNull(form.bathrooms),
                parking: toIntOrNull(form.parking),
                sizeSqft: toIntOrNull(form.sizeSqft),
                sizeSqm: toIntOrNull(form.sizeSqm),
            };

            let listingId = editingId;

            if (!editingId) {
                const createRes = await fetch(`${API_BASE}/agent/listings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const createJson = await createRes.json().catch(() => ({}));
                if (!createRes.ok) throw new Error(createJson?.error || "Failed to create listing");

                listingId = createJson.id;
                if (!listingId) throw new Error("Create listing response missing id");
            } else {
                const updateRes = await fetch(`${API_BASE}/agent/listings/${editingId}`, {
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

    // ✅ Brochure modal handlers (same logic as admin fixed version)
    const openBrochurePopup = (listing) => {
        setBroErr("");
        setBroFile(null);
        setBroListing(listing);
        setBroOpen(true);
    };

    const closeBrochurePopup = () => {
        if (broUploading) return;
        setBroOpen(false);
        setBroListing(null);
        setBroFile(null);
        setBroErr("");
    };

    const onPickBrochure = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setBroErr("Please select a PDF file.");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_PDF_BYTES) {
            setBroErr(`PDF is too large. Max ${Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB.`);
            e.target.value = "";
            return;
        }

        setBroErr("");
        setBroFile(file);
        e.target.value = "";
    };

    const uploadBrochure = async () => {
        if (!broListing?.id) return;
        if (!broFile) {
            setBroErr("Pick a PDF first.");
            return;
        }

        setBroUploading(true);
        setBroErr("");

        try {
            const token = tokenOrThrow();

            // 1) presign
            const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: "listing-brochure",
                    listingId: broListing.id,
                    contentType: "application/pdf",
                    ext: "pdf",
                    sizeBytes: broFile.size,
                }),
            });

            const presignJson = await presignRes.json().catch(() => ({}));
            if (!presignRes.ok) throw new Error(presignJson?.error || "Failed to presign brochure upload");

            const u = presignJson?.uploads?.[0];
            if (!u?.uploadUrl || !u?.publicUrl || !u?.key) {
                throw new Error("Presign response missing uploadUrl/publicUrl/key");
            }

            // 2) put to r2
            await putToSignedUrl(u.uploadUrl, broFile);

            // 3) save to db (your route)
            const saveRes = await fetch(`${API_BASE}/uploads/listing/${broListing.id}/brochure`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ key: u.key, url: u.publicUrl }),
            });

            const saveJson = await saveRes.json().catch(() => ({}));
            if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save brochure to DB");

            // update list
            setItems((prev) =>
                prev.map((x) => (x.id === broListing.id ? { ...x, brochureUrl: u.publicUrl, brochureKey: u.key } : x))
            );

            setBroFile(null);
            alert("✅ Brochure uploaded");
            closeBrochurePopup();
        } catch (e) {
            console.error(e);
            setBroErr(e?.message || "Failed to upload brochure");
        } finally {
            setBroUploading(false);
        }
    };

    const removeBrochure = async () => {
        if (!broListing?.id) return;
        const ok = window.confirm("Remove brochure from this listing?");
        if (!ok) return;

        setBroUploading(true);
        setBroErr("");

        try {
            const token = tokenOrThrow();

            const res = await fetch(`${API_BASE}/uploads/listing/${broListing.id}/brochure`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || "Failed to remove brochure");

            setItems((prev) =>
                prev.map((x) => (x.id === broListing.id ? { ...x, brochureUrl: null, brochureKey: null } : x))
            );

            alert("✅ Brochure removed");
            closeBrochurePopup();
        } catch (e) {
            console.error(e);
            setBroErr(e?.message || "Failed to remove brochure");
        } finally {
            setBroUploading(false);
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
        <div className="agl">
            <div className="agl-card">
                <div className="agl-top">
                    <div>
                        <div className="agl-title">Listings</div>
                        <div className="agl-sub">Your listings only (auto-assigned to you).</div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="agl-btn agl-btnGhost" type="button" onClick={loadListings} disabled={loading}>
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                        <button className="agl-btn agl-btnPrimary" type="button" onClick={openModalCreate}>
                            + Add Listing
                        </button>
                    </div>
                </div>

                {listError && <div className="agl-alert">{listError}</div>}

                {loading ? (
                    <div className="agl-muted" style={{ marginTop: 14 }}>
                        Loading…
                    </div>
                ) : (
                    <div className="agl-list">
                        {items.length === 0 ? (
                            <div className="agl-empty">No listings yet.</div>
                        ) : (
                            items.map((l) => {
                                const brochureUrl = pickBrochureUrl(l);

                                return (
                                    <div key={l.id} className="agl-row">
                                        <div className="agl-leftRow">
                                            <img
                                                className="agl-thumb"
                                                src={coverUrl(l) || "https://via.placeholder.com/80x80?text=No+Img"}
                                                alt={l.title || "Listing"}
                                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/80x80?text=No+Img")}
                                            />

                                            <div className="agl-meta">
                                                <div className="agl-nameRow">
                                                    <div className="agl-name">{l.title}</div>
                                                    {l.featured ? <span className="agl-tag">Featured</span> : null}
                                                    <span className="agl-tag agl-tagSoft">{badgeLabel(l.listingType)}</span>
                                                    {isHidden(l) ? <span className="agl-tag agl-tagHidden">Hidden</span> : null}
                                                    {hasLocation(l) ? <span className="agl-tag agl-tagSoft">Has location</span> : null}
                                                    {brochureUrl ? <span className="agl-tag agl-tagSoft">Brochure</span> : null}
                                                </div>

                                                <div className="agl-line">
                                                    {l.area} · {l.city}
                                                    {l.country ? ` · ${l.country}` : ""}
                                                </div>

                                                <div className="agl-line agl-lineMuted">
                                                    {l.developerName ? `${l.developerName} · ` : ""}
                                                    {l.startingPrice
                                                        ? `${l.currency || "USD"} ${Number(l.startingPrice).toLocaleString()}`
                                                        : "No price"}{" "}
                                                    · {Array.isArray(l.images) ? `${l.images.length} photos` : "0 photos"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="agl-actionsRow">
                                            <button type="button" className="agl-btn agl-btnGhost" onClick={() => openModalEdit(l)}>
                                                Edit
                                            </button>

                                            {/* ✅ NEW: Brochure */}
                                            <button type="button" className="agl-btn agl-btnGhost" onClick={() => openBrochurePopup(l)}>
                                                Brochure
                                            </button>

                                            <button
                                                type="button"
                                                className="agl-btn agl-btnGhost"
                                                disabled={togglingId === l.id}
                                                onClick={() => onToggleHidden(l)}
                                            >
                                                {togglingId === l.id ? "Updating…" : isHidden(l) ? "Unhide" : "Hide"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ✅ Brochure modal */}
            {broOpen && (
                <div className="agl-modalOverlay" onClick={closeBrochurePopup} role="presentation">
                    <div
                        className="agl-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        style={{ maxWidth: 560 }}
                    >
                        <div className="agl-modalHeader">
                            <div>
                                <div className="agl-modalTitle">Brochure PDF</div>
                                <div className="agl-modalSub">{broListing?.title ? `Listing: ${broListing.title}` : "Upload a brochure"}</div>
                            </div>

                            <button className="agl-btn agl-btnGhost" type="button" onClick={closeBrochurePopup} disabled={broUploading}>
                                Close
                            </button>
                        </div>

                        {broErr ? <div className="agl-alert">{broErr}</div> : null}

                        <div style={{ padding: 14 }}>
                            <div
                                style={{
                                    border: "1px dashed rgba(0,0,0,0.15)",
                                    borderRadius: 14,
                                    padding: 16,
                                    background: "rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                    {pickBrochureUrl(broListing) ? "Current brochure is set ✅" : "No brochure uploaded yet"}
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
                                    PDF only · Max {Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB
                                </div>

                                {pickBrochureUrl(broListing) ? (
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <a className="agl-btn agl-btnGhost" href={pickBrochureUrl(broListing)} target="_blank" rel="noreferrer">
                                            Open PDF
                                        </a>
                                        <button className="agl-btn agl-btnDanger" type="button" onClick={removeBrochure} disabled={broUploading}>
                                            Remove
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <div style={{ height: 14 }} />

                            <div>
                                <div className="agl-label">Upload new brochure</div>
                                <input className="agl-file" type="file" accept="application/pdf" onChange={onPickBrochure} disabled={broUploading} />

                                {broFile ? (
                                    <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
                                        Selected: <b>{broFile.name}</b> · {fmtBytes(broFile.size)}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>Choose a PDF file to upload.</div>
                                )}

                                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                                    <button className="agl-btn agl-btnPrimary" type="button" onClick={uploadBrochure} disabled={broUploading}>
                                        {broUploading ? "Uploading..." : "Upload PDF"}
                                    </button>
                                    <button className="agl-btn agl-btnGhost" type="button" onClick={() => setBroFile(null)} disabled={broUploading}>
                                        Clear
                                    </button>
                                </div>

                                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
                                    Uses: <code>POST /uploads/presign</code> → <code>PUT</code> → <code>POST /uploads/listing/:id/brochure</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit modal */}
            {open && (
                <div className="agl-modalOverlay" onClick={closeModal} role="presentation">
                    <div className="agl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="agl-modalHeader">
                            <div>
                                <div className="agl-modalTitle">{isEdit ? "Edit Listing" : "Add Listing"}</div>
                                <div className="agl-modalSub">
                                    {isEdit ? "Update fields. Media is optional unless you want to replace it." : "Create a new listing and upload cover + gallery images."}
                                </div>
                            </div>

                            <button className="agl-btn agl-btnGhost" type="button" onClick={closeModal} disabled={saving}>
                                Close
                            </button>
                        </div>

                        {error && <div className="agl-alert">{error}</div>}

                        <form onSubmit={onSubmit} className="agl-form">
                            <div className="agl-grid">
                                {/* media */}
                                <div className="agl-mediaCard">
                                    <div className="agl-label">Cover image {isEdit ? "(optional)" : "*"}</div>
                                    <input className="agl-file" type="file" accept="image/*" onChange={onPickCover} />

                                    <div className="agl-drop">
                                        {coverPreview ? (
                                            <img className="agl-previewImg" src={coverPreview} alt="Cover preview" />
                                        ) : isEdit && editingCoverUrl ? (
                                            <img className="agl-previewImg" src={editingCoverUrl} alt="Current cover" />
                                        ) : (
                                            <div className="agl-dropInner">
                                                <div className="agl-dropTitle">{isEdit ? "Keep current cover or pick a new one" : "Choose cover image"}</div>
                                                <div className="agl-dropHint">PNG/JPG · Max 100MB</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="agl-sep" />

                                    <div className="agl-mediaTop">
                                        <div>
                                            <div className="agl-label" style={{ marginBottom: 2 }}>
                                                Gallery images
                                            </div>
                                            <div className="agl-miniHint">Optional</div>
                                        </div>

                                        {galleryFiles.length > 0 && (
                                            <button type="button" className="agl-btn agl-btnGhost" onClick={clearAllGallery} disabled={saving}>
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <input className="agl-file" type="file" accept="image/*" multiple onChange={onPickGallery} />

                                    {galleryPreviews.length > 0 ? (
                                        <div className="agl-galleryGrid">
                                            {galleryPreviews.map((p, idx) => (
                                                <div key={`${p.name}-${idx}`} className="agl-galleryItem">
                                                    <img src={p.url} alt={p.name} />
                                                    <button type="button" className="agl-galleryRemove" onClick={() => removeGalleryItem(idx)}>
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="agl-emptyGallery">
                                            {isEdit ? "No new gallery images selected (existing gallery stays as-is)." : "No gallery images selected."}
                                        </div>
                                    )}
                                </div>

                                {/* fields */}
                                <div className="agl-fieldsCard">
                                    <div className="agl-fieldsGrid">
                                        <div className="agl-span2">
                                            <div className="agl-label">Country *</div>
                                            <select className="agl-input" value={form.country} onChange={onCountryChange}>
                                                {COUNTRIES.map((c) => (
                                                    <option key={c.slug} value={c.slug}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="agl-miniHint">This powers /listings?country={form.country}</div>
                                        </div>

                                        <div className="agl-span2">
                                            <div className="agl-label">Title *</div>
                                            <input className="agl-input" value={form.title} onChange={set("title")} />
                                        </div>

                                        <div className="agl-span2">
                                            <div className="agl-label">Map Location (click to drop pin)</div>
                                            <LocationPicker
                                                value={locationValue}
                                                defaultCenter={countryCenter}
                                                onChange={({ lat, lng }) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        latitude: String(lat),
                                                        longitude: String(lng),
                                                    }))
                                                }
                                                height={260}
                                            />

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                                                <div>
                                                    <div className="agl-label">Latitude</div>
                                                    <input className="agl-input" value={form.latitude} onChange={set("latitude")} placeholder="25.2048" />
                                                </div>
                                                <div>
                                                    <div className="agl-label">Longitude</div>
                                                    <input className="agl-input" value={form.longitude} onChange={set("longitude")} placeholder="55.2708" />
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 10 }}>
                                                <div className="agl-label">Address label (optional)</div>
                                                <input className="agl-input" value={form.addressText} onChange={set("addressText")} placeholder="Dubai Marina..." />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="agl-label">Listing Type</div>
                                            <select className="agl-input" value={form.listingType} onChange={set("listingType")}>
                                                {LISTING_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="agl-checkWrap">
                                            <div className="agl-label">Featured</div>
                                            <label className="agl-check">
                                                <input type="checkbox" checked={form.featured} onChange={set("featured")} />
                                                <span>Show on homepage</span>
                                            </label>
                                        </div>

                                        <div>
                                            <div className="agl-label">City *</div>
                                            <input className="agl-input" value={form.city} onChange={set("city")} />
                                        </div>

                                        <div>
                                            <div className="agl-label">Area / Community *</div>
                                            <input className="agl-input" value={form.area} onChange={set("area")} />
                                        </div>

                                        <div>
                                            <div className="agl-label">Property Type</div>
                                            <select className="agl-input" value={form.propertyType} onChange={set("propertyType")}>
                                                {PROPERTY_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="agl-label">Category</div>
                                            <select className="agl-input" value={form.category} onChange={set("category")}>
                                                {CATEGORIES.map((c) => (
                                                    <option key={c.value} value={c.value}>
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="agl-label">Developer</div>
                                            <input className="agl-input" value={form.developerName} onChange={set("developerName")} />
                                        </div>

                                        <div>
                                            <div className="agl-label">Location Label</div>
                                            <input className="agl-input" value={form.locationLabel} onChange={set("locationLabel")} />
                                        </div>

                                        <div>
                                            <div className="agl-label">Completion Year</div>
                                            <input className="agl-input" value={form.completionYear} onChange={set("completionYear")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Starting Price</div>
                                            <input className="agl-input" value={form.startingPrice} onChange={set("startingPrice")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Currency</div>
                                            <select className="agl-input" value={form.currency} onChange={set("currency")}>
                                                {CURRENCIES.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="agl-label">Payment Plan</div>
                                            <input className="agl-input" value={form.paymentPlan} onChange={set("paymentPlan")} placeholder="10/40/50" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Bedrooms</div>
                                            <input className="agl-input" value={form.bedrooms} onChange={set("bedrooms")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Bathrooms (Toilets)</div>
                                            <input className="agl-input" value={form.bathrooms} onChange={set("bathrooms")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Parking</div>
                                            <input className="agl-input" value={form.parking} onChange={set("parking")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Size (sqft)</div>
                                            <input className="agl-input" value={form.sizeSqft} onChange={set("sizeSqft")} inputMode="numeric" />
                                        </div>

                                        <div>
                                            <div className="agl-label">Size (m²)</div>
                                            <input className="agl-input" value={form.sizeSqm} onChange={set("sizeSqm")} inputMode="numeric" />
                                        </div>

                                        <div className="agl-span2">
                                            <div className="agl-label">Description</div>
                                            <textarea className="agl-textarea" value={form.description} onChange={set("description")} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="agl-footer">
                                <div className="agl-footNote">
                                    Required: title, city, area, {isEdit ? "cover image (existing is OK)." : "cover image."}
                                </div>
                                <div className="agl-footerBtns">
                                    <button type="button" className="agl-btn agl-btnGhost" onClick={closeModal} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="agl-btn agl-btnPrimary" disabled={!canSave || saving}>
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