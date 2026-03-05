import { useCallback } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useIdleTimeout } from "../hooks/useIdleTimeout";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit — UX warning (security enforcement di backend)

export default function ProtectedRoute({ adminOnly = false }) {
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");
  const user = localStorage.getItem("user");

  // Autentikasi via httpOnly cookie — cookie dikirim otomatis oleh browser.
  // Di sini kita cek apakah data user masih ada di localStorage
  // (diset saat login berhasil). Jika tidak ada, berarti belum login.
  const isAuthenticated = user && userType && userEmail;

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin-only route
  if (adminOnly && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
