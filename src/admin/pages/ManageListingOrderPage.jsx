import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getToken() {
    return localStorage.getItem("token");
}

function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function listingImage(item) {
    return (
        item?.mainImageUrl ||
        item?.coverImage ||
        item?.thumbnail ||
        item?.imageUrl ||
        item?.photoUrl ||
        item?.images?.[0]?.url ||
        item?.images?.[0] ||
        null
    );
}

async function safeJson(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { __raw: text };
    }
}

function isProject(item) {
    return item?.listingType === "OFF_PLAN";
}

function isListing(item) {
    return item?.listingType === "FOR_SALE" || item?.listingType === "FOR_RENT";
}

function sortByCurrentOrder(a, b) {
    const aOrder = Math.max(1, toNum(a?.featuredOrder || 0));
    const bOrder = Math.max(1, toNum(b?.featuredOrder || 0));

    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
}

function normalizeOrdersByGroup(list) {
    const projects = list.filter(isProject).sort(sortByCurrentOrder);
    const listings = list.filter(isListing).sort(sortByCurrentOrder);
    const others = list.filter((item) => !isProject(item) && !isListing(item));

    const normalizedProjects = projects.map((item, index) => ({
        ...item,
        featuredOrder: index + 1,
    }));

    const normalizedListings = listings.map((item, index) => ({
        ...item,
        featuredOrder: index + 1,
    }));

    return [...normalizedProjects, ...normalizedListings, ...others];
}

