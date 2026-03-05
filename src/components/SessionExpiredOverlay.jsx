import React, { useState, useEffect } from "react";

/**
 * Global overlay that appears when a session is terminated.
 * Listens for a custom "session-expired" event dispatched by:
 * - api.js → any 401 response (backend menolak karena session tidak valid / idle timeout / JWT expired)
 * - ActiveSession.jsx → admin force-logout diri sendiri
 * - Profile.jsx → user logout session terakhirnya sendiri
 * - ProtectedRoute.jsx → frontend idle timeout (UX warning)
 *
 * TIDAK ada polling.
 * Security enforcement 100% di backend (cek session + last_activity setiap request).
 * Force logout terdeteksi saat user melakukan request berikutnya → 401 → event ini.
 *
 * Reasons:
 * - "force_logout" → Admin force-logged out your session
 * - "session_timeout" → Session expired (401 from backend / JWT expired)
 * - "idle_timeout" → User inactive for 30 minutes (backend enforcement + frontend UX)
 */
const SessionExpiredOverlay = () => {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState("session_timeout");

  useEffect(() => {
    const handleSessionExpired = (e) => {
      setReason(e.detail?.reason || "session_timeout");
      setVisible(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  const handleLogin = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

  if (!visible) return null;

  const isForceLogout = reason === "force_logout";
  const isIdleTimeout = reason === "idle_timeout";

  const getTitle = () => {
    if (isForceLogout) return "Session Terminated";
    if (isIdleTimeout) return "Session Idle";
    return "Session Expired";
  };

  const getMessage = () => {
    if (isForceLogout)
      return "Your active session has been ended by an administrator. Please log in again to continue.";
    if (isIdleTimeout)
      return "You have been logged out due to 30 minutes of inactivity. Please log in again to continue.";
    return "Your session has expired. Please log in again to continue.";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(8px)",
        animation: "sessFadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "40px 32px 32px",
          maxWidth: 380,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
          animation: "sessScaleIn 0.3s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          {isForceLogout ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1e293b",
            margin: "0 0 6px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {isForceLogout
            ? "Session Terminated"
            : isIdleTimeout
              ? "Session Idle"
              : "Session Expired"}
        </h2>

        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.6,
            margin: "0 0 28px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {getMessage()}
        </p>

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "11px 24px",
            background: "#334155",
            border: "none",
            borderRadius: 10,
            color: "#f8fafc",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1e293b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#334155";
          }}
        >
          Login Again
        </button>
      </div>

      <style>{`
        @keyframes sessFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sessScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SessionExpiredOverlay;
