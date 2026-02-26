import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import {
  Users,
  AppWindow,
  Building2,
  Megaphone,
  BarChart3,
  Clock,
  UserCheck,
  Activity,
  Monitor,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { api } from "../../utils/api";
import "../../styles/DashboardAdmin.css";
import "../../styles/MasterData.css";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [loginTrends, setLoginTrends] = useState([]);
  const [appUsage, setAppUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutCandidate, setLogoutCandidate] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showFullActiveModal, setShowFullActiveModal] = useState(false);
  const [activeDeptStats, setActiveDeptStats] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchActiveBroadcasts();
    fetchAnalytics();
    fetchDepartments();
  }, []);

  // Show welcome notification only once per login session
  useEffect(() => {
    if (sessionStorage.getItem("adminWelcomeShown")) return;

    const storedUser = localStorage.getItem("user");
    let adminName = "Admin";
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        adminName = userData.name || "Admin";
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    const timer = setTimeout(() => {
      showToast(`Selamat datang di admin panel, ${adminName}!`, "dark");
      sessionStorage.setItem("adminWelcomeShown", "true");
    }, 500);
    return () => clearTimeout(timer);
  }, [showToast]);

  const fetchDepartments = async () => {
    try {
      const result = await api.get("/departments");
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const trendData = await api.get("/analytics/trends");

      if (trendData.success) {
        // Use the 'day' field from backend for fixed Mon-Sun order
        const formattedTrends = trendData.data.map((d) => ({
          ...d,
          formattedDate: d.day,
        }));
        setLoginTrends(formattedTrends);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const COLORS = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  const fetchActiveBroadcasts = async () => {
    try {
      const result = await api.get("/broadcasts/active");
      if (result.success) {
        setActiveBroadcasts(result.data.slice(0, 3)); // Limit to 3 latest
      }
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const result = await api.get("/dashboard/stats");

      if (result.success) {
        const data = result.data;

        // Create overview stats cards
        const overviewStats = [
          {
            label: "Active Users",
            value: data.activeSessionCount, // Use session count as active users
            icon: <UserCheck size={24} />,
            type: "finance",
          },
          {
            label: "Active Applications",
            value: data.totalApplications,
            icon: <AppWindow size={24} />,
            type: "it",
          },
          {
            label: "Total Departments",
            value: data.totalDepartments,
            icon: <Building2 size={24} />,
            type: "warehouse",
          },
          {
            label: "Total Users",
            value: data.totalUsers,
            icon: <Users size={24} />,
            type: "hr",
          },
        ];

        setStats(overviewStats);
        setActiveSessions(data.recentSessions || []);
        setTotalSessions(data.activeSessionCount || 0);
        setDepartmentStats(data.departmentStats || []);
        setActiveDeptStats(data.activeSessionsByDept || []);
        // Populate Top Applications from current active sessions as requested
        setAppUsage(data.topActiveApps || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "??";
    const names = name.split(" ");
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = [
      { bg: "#e3f2fd", color: "#4a90e2" },
      { bg: "#ffebee", color: "#e74c3c" },
      { bg: "#e8f5e9", color: "#27ae60" },
      { bg: "#f3e5f5", color: "#9b59b6" },
      { bg: "#fff3e0", color: "#f39c12" },
      { bg: "#e0f7fa", color: "#00bcd4" },
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleForceLogout = (session) => {
    setLogoutCandidate(session);
  };

  const confirmForceLogout = async () => {
    if (!logoutCandidate) return;

    try {
      await api.delete(`/sessions/${logoutCandidate.id}`);
      fetchDashboardData();
      showToast(
        `${logoutCandidate.user_name} has been logged out successfully.`,
        "success",
      );
      setLogoutCandidate(null);
    } catch (error) {
      showToast("Failed to force logout.", "error");
    }
  };

  const getDeptColor = (deptName) => {
    const dept = departments.find((d) => d.name === deptName);
    return dept?.color || "#6366f1"; // Default to Indigo if not found
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div>
      <div className="section-title">OVERVIEW</div>
      <div className="overview-grid">
        {stats.length === 0 ? (
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Loading...</div>
            </div>
          </div>
        ) : (
          stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className={`stat-icon ${stat.type}`}>{stat.icon}</div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DASHBOARD WIDGETS */}
      <div className="dashboard-widgets-grid">
        {/* Active Broadcasts Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <span className="text-secondary">
              <Megaphone size={20} />
            </span>
            <h3 className="widget-title">Active Broadcasts</h3>
          </div>

          <div className="broadcast-list">
            {activeBroadcasts.length === 0 ? (
              <div className="empty-widget-state">No active broadcasts</div>
            ) : (
              activeBroadcasts.map((broadcast) => {
                const priorityClass = broadcast.priority || "normal";
                return (
                  <div
                    key={broadcast.id}
                    className={`broadcast-item priority-${priorityClass}`}
                  >
                    <div className="broadcast-item-header">
                      <strong className="broadcast-item-title">
                        {broadcast.title}
                      </strong>
                      {broadcast.priority === "urgent" && (
                        <span className="urgent-pill">URGENT</span>
                      )}
                      {broadcast.priority === "high" && (
                        <span className="high-pill">HIGH PRIORITY</span>
                      )}
                    </div>
                    <p className="broadcast-item-message">
                      {broadcast.message}
                    </p>
                    {broadcast.expires_at && (
                      <div className="broadcast-item-footer">
                        <Clock size={10} />
                        Expires:{" "}
                        {new Date(broadcast.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {activeBroadcasts.length > 0 && (
              <button
                onClick={() => navigate("/admin/broadcast")}
                className="view-all-link"
              >
                View all broadcasts →
              </button>
            )}
          </div>
        </div>

        {/* Login Trends Widget */}
        <div className="widget-card span-3">
          <div className="widget-header-between">
            <div className="widget-header-title">
              <span className="text-primary">
                <Activity size={20} />
              </span>
              <h3 className="widget-title">Login Activity (Last 7 Days)</h3>
            </div>
            <div className="widget-subtitle">Updated Just Now</div>
          </div>

          <div className="chart-container futuristic-chart">
            {loginTrends.length === 0 ? (
              <div className="empty-widget-state">
                <Activity size={48} className="text-gray-300 mb-2" />
                <p>No activity data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={loginTrends}
                  margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <filter id="glow" height="200%">
                      <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="3"
                        result="blur"
                      />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    interval={0}
                    dy={10}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{
                      stroke: "#8b5cf6",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip futuristic-tooltip">
                            <div className="tooltip-header">{label}</div>
                            <div className="tooltip-body">
                              <span className="tooltip-dot"></span>
                              <span className="tooltip-value">
                                {payload[0].value}
                              </span>
                              <span className="tooltip-label">Logins</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="url(#gradientStroke)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorLogin)"
                    filter="url(#glow)"
                    animationDuration={1500}
                  />
                  <defs>
                    <linearGradient
                      id="gradientStroke"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Most Used Apps Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <span className="text-warning">
              <Monitor size={20} />
            </span>
            <h3 className="widget-title">Top Applications</h3>
          </div>

          <div className="app-usage-list">
            {appUsage.length === 0 ? (
              <div className="empty-widget-state">No usage data recorded</div>
            ) : (
              appUsage.map((app, index) => (
                <div key={index} className="app-usage-item">
                  <div className="widget-header-title">
                    <div
                      className="app-rank-box"
                      style={{ color: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <span className="text-medium">{app.name}</span>
                  </div>
                  <span className="text-bold">{app.value} Users</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Users by Department Chart */}
        <div className="widget-card">
          <div className="widget-header-between">
            <div className="widget-header-title">
              <span className="text-danger">
                <Activity size={20} />
              </span>
              <h3 className="widget-title">Active Users by Dept</h3>
            </div>
            <button
              onClick={() => setShowFullActiveModal(true)}
              className="widget-action-link"
            >
              View All
            </button>
          </div>

          <div className="dist-list">
            {activeDeptStats.length === 0 ? (
              <div className="empty-widget-state">No users online</div>
            ) : (
              activeDeptStats.slice(0, 4).map((dept, index) => {
                const totalActive =
                  activeDeptStats.reduce((acc, curr) => acc + curr.count, 0) ||
                  1;
                const percentage = Math.round((dept.count / totalActive) * 100);
                const color = getDeptColor(dept.department);
                return (
                  <div key={index}>
                    <div className="dist-item-header">
                      <span className="dist-label">{dept.department}</span>
                      <span className="dist-value">
                        {dept.count}{" "}
                        <span className="text-small-gray">Active</span>
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%`, background: color }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Department Distribution (Pie Chart) - MOVED */}
        <div className="widget-card span-2">
          <div className="widget-header-between">
            <div className="widget-header-title">
              <span className="text-green">
                <BarChart3 size={20} />
              </span>
              <h3 className="widget-title">Employee Distribution</h3>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="widget-action-link"
            >
              View All
            </button>
          </div>

          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentStats.map((d) => ({
                    name: d.department,
                    value: d.count,
                  }))}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center-label">
              <div className="pie-center-value">
                {departmentStats.reduce((a, b) => a + b.count, 0)}
              </div>
              <div className="pie-center-text">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENT DISTRIBUTION MODAL */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div
            className="modal-container dashboard-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">User Distribution by Department</h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="modal-close-btn"
                title="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-dist-list">
                {departmentStats
                  .sort((a, b) => b.count - a.count)
                  .map((dept, index) => {
                    const totalActiveInDepts =
                      departmentStats.reduce(
                        (acc, curr) => acc + curr.count,
                        0,
                      ) || 1;
                    const percentage = Math.round(
                      (dept.count / totalActiveInDepts) * 100,
                    );
                    const color = getDeptColor(dept.department);

                    return (
                      <div key={index}>
                        <div className="modal-dist-item-header">
                          <span className="dist-label">{dept.department}</span>
                          <span className="dist-value">
                            {dept.count}{" "}
                            <span className="text-small-gray">
                              ({percentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              background: color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE USERS BY DEPT MODAL */}
      {showFullActiveModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowFullActiveModal(false)}
        >
          <div
            className="modal-container dashboard-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="widget-header-title">
                <span className="text-danger">
                  <Activity size={20} />
                </span>
                <h3 className="modal-title">All Active Users by Dept</h3>
              </div>
              <button
                onClick={() => setShowFullActiveModal(false)}
                className="modal-close-btn"
                title="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-dist-list">
                {activeDeptStats.map((dept, index) => {
                  const totalActive =
                    activeDeptStats.reduce(
                      (acc, curr) => acc + curr.count,
                      0,
                    ) || 1;
                  const percentage = Math.round(
                    (dept.count / totalActive) * 100,
                  );
                  const color = getDeptColor(dept.department);
                  return (
                    <div key={index}>
                      <div className="modal-dist-item-header">
                        <span className="dist-label">{dept.department}</span>
                        <span className="dist-value">
                          {dept.count}{" "}
                          <span className="text-small-gray">
                            Active ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${percentage}%`, background: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Preview */}
      <div className="session-section">
        <div className="section-header">
          <Activity size={20} color="#e74c3c" />
          <h2>Active Session</h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Active App</th>
                <th>Start Time</th>
                <th>Security</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No active sessions
                  </td>
                </tr>
              ) : (
                activeSessions.map((session) => {
                  const initials = getUserInitials(session.user_name);
                  const colors = getInitialsColor(session.user_name);
                  return (
                    <tr key={session.id}>
                      <td>
                        <div className="user-cell">
                          {session.user_avatar ? (
                            <img
                              src={session.user_avatar}
                              alt={session.user_name}
                              className="user-avatar"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="user-avatar"
                            style={{
                              background: colors.bg,
                              color: colors.color,
                              display: session.user_avatar ? "none" : "flex",
                            }}
                          >
                            {initials}
                          </div>
                          <div className="user-info">
                            <h4
                              className={
                                session.user_name && session.user_name.length > 20
                                  ? "small-name"
                                  : ""
                              }
                            >
                              {session.user_name}
                            </h4>
                            <p
                              className={
                                session.user_email &&
                                session.user_email.length > 24
                                  ? "small-email"
                                  : ""
                              }
                            >
                              {session.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`role-badge ${(session.role || "user").toLowerCase()}`}
                        >
                          {session.role || "User"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="dept-badge"
                          style={{
                            backgroundColor: `${getDeptColor(session.department)}15`,
                            color: getDeptColor(session.department),
                          }}
                        >
                          {session.department}
                        </span>
                      </td>
                      <td>{session.app_name || "Portal"}</td>
                      <td>
                        {formatTime(session.login_at)} (
                        {formatDuration(session.login_at)})
                      </td>
                      <td>
                        <button
                          className="force-logout-btn"
                          onClick={() => handleForceLogout(session)}
                        >
                          Force Logout
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {activeSessions.length} of {totalSessions} active sessions
          </span>
          <button
            className="view-all-btn"
            onClick={() => navigate("/admin/active-session")}
          >
            View All
          </button>
        </div>
      </div>
      {/* FORCE LOGOUT CONFIRMATION MODAL */}
      {logoutCandidate && (
        <div
          className="confirm-dialog-overlay"
          onClick={() => setLogoutCandidate(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body">
              <div className="confirm-dialog-icon danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3>Force Logout User?</h3>
              <p>
                Are you sure you want to force logout{" "}
                <strong>{logoutCandidate.user_name}</strong>? They will be
                disconnected immediately holding IP{" "}
                <strong>{logoutCandidate.ip_address}</strong>.
              </p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                className="cd-btn cd-btn-cancel"
                onClick={() => setLogoutCandidate(null)}
              >
                Cancel
              </button>
              <button
                className="cd-btn cd-btn-danger"
                onClick={confirmForceLogout}
              >
                Force Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