export default function ManageListingOrderPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingAll, setSavingAll] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [sectionFilter, setSectionFilter] = useState("ALL");
    const [hasChanges, setHasChanges] = useState(false);

    async function loadListings() {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const res = await fetch(
                `${API_BASE}/public/listings?featured=true&sort=featuredOrder&limit=300`
            );
            const data = await safeJson(res);

            if (!res.ok) {
                throw new Error(data?.error || "Failed to load listings.");
            }

            const list = Array.isArray(data) ? data : data.items;
            const normalized = Array.isArray(list) ? normalizeOrdersByGroup(list) : [];

            setItems(normalized);
            setHasChanges(false);
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to load listings.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadListings();
    }, []);

    const sortedItems = useMemo(() => {
        const projects = items.filter(isProject).sort(sortByCurrentOrder);
        const listings = items.filter(isListing).sort(sortByCurrentOrder);
        const others = items
            .filter((item) => !isProject(item) && !isListing(item))
            .sort(sortByCurrentOrder);

        return [...projects, ...listings, ...others];
    }, [items]);

    const visibleItems = useMemo(() => {
        if (sectionFilter === "PROJECTS") {
            return sortedItems.filter(isProject);
        }

        if (sectionFilter === "LISTINGS") {
            return sortedItems.filter(isListing);
        }

        return sortedItems;
    }, [sortedItems, sectionFilter]);

    function handleLocalOrderChange(id, value) {
        const cleaned = value === "" ? "" : Math.max(1, toNum(value));

        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        featuredOrder: cleaned,
                    }
                    : item
            )
        );

        setHasChanges(true);
        setSuccess("");
        setError("");
    }

    async function handleSaveAll() {
        const token = getToken();
        if (!token) {
            setError("You are not logged in. Please login again.");
            return;
        }

        try {
            setSavingAll(true);
            setError("");
            setSuccess("");

            const itemsToSave =
                sectionFilter === "PROJECTS"
                    ? sortedItems.filter(isProject)
                    : sectionFilter === "LISTINGS"
                        ? sortedItems.filter(isListing)
                        : sortedItems.filter((item) => isProject(item) || isListing(item));

            for (const item of itemsToSave) {
                const safeOrder = Math.max(1, toNum(item.featuredOrder));

                const res = await fetch(
                    `${API_BASE}/admin/listings/${item.id}/featured-order`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            featuredOrder: safeOrder,
                        }),
                    }
                );

                const data = await safeJson(res);

                if (!res.ok) {
                    throw new Error(
                        data?.error || `Failed to save listing order for ${item.title || "listing"}.`
                    );
                }
            }

            setItems((prev) =>
                prev.map((item) => ({
                    ...item,
                    featured: true,
                    featuredOrder: Math.max(1, toNum(item.featuredOrder)),
                }))
            );

            setHasChanges(false);
            setSuccess("All listing orders updated.");
        } catch (err) {
            console.error(err);
            setError(err?.message || "Failed to save listing order.");
        } finally {
            setSavingAll(false);
        }
    }

    return (
        <div className="mlo-page">
            <div className="mlo-card">
                <div className="mlo-head">
                    <div>
                        <h2 className="mlo-title">Manage Listing Order</h2>
                        <p className="mlo-subtitle">
                            Set the order of featured listings shown on the main page.
                        </p>
                    </div>

                    <div className="mlo-headActions">
                        <select
                            className="mlo-filterSelect"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                        >
                            <option value="ALL">All</option>
                            <option value="PROJECTS">Latest Projects</option>
                            <option value="LISTINGS">Latest Listings</option>
                        </select>

                        <button className="mlo-refreshBtn" type="button" onClick={loadListings}>
                            Refresh
                        </button>

                        <button
                            className="mlo-saveAllBtn"
                            type="button"
                            disabled={savingAll || !hasChanges}
                            onClick={handleSaveAll}
                        >
                            {savingAll ? "Saving All..." : "Save All"}
                        </button>
                    </div>
                </div>

                {error ? <div className="mlo-alert mlo-alertError">{error}</div> : null}
                {success ? <div className="mlo-alert mlo-alertSuccess">{success}</div> : null}

                {loading ? (
                    <div className="mlo-empty">Loading listings…</div>
                ) : visibleItems.length === 0 ? (
                    <div className="mlo-empty">No listings found for this filter.</div>
                ) : (
                    <div className="mlo-list">
                        {visibleItems.map((item) => {
                            const img = listingImage(item);

                            return (
                                <div key={item.id} className="mlo-row">
                                    <div className="mlo-left">
                                        <div
                                            className="mlo-thumb"
                                            style={img ? { backgroundImage: `url(${img})` } : undefined}
                                        />
                                        <div className="mlo-info">
                                            <div className="mlo-itemTitle">{item.title || "Untitled"}</div>
                                            <div className="mlo-meta">
                                                {item?.location || "-"} · {item?.listingType || "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mlo-right">
                                        <label className="mlo-orderWrap">
                                            <span>Order</span>
                                            <input
                                                className="mlo-orderInput"
                                                type="number"
                                                min="1"
                                                value={item.featuredOrder ?? 1}
                                                onChange={(e) => handleLocalOrderChange(item.id, e.target.value)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
        .mlo-page {
          width: 100%;
        }

        .mlo-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px;
        }

        .mlo-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .mlo-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }

        .mlo-subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .mlo-headActions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mlo-filterSelect {
          height: 42px;
          min-width: 170px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          outline: none;
        }

        .mlo-refreshBtn {
          height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
          font-weight: 700;
          cursor: pointer;
        }

        .mlo-saveAllBtn {
          height: 42px;
          padding: 0 16px;
          border: none;
          border-radius: 12px;
          background: #111827;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .mlo-saveAllBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mlo-alert {
          margin-bottom: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14px;
        }

        .mlo-alertError {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .mlo-alertSuccess {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .mlo-empty {
          padding: 24px 0;
          color: #6b7280;
          font-size: 15px;
        }

        .mlo-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mlo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
        }

        .mlo-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .mlo-thumb {
          width: 88px;
          height: 66px;
          border-radius: 12px;
          background: #f3f4f6 center/cover no-repeat;
          flex-shrink: 0;
        }

        .mlo-info {
          min-width: 0;
        }

        .mlo-itemTitle {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .mlo-meta {
          margin-top: 4px;
          font-size: 14px;
          color: #6b7280;
        }

        .mlo-right {
          display: flex;
          align-items: end;
          gap: 10px;
          flex-shrink: 0;
        }

        .mlo-orderWrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .mlo-orderInput {
          width: 120px;
          height: 42px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }

        @media (max-width: 760px) {
          .mlo-row {
            flex-direction: column;
            align-items: stretch;
          }

          .mlo-right {
            justify-content: space-between;
          }
        }
      `}</style>
        </div>
    );
}