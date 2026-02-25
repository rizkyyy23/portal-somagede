import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ adminOnly = false }) {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");

  // Check if user is logged in
  // Accepts: JWT token (preferred) OR legacy userType+userEmail
  // TODO: Once backend enforces JWT, simplify to: if (!token)
  const isAuthenticated = token || (userType && userEmail);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin-only route
  if (adminOnly && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
