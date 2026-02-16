import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/admin-dashboard.css";

const AdminLayout = () => {
  const [showUserNavModal, setShowUserNavModal] = useState(false);
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    const titles = {
      "dashboard-admin": "DASHBOARD",
      "active-session": "ACTIVE SESSION",
      "application-management": "APPLICATION MANAGEMENT",
      "user-control": "USER CONTROL",
      broadcast: "BROADCAST MESSAGE",
    };
    return titles[path] || "ADMIN PANEL";
  };

  return (
    <div className="admin-container">
      <Sidebar />
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
                  window.location.href = "/dashboard";
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
