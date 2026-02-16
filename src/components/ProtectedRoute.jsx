import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ adminOnly = false }) {
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");

  // Check if user is logged in
  if (!userType || !userEmail) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin-only route
  if (adminOnly && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
