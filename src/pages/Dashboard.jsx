import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "../styles/DashboardNew.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAdminNavModal, setShowAdminNavModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Track open state for section dropdowns: { 'it': true, 'finance': false }
  const [openSections, setOpenSections] = useState({});

  // Data States
  const [user, setUser] = useState(null);
  const [categorizedApps, setCategorizedApps] = useState({});
  const [allowedAppIds, setAllowedAppIds] = useState([]);
  const [deptAllowedCodes, setDeptAllowedCodes] = useState(null); // app codes allowed for user's department
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".profile-btn")) {
        setProfileOpen(false);
      }
      if (!event.target.closest(".section-dropdown-wrap")) {
        setOpenSections({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;

      if (!userId) {
        console.error("No user ID found, redirecting to login");
        navigate("/login");
        return;
      }

      // 1. Fetch User Details
      const userData = await api.get(`/users/${userId}`);
      if (userData.success) setUser(userData.data);

      // 2. Fetch Privileges
      const privData = await api.get(`/users/${userId}/privileges`);
      if (privData.success) {
        setAllowedAppIds(privData.data.map((item) => item.application_id));
      }

      // 3. Fetch Applications
      const appData = await api.get("/applications/categories");
      if (appData.success) {
        setCategorizedApps(appData.data);
      }

      // 4. Fetch Department allowed apps (for non-admin filtering)
      const fetchedUser = userData.success ? userData.data : null;
      if (fetchedUser?.department) {
        try {
          const deptData = await api.get("/departments");
          if (deptData.success) {
            const userDept = deptData.data.find(
              (d) => d.name === fetchedUser.department,
            );
            if (userDept?.allowed_apps) {
              let codes = [];
              try {
                codes =
                  typeof userDept.allowed_apps === "string"
                    ? JSON.parse(userDept.allowed_apps)
                    : userDept.allowed_apps;
              } catch (e) {
                codes = String(userDept.allowed_apps)
                  .split(",")
                  .map((c) => c.trim());
              }
              setDeptAllowedCodes(Array.isArray(codes) ? codes : []);
            } else {
              setDeptAllowedCodes([]);
            }
          }
        } catch (e) {
          console.error("Error fetching department permissions:", e);
        }
      }

      // 5. Fetch Active Broadcasts
      const broadcastData = await api.get("/broadcasts");
      if (broadcastData.success) {
        const now = new Date();
        const activeBroadcasts = broadcastData.data
          .filter((b) => {
            // Filter by expiration
            if (b.expires_at && new Date(b.expires_at) < now) return false;

            // Filter by target audience
            if (b.target_audience === "all") return true;
            const userRole = userData.data.role?.toLowerCase(); // Check freshly fetched role
            if (
              b.target_audience === "admin" &&
              (userRole === "admin" ||
                localStorage.getItem("userType") === "admin")
            )
              return true;
            if (b.target_audience === "staff" && userRole !== "admin")
              return true;

            return false;
          })
          .sort((a, b) => {
            // Sort by priority (urgent > high > normal) then date
            const priorityOrder = { urgent: 3, high: 2, normal: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.created_at) - new Date(a.created_at);
          });
        setBroadcasts(activeBroadcasts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Cleanup active session
    try {
      if (user?.id) {
        await api.delete(`/sessions/user/${user.id}`);
      }
    } catch (e) {
      console.error("Failed to cleanup session:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    localStorage.getItem("userType")?.toLowerCase() === "admin";

  const isAppAllowed = (appId) => {
    if (isAdmin) return true;
    return allowedAppIds.includes(appId);
  };

  // Check if app is in the user's department allowed list
  const isAppInDepartment = (appCode) => {
    if (isAdmin) return true; // Admin sees all apps
    if (!deptAllowedCodes || deptAllowedCodes.length === 0) return false;
    return deptAllowedCodes.includes(appCode);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const toggleSectionDrop = (category) => {
    setOpenSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const scrollToCard = (appId) => {
    const element = document.getElementById(`card-${appId}`);
    if (element) {
      // Close all dropdowns
      setOpenSections({});

      // Scroll functionality
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Flash effect
      element.style.transition = "box-shadow .3s";
      element.style.boxShadow = "0 0 0 3px var(--blue)";
      setTimeout(() => {
        element.style.boxShadow = "";
      }, 800);
    }
  };

  // Broadcast Collapse State: Array of IDs that are collapsed
  const [collapsedIds, setCollapsedIds] = useState([]);

  const toggleBroadcast = (id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#64748b",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>

        <div className="hero-content">
          {/* Logo */}
          <div className="logo">
            <img
              src="/assets/logo somagede black.png"
              alt="Somagede Indonesia"
            />
          </div>

          {/* USER BADGE */}
          <div
            className={`profile-btn ${profileOpen ? "open" : ""}`}
            id="profileBtn"
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen(!profileOpen);
            }}
          >
            <div className="profile-avatar">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || "User"}</span>
              <span className="profile-position">
                {user?.position || "Staff"}
              </span>
            </div>
            <div className="profile-chevron">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Dropdown */}
            <div className="dropdown">
              <div className="dropdown-header">
                <div className="dh-avatar">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Av"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    getInitials(user?.name)
                  )}
                </div>
                <div className="dh-info">
                  <div className="dh-name">{user?.name}</div>
                  <div className="dh-role">
                    {user?.department || user?.position || user?.role}
                  </div>
                </div>
              </div>

              <div
                className="dropdown-item"
                onClick={() => navigate("/profile")}
              >
                <div className="di-icon">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="8" r="4" />
                  </svg>
                </div>
                Profile & Settings
                <span className="di-arrow">›</span>
              </div>

              {isAdmin && (
                <div
                  className="dropdown-item"
                  onClick={() => setShowAdminNavModal(true)}
                >
                  <div className="di-icon">
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
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  Admin Panel
                  <span className="di-arrow">›</span>
                </div>
              )}

              <div
                className="dropdown-item logout"
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setProfileOpen(false);
                }}
              >
                <div className="di-icon">
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                Logout
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom: Welcome */}
        <div className="hero-bottom">
          <div className="hero-text">
            <h1>
              Welcome Back <span>{user?.name?.split(" ")[0]}!</span>
            </h1>
            <p>
              Everything you need to manage industrial tools and logistics in
              one unified platform.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="content-area" id="contentArea">
          {Object.entries(categorizedApps).map(([category, apps]) => {
            // Filter apps based on department permissions for non-admin users
            const visibleApps = isAdmin
              ? apps // Admin sees all apps
              : apps.filter((app) => isAppInDepartment(app.code));

            // Don't render empty sections
            if (visibleApps.length === 0) return null;

            const isOther =
              category.toLowerCase() === "other" ||
              category.toLowerCase() === "others";
            const displayCategory = isOther
              ? `${user?.department || user?.position || "Department"} Department`
              : category;

            const isDeptHeader = isOther;

            return (
              <div
                className="section"
                data-category={category.toLowerCase()}
                key={category}
              >
                <div
                  className={`section-header ${isDeptHeader ? "department-header" : ""}`}
                >
                  <div
                    className={`section-dropdown-wrap ${openSections[category] ? "open" : ""}`}
                    id={`drop-${category}`}
                  >
                    <button
                      className="section-dropdown-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionDrop(category);
                      }}
                    >
                      <span className="section-title">{displayCategory}</span>
                      <span className="trigger-caret">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    <div className="section-dropdown">
                      {visibleApps.map((app) => (
                        <button
                          key={app.id}
                          className="section-dropdown-item"
                          onClick={() => scrollToCard(app.id)}
                        >
                          {app.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="section-underline"></div>

                <div className="cards-grid">
                  {visibleApps.map((app) => {
                    const allowed = isAppAllowed(app.id);
                    const isInactive = app.status === "inactive";
                    const canAccess = allowed && !isInactive;

                    return (
                      <div
                        className={`app-card ${!canAccess ? "locked" : ""}`}
                        id={`card-${app.id}`}
                        key={app.id}
                      >
                        <div
                          className="deco"
                          style={{
                            background: canAccess ? "var(--blue)" : "#94a3b8",
                          }}
                        ></div>

                        {/* Inactive Badge */}
                        {isInactive && (
                          <div className="inactive-badge">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line
                                x1="4.93"
                                y1="4.93"
                                x2="19.07"
                                y2="19.07"
                              ></line>
                            </svg>
                            INACTIVE
                          </div>
                        )}

                        {!canAccess && (
                          <div className="lock-overlay">
                            {isInactive ? (
                              // Inactive icon (slash/ban)
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line
                                  x1="4.93"
                                  y1="4.93"
                                  x2="19.07"
                                  y2="19.07"
                                ></line>
                              </svg>
                            ) : (
                              // Locked icon
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            )}
                          </div>
                        )}

                        <div
                          className="card-icon-wrap"
                          style={{
                            background: canAccess
                              ? "rgba(37, 99, 235, 0.1)"
                              : "#f1f5f9",
                          }}
                        >
                          {app.icon ? (
                            <img
                              src={app.icon}
                              alt={app.name}
                              style={{ opacity: canAccess ? 1 : 0.5 }}
                            />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={canAccess ? "var(--blue)" : "#94a3b8"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                          )}
                        </div>

                        <div className="card-title">{app.name}</div>
                        {/* Description removed as per request */}

                        <a
                          href={canAccess ? app.url : "#"}
                          target={canAccess ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className={`launch-link ${!canAccess ? "disabled" : ""}`}
                          onClick={(e) => !canAccess && e.preventDefault()}
                        >
                          {canAccess ? (
                            <>
                              Launch Application
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          ) : isInactive ? (
                            <>
                              Temporarily Unavailable
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            </>
                          ) : (
                            <>
                              Access Locked
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z"></path>
                                <path d="M15 11V8a4 4 0 0 0-8 0v3"></path>
                              </svg>
                            </>
                          )}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* No apps at all or no apps visible for this user's department */}
          {(Object.keys(categorizedApps).length === 0 ||
            (!isAdmin &&
              Object.values(categorizedApps).every(
                (apps) =>
                  apps.filter((app) => isAppInDepartment(app.code)).length ===
                  0,
              ))) && (
            <div className="no-apps-message">
              <div className="no-apps-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <line
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    stroke="#e74c3c"
                    strokeWidth="2"
                  ></line>
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                No Applications Allowed
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.6",
                  maxWidth: "400px",
                }}
              >
                Your department currently has no applications assigned.
                <br />
                Please contact your administrator to request access.
              </p>
            </div>
          )}
        </div>

        {/* SIDEBAR: Notifications (Broadcasts) */}
        <aside className="sidebar" id="notifSidebar">
          {broadcasts.length > 0 ? (
            broadcasts.map((broadcast) => {
              const isCollapsed = collapsedIds.includes(broadcast.id);
              return (
                <div
                  className={`notif-card priority-${broadcast.priority} ${isCollapsed ? "collapsed" : ""}`}
                  key={broadcast.id}
                >
                  <div className="notif-head">
                    <div className="notif-avatar">
                      {broadcast.priority === "urgent" ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ) : broadcast.priority === "high" ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="12" x2="12" y2="8" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m3 11 18-5v12L3 14v-3z" />
                          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                        </svg>
                      )}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{broadcast.title}</div>
                      {!isCollapsed && (
                        <div className="notif-time">
                          {new Date(broadcast.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="notif-body">{broadcast.message}</div>
                  )}

                  <button
                    className="notif-dismiss"
                    onClick={() => toggleBroadcast(broadcast.id)}
                  >
                    {isCollapsed ? (
                      <>
                        Show Details
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ marginLeft: 4 }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Dismiss
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ marginLeft: 4, transform: "rotate(180deg)" }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "12px",
                background: "white",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              No new announcements
            </div>
          )}
        </aside>
      </div>
      {/* Navigation Modal */}
      {showAdminNavModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAdminNavModal(false)}
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
                background: "#e0e7ff",
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
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
              Move to Admin Panel?
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              You are about to enter the Admin Panel. Do you wish to continue?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowAdminNavModal(false)}
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
                  setShowAdminNavModal(false);
                  navigate("/admin/dashboard-admin");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#4f46e5",
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-confirm-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e53e3e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="logout-confirm-title">Konfirmasi Logout</h3>
            <p className="logout-confirm-text">
              Apakah Anda yakin ingin keluar dari akun ini?
            </p>
            <div className="logout-confirm-actions">
              <button
                className="logout-confirm-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Batal
              </button>
              <button
                className="logout-confirm-yes"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Page Loading Overlay */}
      {isLoggingOut && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Logging out...</p>
          </div>
        </div>
      )}
    </div>
  );
}
