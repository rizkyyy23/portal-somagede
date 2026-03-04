import React, { useState, useEffect } from "react";
import { api } from "../utils/api";

/**
 * Global overlay that appears when a session is terminated.
 * Listens for a custom "session-expired" event dispatched from api.js or ActiveSession.
 * Also polls backend every 5s to detect force logout by admin.
 *
 * Reasons:
 * - "force_logout" → Admin force-logged out your session
 * - "session_timeout" → Session expired (401 from backend)
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

  // Poll backend every 30s to check if session is still active
  useEffect(() => {
    if (visible) return; // Stop polling once overlay is shown

    const checkSession = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("userType");
        const userEmail = localStorage.getItem("userEmail");
        const isLoggedIn = storedUser?.id && (token || (userType && userEmail));
        if (!isLoggedIn) return; // Not logged in

        const result = await api.get(`/sessions/user/${storedUser.id}`);
        if (
          result.success &&
          Array.isArray(result.data) &&
          result.data.length === 0
        ) {
          setReason("force_logout");
          setVisible(true);
        }
      } catch (err) {
        // Network error or 401 — handled by api.js
      }
    };

    // Start polling after 3s, then every 5s
    const initialTimeout = setTimeout(checkSession, 3000);
    const interval = setInterval(checkSession, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [visible]); // Re-run when visible changes

  const handleLogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

  if (!visible) return null;

  const isForceLogout = reason === "force_logout";

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
          {isForceLogout ? "Session Terminated" : "Session Timeout"}
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
          {isForceLogout
            ? "Your active session has been ended by an administrator. Please log in again to continue."
            : "Your session has expired due to inactivity. Please log in again to continue."}
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
