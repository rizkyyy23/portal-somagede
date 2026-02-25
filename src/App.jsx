import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import ActiveSession from "./pages/admin/ActiveSession";
import ApplicationManagement from "./pages/admin/ApplicationManagement";
import UserControl from "./pages/admin/UserControl";
import Broadcast from "./pages/admin/Broadcast";
import MasterDepartments from "./pages/admin/mastercard/MasterDepartments";
import MasterApplications from "./pages/admin/mastercard/MasterApplications";
import MasterRoles from "./pages/admin/mastercard/MasterRoles";
import MasterPositions from "./pages/admin/mastercard/MasterPositions";

import MasterMenu from "./pages/admin/mastercard/MasterMenu";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard-admin" element={<DashboardAdmin />} />
            <Route path="/admin/active-session" element={<ActiveSession />} />
            <Route
              path="/admin/application-management"
              element={<ApplicationManagement />}
            />
            <Route path="/admin/user-control" element={<UserControl />} />
            <Route path="/admin/broadcast" element={<Broadcast />} />

            {/* Masterdata Routes */}
            <Route
              path="/admin/masterdata/departments"
              element={<MasterDepartments />}
            />
            <Route
              path="/admin/masterdata/applications"
              element={<MasterApplications />}
            />
            <Route path="/admin/masterdata/roles" element={<MasterRoles />} />
            <Route
              path="/admin/masterdata/positions"
              element={<MasterPositions />}
            />
            <Route path="/admin/masterdata/menu" element={<MasterMenu />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
