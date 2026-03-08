import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import { API_URL } from "../utils/api";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit — UX warning (security enforcement di backend)

export default function ProtectedRoute({ adminOnly = false }) {
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");
  const user = localStorage.getItem("user");

  // Autentikasi via httpOnly cookie — cookie dikirim otomatis oleh browser.
  // Di sini kita cek apakah data user masih ada di localStorage
  // (diset saat login berhasil). Jika tidak ada, berarti belum login.
  const isAuthenticated = user && userType && userEmail;

  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);

  // Session check saat app start — validasi bahwa cookie masih valid via backend
  // Jika /auth/me belum tersedia (backend belum implement), skip dan lanjut
  useEffect(() => {
    if (!isAuthenticated) {
      setSessionChecked(true);
      return;
    }

    let cancelled = false;
    // Use fetch directly (not apiClient) to avoid triggering session-expired event.
    // apiClient dispatches "session-expired" on 401, which would force redirect to login.
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          // Backend confirmed session is valid
          setSessionChecked(true);
        } else if (res.status === 401) {
          // Backend explicitly says session invalid → clear & redirect
          localStorage.removeItem("user");
          localStorage.removeItem("userType");
          localStorage.removeItem("userEmail");
          setSessionValid(false);
          setSessionChecked(true);
        } else {
          // Other error (404, 500, etc.) → endpoint not available yet, skip check
          setSessionChecked(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Network error or endpoint not found → skip check, keep session valid
        setSessionChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // UX idle warning — tampilkan overlay sebelum backend reject.
  // Security enforcement tetap di backend (cek last_activity setiap request).
  const handleIdle = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("session-expired", {
        detail: { reason: "idle_timeout" },
      }),
    );
  }, []);

  useIdleTimeout(handleIdle, IDLE_TIMEOUT, !!isAuthenticated);

  if (!isAuthenticated || !sessionValid) {
    return <Navigate to="/login" replace />;
  }

  // Wait for session check to complete before rendering
  if (!sessionChecked) {
    return null;
  }

  // Check if admin-only route
  if (adminOnly && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
