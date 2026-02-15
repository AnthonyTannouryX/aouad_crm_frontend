// src/admin/AdminApp.jsx
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaUserTie,
  FaCog,
  FaSearch,
  FaPlus,
  FaBuilding,
  FaCity,
  FaBriefcase, // ✅ Careers icon
} from "react-icons/fa";
import "./admin.css";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: FaHome, end: true },

  // CRM
  { to: "/admin/leads", label: "Leads", icon: FaUsers },
  { to: "/admin/agents", label: "Agents", icon: FaUserTie },

  // Listings
  { to: "/admin/listings", label: "Search Listings", icon: FaBuilding },
  { to: "/admin/add-listing", label: "Add Listing", icon: FaPlus },

  // Developers (✅ fixed: you had route but no nav)
  { to: "/admin/developers", label: "Developers", icon: FaCity },
  { to: "/admin/add-developer", label: "Add Developer", icon: FaPlus },

  // ✅ Careers
  { to: "/admin/careers", label: "Careers", icon: FaBriefcase },

  // Settings
  { to: "/admin/settings", label: "Settings", icon: FaCog },
];

function usePageTitle() {
  const { pathname } = useLocation();

  return useMemo(() => {
    if (pathname === "/admin") return "Dashboard";

    // CRM
    if (pathname.startsWith("/admin/leads")) return "Leads";
    if (pathname.startsWith("/admin/agents")) return "Agents";

    // Listings
    if (pathname.startsWith("/admin/listings")) return "Search Listings";
    if (pathname.startsWith("/admin/add-listing")) return "Add Listing";

    // Developers
    if (pathname.startsWith("/admin/developers")) return "Developers";
    if (pathname.startsWith("/admin/add-developer")) return "Add Developer";

    // ✅ Careers
    if (pathname.startsWith("/admin/careers")) return "Careers";

    // Settings
    if (pathname.startsWith("/admin/settings")) return "Settings";

    return "Admin";
  }, [pathname]);
}

export default function AdminApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = usePageTitle();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [sidebarOpen]);

  function submitTopSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/admin/listings?q=${encodeURIComponent(q)}` : "/admin/listings");
  }

  return (
    <div className="adm">
      {sidebarOpen && (
        <button
          className="adm-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`adm-side ${sidebarOpen ? "is-open" : ""}`}>
        <div className="adm-sideTop">
          <div className="adm-brand">
            <div className="adm-brandMark">A</div>
            <div className="adm-brandText">
              <div className="adm-brandName">Admin</div>
              <div className="adm-brandSub">CRM / Management</div>
            </div>
          </div>

          <button
            className="adm-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="adm-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `adm-navLink ${isActive ? "is-active" : ""}`
                }
              >
                <span className="adm-navIcon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="adm-sideFoot">
          <div className="adm-user">
            <div className="adm-avatar">AT</div>
            <div className="adm-userMeta">
              <div className="adm-userName">Admin</div>
              <div className="adm-userRole">Full access</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div className="adm-topLeft">
            <button
              className="adm-burger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FaBars />
            </button>

            <div className="adm-titleWrap">
              <div className="adm-title">{title}</div>
              <div className="adm-crumbs">Admin / {title}</div>
            </div>
          </div>

          <div className="adm-topRight">
            <form className="adm-search" onSubmit={submitTopSearch}>
              <FaSearch className="adm-searchIcon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings (title, location, developer...)"
              />
            </form>

            <button
              className="adm-btn"
              type="button"
              onClick={() => navigate("/admin/leads")}
              title="Create a new lead"
            >
              New Lead
            </button>
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
