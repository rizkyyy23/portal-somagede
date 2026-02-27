import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { api } from "../utils/api";
import "../styles/admin-dashboard.css";

const AdminLayout = () => {
  const [showUserNavModal, setShowUserNavModal] = useState(false);
  const [menus, setMenus] = useState([]);
  const [isMenusLoaded, setIsMenusLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch dynamic menus from DB
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const data = await api.get("/menus");
        if (data.success) {
          setMenus(data.data.filter((m) => m.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch sidebar menus:", error);
      } finally {
        setIsMenusLoaded(true);
      }
    };
    fetchMenus();
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    // Normalize path: lowercase and remove trailing slash
    const normalizePath = (p) => p.toLowerCase().replace(/\/$/, "");
    const currentPath = normalizePath(location.pathname);
    
    // 1. Check dynamic menus (including those from DB)
    // We also check the hardcoded submenus for Master Data
    const masterDataSubmenus = [
      { path: "/admin/masterdata/departments", label: "MASTER DEPARTMENTS" },
      { path: "/admin/masterdata/applications", label: "MASTER APPLICATIONS" },
      { path: "/admin/masterdata/roles", label: "MASTER ROLES" },
      { path: "/admin/masterdata/positions", label: "MASTER POSITIONS" },
      { path: "/admin/masterdata/menu", label: "MASTER MENU" },
    ];

    // Combine all possible sources of menu info
    const allMenus = [
      ...menus,
      ...masterDataSubmenus,
      // Add common static routes as fallback if they aren't in DB
      { path: "/admin/dashboard-admin", label: "DASHBOARD" },
      { path: "/admin/active-session", label: "ACTIVE SESSION" },
      { path: "/admin/application-management", label: "APPLICATION MANAGEMENT" },
      { path: "/admin/user-control", label: "USER CONTROL" },
      { path: "/admin/broadcast", label: "BROADCAST MESSAGE" },
    ];
    
    const activeMenu = allMenus.find(m => normalizePath(m.path) === currentPath);
    if (activeMenu) return activeMenu.label.toUpperCase();

    // 2. Fallback: derive from path name
    const pathParts = currentPath.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== "admin") {
      return lastPart.replace(/-/g, " ").toUpperCase();
    }

    return "ADMIN PANEL";
  };

  return (
    <div className="admin-container">
      <Sidebar dynamicMenus={menus} isMenusLoaded={isMenusLoaded} />
      <main className="admin-main">
        <div className="admin-header">
          <div className="header-content-wrapper">
            <h1>{getPageTitle()}</h1>
            <button
              className="back-to-dashboard-btn"
              onClick={() => setShowUserNavModal(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* Navigation Confirmation Modal */}
      {showUserNavModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUserNavModal(false)}
          style={{ zIndex: 10001 }}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "400px",
              padding: "30px",
              borderRadius: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#e0f2fe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Back to Dashboard?
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              You are returning to the user dashboard. Any unsaved changes in
              the admin view might be lost.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowUserNavModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#64748b",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUserNavModal(false);
                  navigate("/dashboard");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#0ea5e9",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
