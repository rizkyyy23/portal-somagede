import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "../styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassFields, setShowPassFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Login activity states
  const [loginSessions, setLoginSessions] = useState([]);
  const [loginSessionsLoading, setLoginSessionsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutTarget, setLogoutTarget] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchUserSessions();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;

      if (!userId) {
        navigate("/login");
        return;
      }

      const data = await api.get(`/users/${userId}`);

      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own sessions + login history
  const fetchUserSessions = async () => {
    try {
      setLoginSessionsLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;
      if (!userId) return;

      // Fetch both active sessions and login history in parallel
      const [sessionsData, historyData] = await Promise.all([
        api.get(`/sessions/user/${userId}`),
        api.get(`/login-history/user/${userId}`),
      ]);

      const activeSessions = sessionsData.success ? sessionsData.data : [];
      const loginHistory = historyData.success ? historyData.data : [];

      // Combine: active sessions first (marked as current), then past logins
      // Skip history entries that match the current active session time
      const activeIds = new Set(activeSessions.map((s) => s.id));
      const activeLoginTimes = new Set(
        activeSessions.map((s) => new Date(s.login_at).getTime()),
      );

      const pastLogins = loginHistory
        .filter((h) => !activeLoginTimes.has(new Date(h.login_at).getTime()))
        .map((h) => ({ ...h, _isPast: true }));

      setLoginSessions([
        ...activeSessions.map((s) => ({ ...s, _isCurrent: true })),
        ...pastLogins,
      ]);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
    } finally {
      setLoginSessionsLoading(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1)
      return { level: 1, label: "WEAK PASSWORD", color: "#ef4444" };
    if (score <= 2)
      return { level: 2, label: "FAIR PASSWORD", color: "#f59e0b" };
    if (score <= 3)
      return { level: 3, label: "GOOD PASSWORD", color: "#3b82f6" };
    return { level: 4, label: "STRONG PASSWORD", color: "#22c55e" };
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const togglePassField = (field) => {
    setShowPassFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassFields({ current: false, new: false, confirm: false });
    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleSubmitPassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    // Show confirmation modal instead of directly saving
    setShowPasswordConfirm(true);
  };

  const confirmPasswordChange = async () => {
    setShowPasswordConfirm(false);
    setPasswordLoading(true);
    setPasswordError("");

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const data = await api.put(
        `/users/${storedUser?.id}/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      );

      if (data.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Re-fetch user data to update password_changed_at
        await fetchUserData();
        setTimeout(() => closePasswordModal(), 2500);
      } else {
        setPasswordError(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
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

  // Password change cooldown helpers
  const getPasswordChangeInfo = () => {
    if (!userData?.password_changed_at) {
      return {
        canChange: true,
        daysAgo: null,
        remainingDays: 0,
        label: "Never changed. We recommend setting a strong password.",
      };
    }
    const lastChanged = new Date(userData.password_changed_at);
    const now = new Date();
    const diffDays = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, 30 - diffDays);
    const canChange = diffDays >= 30;

    let label;
    if (diffDays === 0) label = "Changed today.";
    else if (diffDays === 1) label = "Changed yesterday.";
    else if (diffDays < 30) label = `Changed ${diffDays} days ago.`;
    else if (diffDays < 60) label = "Changed about 1 month ago.";
    else label = `Changed ${Math.floor(diffDays / 30)} months ago.`;

    if (!canChange) {
      label += ` You can change again in ${remainingDays} day(s).`;
    } else {
      label += " We recommend changing it periodically.";
    }

    return { canChange, daysAgo: diffDays, remainingDays, label };
  };

  // Session activity helpers
  const formatSessionTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDays < 7) {
      return `${diffDays} days ago at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getDeviceIcon = (session) => {
    // Simple icon — desktop monitor
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  };

  const handleSessionLogout = (session) => {
    setLogoutTarget(session);
    setShowLogoutConfirm(true);
  };

  const confirmSessionLogout = async () => {
    if (!logoutTarget) return;
    try {
      await api.delete(`/sessions/${logoutTarget.id}`);
      // Check if user is logging out their own current session
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (logoutTarget.user_id === storedUser.id && loginSessions.length <= 1) {
        // This was the only session — trigger session expired
        window.dispatchEvent(
          new CustomEvent("session-expired", {
            detail: { reason: "force_logout" },
          }),
        );
        return;
      }
      // Re-fetch sessions to update the list
      await fetchUserSessions();
    } catch (error) {
      console.error("Error logging out session:", error);
    }
    setShowLogoutConfirm(false);
    setLogoutTarget(null);
  };

  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ")[0];
  };

  const getLastName = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.split(" ");
    return parts.slice(1).join(" ");
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="page-title">Employee Profile</h1>
        </div>
        <div className="header-right">
          <img
            src="/assets/logo somagede black.png"
            alt="Somagede Indonesia"
            className="company-logo"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        {/* Profile Card */}
        <div className="profile-card-top">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img
                src={userData?.avatar || null}
                alt={userData?.name}
                className="profile-avatar-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
              <div
                className="profile-avatar-placeholder"
                style={{ display: "none" }}
              >
                {getInitials(userData?.name)}
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h2 className="profile-name">{userData?.name || "User"}</h2>
            <p className="profile-position">
              {userData?.position && userData?.department
                ? `${userData.position} | ${userData.department}`
                : userData?.position || userData?.department || "Staff"}
            </p>
            <div className="profile-badges">
              <div className="status-badge">
                <span className="status-dot"></span>
                <span className="status-text">
                  {userData?.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              {userData?.role === "staff" && (
                <span className="badge-internship">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"></polygon>
                  </svg>
                  Internship
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "personal" && (
          <div className="tab-content personal-tab-content">
            {/* Left: Scrollable Personal Info + Job Details */}
            <div className="personal-scroll-area">
              <div className="info-section">
                <div className="section-header">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <h3>Personal Information</h3>
                </div>

                <div className="info-fields">
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">FIRST NAME</label>
                      <div className="field-value">
                        {getFirstName(userData?.name)}
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">LAST NAME</label>
                      <div className="field-value">
                        {getLastName(userData?.name)}
                      </div>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">EMAIL ADDRESS</label>
                      <div className="field-value">
                        {userData?.email || "Not provided"}
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">PHONE NUMBER</label>
                      <div className="field-value">
                        {userData?.phone || "+62 812-3456-7890"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section" style={{ marginTop: "16px" }}>
                <div className="section-header">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <h3>Job Details</h3>
                </div>

                <div className="info-fields">
                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">DEPARTMENT</label>
                      <div className="field-value">
                        {userData?.department || "Not assigned"}
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">EMPLOYEE ID</label>
                      <div className="field-value">
                        {userData?.employee_id || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">POSITION</label>
                      <div className="field-value">
                        {userData?.position || "Not assigned"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Fixed Quick Tip */}
            <div className="quick-tip-box">
              <h4 className="tip-title">QUICK TIP</h4>
              <p className="tip-text">
                Keeping your contact information up-to-date ensures you receive
                important system notifications updates on time.
              </p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="tab-content settings-tab-content">
            <div className="settings-layout">
              <div className="settings-left">
                {/* Security Settings */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <h3>Security Settings</h3>
                  </div>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4 className="settings-item-title">Change Password</h4>
                      <p className="settings-item-desc">
                        {getPasswordChangeInfo().label}
                      </p>
                      {!getPasswordChangeInfo().canChange && (
                        <div className="password-cooldown-badge">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {getPasswordChangeInfo().remainingDays} day(s)
                            remaining
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className={`settings-btn-primary ${!getPasswordChangeInfo().canChange ? "btn-disabled" : ""}`}
                      onClick={openPasswordModal}
                      disabled={!getPasswordChangeInfo().canChange}
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Recent Login Activity */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3>Recent Login Activity</h3>
                    <button
                      className="view-all-btn"
                      onClick={() => setShowLoginModal(true)}
                    >
                      View All
                    </button>
                  </div>
                  <div className="login-activity-list">
                    {loginSessionsLoading ? (
                      <div className="login-item" style={{ justifyContent: "center", color: "#94a3b8", fontSize: "12px" }}>
                        Loading sessions...
                      </div>
                    ) : loginSessions.length === 0 ? (
                      <div className="login-item" style={{ justifyContent: "center", color: "#94a3b8", fontSize: "12px" }}>
                        No login activity
                      </div>
                    ) : (
                      loginSessions.slice(0, 7).map((session) => (
                        <div key={`${session.id}-${session._isPast ? 'h' : 's'}`} className={`login-item ${session._isCurrent ? "current" : ""}`}>
                          {getDeviceIcon(session)}
                          <div className="login-item-info">
                            <div className="login-device">
                              {session.app_name || "Portal"}
                            </div>
                            <div className="login-details">
                              IP: {session.ip_address} · {formatSessionTime(session.login_at)}
                            </div>
                          </div>
                          {session._isCurrent ? (
                            <span className="current-badge">Current Session</span>
                          ) : session._isPast ? (
                            <span className="current-badge" style={{ background: "#f1f5f9", color: "#94a3b8" }}>Past</span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="settings-right">
                {/* IT Support Box */}
                <div className="it-support-box">
                  <p className="it-support-text">
                    Contact IT Support at <strong>support@somagede.com</strong>{" "}
                    if you notice any suspicious activity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="profile-footer">
        <div className="footer-content">
          <span>© 2025 SOMAGEDE INDONESIA</span>
          <div className="footer-links">
            <a href="#">TERMS OF SERVICE</a>
            <a href="#">PRIVACY POLICY</a>
            <a href="#">SECURITY</a>
          </div>
        </div>
      </footer>

      {/* Login Activity Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <div className="modal-header-left">
                <div className="modal-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Recent Login Activity</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowLoginModal(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>

            <div className="login-modal-body">
              {loginSessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>
                  No login activity found
                </div>
              ) : (
                loginSessions.map((session) => (
                  <div key={`modal-${session.id}-${session._isPast ? 'h' : 's'}`} className={`modal-login-item ${session._isCurrent ? "current" : ""}`}>
                    {getDeviceIcon(session)}
                    <div className="modal-login-info">
                      <div className="modal-login-device">
                        {session.app_name || "Portal"}
                      </div>
                      <div className="modal-login-details">
                        IP: {session.ip_address} · {formatSessionTime(session.login_at)}
                      </div>
                    </div>
                    {session._isCurrent ? (
                      <span className="modal-current-badge">Current Session</span>
                    ) : session._isPast ? (
                      <span className="modal-current-badge" style={{ background: "#f1f5f9", color: "#94a3b8" }}>Past</span>
                    ) : (
                      <button
                        className="modal-logout-btn"
                        onClick={() => handleSessionLogout(session)}
                      >
                        Logout
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with gradient */}
            <div className="password-modal-header">
              <div className="password-modal-brand">
                <img
                  src="/assets/logo somagede white.png"
                  alt="Somagede Indonesia"
                  className="password-modal-logo"
                />
              </div>
              <button
                className="password-modal-close"
                onClick={closePasswordModal}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="password-modal-body">
              <div className="password-modal-title">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                </svg>
                <h3>Update Password</h3>
              </div>
              <p className="password-modal-subtitle">
                To secure your account, please enter your current password
                followed by your new password.
              </p>

              {/* Error / Success Messages */}
              {passwordError && (
                <div className="password-alert password-alert-error">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="password-alert password-alert-success">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {passwordSuccess}
                </div>
              )}

              {/* Form Fields */}
              <div className="password-form">
                <div className="password-field-group">
                  <label className="password-field-label">
                    CURRENT PASSWORD
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassFields.current ? "text" : "password"}
                      className="password-input"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePassField("current")}
                    >
                      {showPassFields.current ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="password-field-group">
                  <label className="password-field-label">NEW PASSWORD</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassFields.new ? "text" : "password"}
                      className="password-input"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePassField("new")}
                    >
                      {showPassFields.new ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password Strength Bar */}
                  {passwordForm.newPassword && (
                    <div className="password-strength">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`strength-bar ${i <= getPasswordStrength(passwordForm.newPassword).level ? "active" : ""}`}
                            style={{
                              backgroundColor:
                                i <=
                                getPasswordStrength(passwordForm.newPassword)
                                  .level
                                  ? getPasswordStrength(
                                      passwordForm.newPassword,
                                    ).color
                                  : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      <div className="strength-info">
                        <span
                          className="strength-label"
                          style={{
                            color: getPasswordStrength(passwordForm.newPassword)
                              .color,
                          }}
                        >
                          {getPasswordStrength(passwordForm.newPassword).label}
                        </span>
                        <span className="strength-hint">Min. 8 characters</span>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="password-requirements">
                        <div
                          className={`req-item ${passwordForm.newPassword.length >= 8 ? "met" : ""}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            {passwordForm.newPassword.length >= 8 ? (
                              <polyline points="20 6 9 17 4 12" />
                            ) : (
                              <circle cx="12" cy="12" r="5" />
                            )}
                          </svg>
                          <span>At least 8 characters</span>
                        </div>
                        <div
                          className={`req-item ${/[A-Z]/.test(passwordForm.newPassword) ? "met" : ""}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            {/[A-Z]/.test(passwordForm.newPassword) ? (
                              <polyline points="20 6 9 17 4 12" />
                            ) : (
                              <circle cx="12" cy="12" r="5" />
                            )}
                          </svg>
                          <span>Contains uppercase letter (A-Z)</span>
                        </div>
                        <div
                          className={`req-item ${/[0-9]/.test(passwordForm.newPassword) ? "met" : ""}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            {/[0-9]/.test(passwordForm.newPassword) ? (
                              <polyline points="20 6 9 17 4 12" />
                            ) : (
                              <circle cx="12" cy="12" r="5" />
                            )}
                          </svg>
                          <span>Contains a number (0-9)</span>
                        </div>
                        <div
                          className={`req-item ${/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? "met" : ""}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            {/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? (
                              <polyline points="20 6 9 17 4 12" />
                            ) : (
                              <circle cx="12" cy="12" r="5" />
                            )}
                          </svg>
                          <span>Contains special character (!@#$...)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="password-field-group">
                  <label className="password-field-label">
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassFields.confirm ? "text" : "password"}
                      className="password-input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePassField("confirm")}
                    >
                      {showPassFields.confirm ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="password-save-btn"
                onClick={handleSubmitPassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Confirmation Modal */}
      {showPasswordConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordConfirm(false)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h3 className="confirm-modal-title">Confirm Password Change</h3>
            <p className="confirm-modal-text">
              Are you sure you want to change your password?
            </p>
            <div className="confirm-modal-warning">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Password change can only be done <strong>once per month</strong>
                . Make sure your new password is correct.
              </span>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="confirm-cancel-btn"
                onClick={() => setShowPasswordConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-proceed-btn"
                onClick={confirmPasswordChange}
              >
                Yes, Change Password
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Logout Session Confirmation Modal */}
      {showLogoutConfirm && logoutTarget && (
        <div
          className="modal-overlay"
          onClick={() => { setShowLogoutConfirm(false); setLogoutTarget(null); }}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon logout-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="confirm-modal-title">Logout This Session?</h3>
            <p className="confirm-modal-text">
              Are you sure you want to terminate this session?
            </p>
            <div className="confirm-modal-warning">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>{logoutTarget.app_name || "Portal"}</strong> session
                from IP <strong>{logoutTarget.ip_address}</strong> will be
                disconnected immediately.
              </span>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="confirm-cancel-btn"
                onClick={() => { setShowLogoutConfirm(false); setLogoutTarget(null); }}
              >
                Cancel
              </button>
              <button
                className="confirm-proceed-btn logout-btn"
                onClick={confirmSessionLogout}
              >
                Yes, Logout Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
