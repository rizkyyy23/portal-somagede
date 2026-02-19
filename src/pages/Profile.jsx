import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const API_URL = "/api";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;

      if (!userId) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
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
            {userData?.avatar ? (
              <img
                src={userData.avatar}
                alt={userData.name}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {getInitials(userData?.name)}
              </div>
            )}
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
                <span className="badge-internship">✦ Internship</span>
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
            className={`tab-btn ${activeTab === "job" ? "active" : ""}`}
            onClick={() => setActiveTab("job")}
          >
            Job Details
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
          <div className="tab-content">
            <div className="info-grid">
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

              <div className="quick-tip-box">
                <h4 className="tip-title">QUICK TIP</h4>
                <p className="tip-text">
                  Keeping your contact information up-to-date ensures you
                  receive important system notifications updates on time.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "job" && (
          <div className="tab-content">
            <div className="info-grid">
              <div className="job-details-card">
                <div className="job-details-header">
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

                <div className="job-details-grid">
                  <div className="job-field">
                    <label className="job-label">DEPARTMENT</label>
                    <div className="job-value">
                      {userData?.department || "Not assigned"}
                    </div>
                  </div>
                  <div className="job-field">
                    <label className="job-label">POSITION</label>
                    <div className="job-value">
                      {userData?.position || "Not assigned"}
                    </div>
                  </div>
                  <div className="job-field job-field-full">
                    <label className="job-label">EMPLOYEE ID</label>
                    <div className="job-value employee-id">
                      {userData?.employee_id || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hr-support-box">
                <h4 className="hr-title">HR Support</h4>
                <p className="hr-text">Any questions or data discrepancies?</p>
                <button className="hr-contact-btn">Contact HR Admin</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="tab-content">
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
                        Last changed 3 months ago. We recommend changing it
                        periodically.
                      </p>
                    </div>
                    <button className="settings-btn-primary">
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
                    <div className="login-item current">
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
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <div className="login-item-info">
                        <div className="login-device">Windows PC • Chrome</div>
                        <div className="login-details">
                          IP: 112.215.172.10 · Just now
                        </div>
                      </div>
                      <span className="current-badge">Current Session</span>
                    </div>
                    <div className="login-item">
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
                        <rect
                          x="5"
                          y="2"
                          width="14"
                          height="20"
                          rx="2"
                          ry="2"
                        />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                      <div className="login-item-info">
                        <div className="login-device">
                          iPhone 15 Pro • Safari
                        </div>
                        <div className="login-details">
                          IP: 182.253.155.242 · 2 hours ago
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-right">
                {/* Account Recovery */}
                <div className="settings-card account-recovery">
                  <h5 className="recovery-label">ACCOUNT RECOVERY</h5>

                  <div className="recovery-item">
                    <div className="recovery-icon">
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
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="recovery-info">
                      <div className="recovery-title">RECOVERY EMAIL</div>
                      <div className="recovery-value">
                        {userData?.email?.replace(
                          /(.{2})(.*)(@.*)/,
                          "$1*****$3",
                        ) || "r*****s@personal.com"}
                      </div>
                      <button className="recovery-change-btn">Change</button>
                    </div>
                  </div>

                  <div className="recovery-item">
                    <div className="recovery-icon">
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
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </div>
                    <div className="recovery-info">
                      <div className="recovery-title">PHONE NUMBER</div>
                      <div className="recovery-value">
                        {userData?.phone?.replace(
                          /(\d{4})(\d{4})(\d{4})/,
                          "$1-****-$3",
                        ) || "+62 812-****-7890"}
                      </div>
                      <button className="recovery-change-btn">Change</button>
                    </div>
                  </div>
                </div>

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
              <div className="modal-login-item current">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">
                    macOS Desktop • Chrome
                  </div>
                  <div className="modal-login-details">
                    IP: 182.253.155.242 · Just now
                  </div>
                </div>
                <span className="modal-current-badge">Current Session</span>
              </div>

              <div className="modal-login-item">
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
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">
                    iPhone 15 Pro • Safari
                  </div>
                  <div className="modal-login-details">
                    IP: 182.253.155.242 · 2 hours ago
                  </div>
                </div>
                <button className="modal-logout-btn">Logout</button>
              </div>

              <div className="modal-login-item">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">Windows PC • Edge</div>
                  <div className="modal-login-details">
                    IP: 112.215.172.10 · Yesterday at 14:20
                  </div>
                </div>
                <button className="modal-logout-btn">Logout</button>
              </div>

              <div className="modal-login-item">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">
                    macOS Desktop • Chrome
                  </div>
                  <div className="modal-login-details">
                    IP: 182.253.155.242 · Just now
                  </div>
                </div>
                <button className="modal-logout-btn">Logout</button>
              </div>

              <div className="modal-login-item">
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
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">
                    iPhone 15 Pro • Safari
                  </div>
                  <div className="modal-login-details">
                    IP: 182.253.155.242 · 2 hours ago
                  </div>
                </div>
                <button className="modal-logout-btn">Logout</button>
              </div>

              <div className="modal-login-item">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="modal-login-info">
                  <div className="modal-login-device">Windows PC • Edge</div>
                  <div className="modal-login-details">
                    IP: 112.215.172.10 · Yesterday at 14:20
                  </div>
                </div>
                <button className="modal-logout-btn">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
