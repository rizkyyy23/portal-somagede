import { useState, useEffect, useRef } from "react";
import "../../styles/UserControl.css";

const API_URL = "/api";

const UserControl = () => {
  // State for departments, positions, roles
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);

  // Fetch departments, positions, roles from database
  useEffect(() => {
    // Fetch departments
    fetch(`${API_URL}/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDepartments(data.data);
      });
    // Fetch positions
    fetch(`${API_URL}/positions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPositions(data.data.map((p) => p.name));
      });
    // Fetch roles
    fetch(`${API_URL}/roles`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRoles(data.data);
      });
  }, []);
  // State declarations
  const [activeTab, setActiveTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const avatarPreviewUrl = useRef(null);
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [privilegeUsers, setPrivilegeUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [pendingAppToggle, setPendingAppToggle] = useState(null); // { appId, appName, newValue }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "Staff",
    department: "Finance",
    role: "User",
    status: "active",
    accountActive: true,
    privilegeAccess: false,
  });

  // Fetch all users and applications on component mount
  useEffect(() => {
    fetchAllUsers();
    // Fetch all applications
    fetch(`${API_URL}/applications`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setApplications(data.data);
      });
  }, []);

  // Cleanup avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.current) {
        URL.revokeObjectURL(avatarPreviewUrl.current);
      }
    };
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all users data in parallel from different endpoints for accuracy
      const [allResponse, inactiveResponse, adminResponse, privilegeResponse] =
        await Promise.all([
          fetch(`${API_URL}/users`),
          fetch(`${API_URL}/users/inactive`),
          fetch(`${API_URL}/users/admins`),
          fetch(`${API_URL}/users/privilege`),
        ]);

      const allData = await allResponse.json();
      const inactiveData = await inactiveResponse.json();
      const adminData = await adminResponse.json();
      const privilegeData = await privilegeResponse.json();

      if (
        allData.success &&
        inactiveData.success &&
        adminData.success &&
        privilegeData.success
      ) {
        // Set all users
        setUsers(allData.data);

        // Set users for each tab with correct data from respective endpoints
        setInactiveUsers(inactiveData.data);
        setActiveUsers(allData.data.filter((u) => u.status === "active"));
        setAdminUsers(adminData.data);
        setPrivilegeUsers(privilegeData.data);
      } else {
        setError("Failed to fetch users data");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: get avatar preview URL safely (revoke old one)
  const getAvatarPreview = (file) => {
    if (avatarPreviewUrl.current) {
      URL.revokeObjectURL(avatarPreviewUrl.current);
    }
    const url = URL.createObjectURL(file);
    avatarPreviewUrl.current = url;
    return url;
  };

  const getDeptColor = (deptName) => {
    if (!deptName) return "#94a3b8";
    const dept = departments.find((d) => d.name === deptName);
    return dept?.color || "#6366f1";
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
      { bg: "#fff3e0", color: "#f39c12" },
      { bg: "#ede7f6", color: "#8e44ad" },
      { bg: "#f1f8e9", color: "#388e3c" },
      { bg: "#fce4ec", color: "#d81b60" },
      { bg: "#f9fbe7", color: "#cddc39" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const getCurrentUsers = () => {
    if (activeTab === "inactive-users") return inactiveUsers;
    if (activeTab === "privilege-users") return privilegeUsers;
    if (activeTab === "active-users") return activeUsers;
    if (activeTab === "admin-users") return adminUsers;
    return users;
  };

  const filteredUsers = getCurrentUsers()
    .filter(
      (user) =>
        ((user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) &&
        (deptFilter === "" || user.department === deptFilter),
    )
    .sort((a, b) => {
      if (a.role === "Admin" && b.role !== "Admin") return -1;
      if (a.role !== "Admin" && b.role === "Admin") return 1;
      return 0;
    });

  // ...existing code...
  // === UI START ===
  return (
    <div className="user-control-section">
      <div className="section-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h2>User Management</h2>
      </div>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#c33",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className="control-header">
        <div className="user-control-tabs">
          <button
            className={`user-control-tab${activeTab === "all-users" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("all-users");
              setDeptFilter("");
            }}
          >
            <span>All</span>
            <span
              className="tab-count"
              style={{ fontWeight: 400, marginLeft: 6 }}
            >
              ({users.length})
            </span>
          </button>
          <button
            className={`user-control-tab${activeTab === "active-users" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("active-users");
              setDeptFilter("");
            }}
          >
            <span>Active Users</span>
            <span
              className="tab-count"
              style={{ fontWeight: 400, marginLeft: 6 }}
            >
              ({activeUsers.length})
            </span>
          </button>
          <button
            className={`user-control-tab${activeTab === "inactive-users" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("inactive-users");
              setDeptFilter("");
            }}
          >
            <span>Inactive Users</span>
            <span
              className="tab-count"
              style={{ fontWeight: 400, marginLeft: 6 }}
            >
              ({inactiveUsers.length})
            </span>
          </button>
          <button
            className={`user-control-tab${activeTab === "privilege-users" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("privilege-users");
              setDeptFilter("");
            }}
          >
            <span>Privilege Users</span>
            <span
              className="tab-count"
              style={{ fontWeight: 400, marginLeft: 6 }}
            >
              ({privilegeUsers.length})
            </span>
          </button>
          <button
            className={`user-control-tab${activeTab === "admin-users" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("admin-users");
              setDeptFilter("");
            }}
          >
            <span>Admin</span>
            <span
              className="tab-count"
              style={{ fontWeight: 400, marginLeft: 6 }}
            >
              ({adminUsers.length})
            </span>
          </button>
        </div>
      </div>
      {activeTab !== "inactive-users" &&
        activeTab !== "privilege-users" &&
        activeTab !== "admin-users" && (
          <div
            style={{
              margin: "18px 0 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e1e8ed",
                  minWidth: 220,
                }}
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #e1e8ed",
                  fontSize: 13,
                  color: deptFilter ? getDeptColor(deptFilter) : "#555",
                  fontWeight: deptFilter ? 600 : 400,
                  background: deptFilter
                    ? `${getDeptColor(deptFilter)}12`
                    : "#fff",
                  cursor: "pointer",
                  minWidth: 160,
                }}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === "all-users" && (
              <button
                className="add-user-btn"
                onClick={() => setShowAddModal(true)}
              >
                + Add User
              </button>
            )}
          </div>
        )}
      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7f8c9a" }}>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7f8c9a" }}>
            <p>No users found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Position</th>
                  <th>Department</th>
                  {activeTab === "privilege-users" && <th>Special Apps</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const initials = getUserInitials(user.name);
                  const colors = getInitialsColor(user.name);
                  const extraCount = user.extra_app_count || 0;
                  const limitCount = user.limit_app_count || 0;
                  return (
                    <tr
                      key={user.id}
                      className={
                        user.status === "active"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      <td>
                        <div className="user-cell">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
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
                              display: user.avatar ? "none" : "flex",
                            }}
                          >
                            {initials}
                          </div>
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <p
                              className={
                                user.email && user.email.length > 22
                                  ? "small-email"
                                  : ""
                              }
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`role-badge ${user.role?.toLowerCase()}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${user.status === "active" ? "active" : "inactive"}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <span className="position-badge">{user.position}</span>
                      </td>
                      <td>
                        {(() => {
                          const deptColor = getDeptColor(user.department);
                          return (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                background: `${deptColor}18`,
                                color: deptColor,
                                border: `1px solid ${deptColor}30`,
                              }}
                            >
                              {user.department}
                            </span>
                          );
                        })()}
                      </td>
                      {activeTab === "privilege-users" && (
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {extraCount > 0 && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "#e8f2ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Extra ({extraCount})
                              </span>
                            )}
                            {limitCount > 0 && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                >
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Limit ({limitCount})
                              </span>
                            )}
                            {extraCount === 0 && limitCount === 0 && (
                              <span style={{ color: "#bbb", fontSize: 12 }}>
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <button
                          className="btn-edit"
                          onClick={async () => {
                            if (activeTab === "privilege-users") {
                              // Open privilege modal — fetch current app permissions
                              setSelectedUser(user);
                              setFormData({
                                name: user.name,
                                email: user.email,
                                position: user.position,
                                department: user.department,
                                role: user.role,
                                status: user.status,
                                has_privilege: user.has_privilege,
                              });
                              try {
                                const res = await fetch(
                                  `${API_URL}/users/${user.id}/privileges`,
                                );
                                const data = await res.json();
                                if (data.success) {
                                  setSelectedApps(
                                    data.data.map((a) => a.application_id),
                                  );
                                } else {
                                  setSelectedApps([]);
                                }
                              } catch {
                                setSelectedApps([]);
                              }
                              setShowPrivilegeModal(true);
                            } else {
                              setSelectedUser(user);
                              setFormData({
                                name: user.name,
                                email: user.email,
                                position: user.position,
                                department: user.department,
                                role: user.role,
                                status: user.status,
                                has_privilege: user.has_privilege,
                                accountActive: user.accountActive,
                                privilegeAccess: user.privilegeAccess,
                                privileges: user.privileges || {},
                              });
                              setShowEditModal(true);
                            }
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD USER MODAL - BACKUP DESIGN */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Add User
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-section-header">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <h4>Personal Information</h4>
                </div>
                {/* Photo Upload - Centered */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 0 20px",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: formData.avatar
                          ? "transparent"
                          : getInitialsColor(formData.name).bg,
                        color: getInitialsColor(formData.name).color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        fontWeight: 700,
                        border: "3px solid #e1e8ed",
                        overflow: "hidden",
                      }}
                    >
                      {formData.avatar ? (
                        <img
                          src={getAvatarPreview(formData.avatar)}
                          alt="Avatar Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getUserInitials(formData.name)
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        background: "#4a90e2",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(74,144,226,0.3)",
                        border: "2px solid #fff",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#357abd")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#4a90e2")
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      name="avatar"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 2 * 1024 * 1024) {
                            setNotification({
                              type: "error",
                              message: "File size max 2MB",
                            });
                            return;
                          }
                          setFormData({
                            ...formData,
                            avatar: file,
                          });
                        }
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ color: "#7f8c9a", fontSize: 12 }}>
                      {formData.avatar
                        ? formData.avatar.name
                        : "Upload photo (jpg, png, max 2MB)"}
                    </span>
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, avatar: null })
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e74c3c",
                          cursor: "pointer",
                          fontSize: 12,
                          marginLeft: 6,
                          textDecoration: "underline",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label className="required">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Full name..."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label className="required">Corporate Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email..."
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label className="required">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Min. 6 characters..."
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-header">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="2"
                      y="7"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                  </svg>
                  <h4>Job Information</h4>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    >
                      {(departments || []).map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label>Position</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    >
                      {(positions || []).map((pos, idx) => (
                        <option key={idx} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    disabled
                    style={{ background: "#f5f7fa", color: "#7f8c9a" }}
                  >
                    <option value="User">User</option>
                    {(roles || []).map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <small
                    style={{
                      color: "#7f8c9a",
                      fontSize: 11,
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    Default role is User. Can be changed after creation.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={async () => {
                  if (!formData.name || !formData.email || !formData.password) {
                    setNotification({
                      type: "error",
                      message: "Name, email, and password are required",
                    });
                    return;
                  }
                  try {
                    const body = new FormData();
                    body.append("name", formData.name);
                    body.append("email", formData.email);
                    body.append("password", formData.password);
                    body.append("department", formData.department);
                    body.append("position", formData.position);
                    body.append("role", "User");
                    body.append("status", "active");
                    if (formData.avatar) body.append("avatar", formData.avatar);
                    const res = await fetch(`${API_URL}/users`, {
                      method: "POST",
                      body,
                    });
                    const result = await res.json();
                    if (result.success) {
                      setNotification({
                        type: "success",
                        message: "User created successfully",
                      });
                      setShowAddModal(false);
                      setFormData({
                        name: "",
                        email: "",
                        position: "Staff",
                        department: "Finance",
                        role: "User",
                        status: "active",
                        accountActive: true,
                        privilegeAccess: false,
                      });
                      fetchAllUsers();
                    } else {
                      setNotification({
                        type: "error",
                        message: result.message || "Failed to create user",
                      });
                    }
                  } catch (err) {
                    setNotification({
                      type: "error",
                      message: "Server error. Please try again.",
                    });
                  }
                }}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL - FULL DESIGN */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: selectedUser.status === "inactive" ? 420 : 560,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-header">
              <h3>
                {selectedUser.status === "inactive"
                  ? "Activate User"
                  : "Edit User"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                padding:
                  selectedUser.status === "inactive"
                    ? "24px 16px"
                    : "18px 16px",
              }}
            >
              {selectedUser.status === "inactive" ? (
                // Inactive user modal - simplified view
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    padding: "16px",
                    background:
                      "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="modal-avatar-large"
                    style={{
                      width: 56,
                      height: 56,
                      flex: "0 0 auto",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: selectedUser?.avatar
                        ? "transparent"
                        : getInitialsColor(formData.name).bg,
                      color: getInitialsColor(formData.name).color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {selectedUser?.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={formData.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getUserInitials(formData.name)
                    )}
                  </div>
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: 0,
                        color: "#2c3e50",
                      }}
                    >
                      {formData.name}
                    </h4>
                    <p style={{ fontSize: 13, margin: 0, color: "#7f8c9a" }}>
                      {formData.email}
                    </p>
                    <p style={{ fontSize: 12, margin: 0, color: "#7f8c9a" }}>
                      {formData.position} • {formData.department}
                    </p>
                  </div>
                </div>
              ) : (
                // Active user modal - full edit view
                <>
                  {/* User Profile Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      background:
                        "linear-gradient(135deg, #f8f9fb 0%, #eef1f5 100%)",
                      borderRadius: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      className="modal-avatar-large"
                      style={{
                        width: 52,
                        height: 52,
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        background: selectedUser?.avatar
                          ? "transparent"
                          : getInitialsColor(formData.name).bg,
                        color: getInitialsColor(formData.name).color,
                      }}
                    >
                      {selectedUser?.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={formData.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getUserInitials(formData.name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          margin: 0,
                          color: "#2c3e50",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {formData.name}
                      </h4>
                      <p
                        style={{
                          fontSize: 13,
                          margin: "2px 0 0",
                          color: "#7f8c9a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {formData.email}
                      </p>
                    </div>
                    {/* Account Status Toggle */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        flex: "0 0 auto",
                      }}
                    >
                      <button
                        onClick={() => {
                          const newStatus =
                            formData.status === "active"
                              ? "inactive"
                              : "active";
                          setFormData({ ...formData, status: newStatus });
                        }}
                        style={{
                          width: 40,
                          height: 24,
                          borderRadius: 12,
                          border: "none",
                          background:
                            formData.status === "active"
                              ? "#27ae60"
                              : "#bdc3c7",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "2px",
                            left: formData.status === "active" ? "20px" : "2px",
                            width: 20,
                            height: 20,
                            background: "white",
                            borderRadius: "50%",
                            transition: "left 0.3s ease",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                          }}
                        />
                      </button>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color:
                            formData.status === "active"
                              ? "#27ae60"
                              : "#95a5a6",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {formData.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Two Column Layout */}
                  <div style={{ display: "flex", gap: 16 }}>
                    {/* Left Column - Job Info */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#95a5a6",
                          margin: 0,
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        Job Information
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#7f8c9a",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Department
                          </label>
                          <div
                            style={{
                              padding: "9px 12px",
                              background: "#f8f9fa",
                              borderRadius: 8,
                              fontSize: 13,
                              color: "#2c3e50",
                              fontWeight: 500,
                              border: "1px solid #eef0f2",
                            }}
                          >
                            {formData.department}
                          </div>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#7f8c9a",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Position
                          </label>
                          <div
                            style={{
                              padding: "9px 12px",
                              background: "#f8f9fa",
                              borderRadius: 8,
                              fontSize: 13,
                              color: "#2c3e50",
                              fontWeight: 500,
                              border: "1px solid #eef0f2",
                            }}
                          >
                            {formData.position}
                          </div>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#7f8c9a",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Role
                          </label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({ ...formData, role: e.target.value })
                            }
                            style={{
                              width: "100%",
                              fontSize: 13,
                              borderRadius: 8,
                              padding: "9px 12px",
                              border: "1px solid #dce1e6",
                              color: "#2c3e50",
                              fontWeight: 500,
                              background: "#fff",
                              cursor: "pointer",
                              boxSizing: "border-box",
                            }}
                          >
                            {(roles || []).map((role) => (
                              <option key={role.id} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Applications */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {formData.role === "Admin" ? (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="#d4a017"
                              stroke="none"
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <h4
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#d4a017",
                                margin: 0,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                              }}
                            >
                              Full Access — Admin
                            </h4>
                          </div>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                              borderRadius: 10,
                              padding: 12,
                              border: "1px solid #f6dfa0",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 4,
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#b8860b"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#b8860b",
                                }}
                              >
                                Admin has unrestricted access to all
                                applications
                              </span>
                            </div>
                            {applications
                              .filter((app) => app.status === "active")
                              .map((app) => (
                                <div
                                  key={app.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    background: "rgba(255,255,255,0.85)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    border: "1px solid #f0e6c0",
                                  }}
                                >
                                  <img
                                    src={app.icon}
                                    alt={app.name}
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 4,
                                      objectFit: "contain",
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: "#2c3e50",
                                      fontWeight: 500,
                                      fontSize: 13,
                                    }}
                                  >
                                    {app.name}
                                  </span>
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#d4a017"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginLeft: "auto" }}
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <h4
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#95a5a6",
                              margin: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.8px",
                            }}
                          >
                            Accessible Apps
                          </h4>
                          <div
                            style={{
                              background: "#f8f9fb",
                              borderRadius: 10,
                              padding: 12,
                              border: "1px solid #eef0f2",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              flex: 1,
                            }}
                          >
                            {(() => {
                              const dept = departments.find(
                                (d) => d.name === formData.department,
                              );
                              let deptAppCodes = [];
                              if (dept && dept.allowed_apps) {
                                try {
                                  const parsed =
                                    typeof dept.allowed_apps === "string"
                                      ? JSON.parse(dept.allowed_apps)
                                      : dept.allowed_apps;
                                  if (Array.isArray(parsed))
                                    deptAppCodes = parsed;
                                } catch {
                                  deptAppCodes = String(dept.allowed_apps)
                                    .split(",")
                                    .map((s) => s.trim());
                                }
                              }
                              const deptApps = applications.filter(
                                (app) =>
                                  deptAppCodes.includes(app.code) &&
                                  app.status === "active",
                              );
                              if (deptApps.length > 0) {
                                return deptApps.map((app) => (
                                  <div
                                    key={app.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      background: "#fff",
                                      borderRadius: 8,
                                      padding: "8px 10px",
                                      border: "1px solid #eef0f2",
                                    }}
                                  >
                                    <img
                                      src={app.icon}
                                      alt={app.name}
                                      style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        objectFit: "contain",
                                      }}
                                    />
                                    <span
                                      style={{
                                        color: "#2c3e50",
                                        fontWeight: 500,
                                        fontSize: 13,
                                      }}
                                    >
                                      {app.name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "#27ae60",
                                        background: "#e8f8ef",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                        marginLeft: "auto",
                                      }}
                                    >
                                      default access
                                    </span>
                                  </div>
                                ));
                              } else {
                                return (
                                  <p
                                    style={{
                                      color: "#95a5a6",
                                      fontSize: 12,
                                      margin: "8px 0",
                                      textAlign: "center",
                                    }}
                                  >
                                    No applications assigned
                                  </p>
                                );
                              }
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Privilege Access Toggle - hidden for Admin */}
                  {formData.role !== "Admin" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 16px",
                        background: formData.has_privilege
                          ? "rgba(52,152,219,0.06)"
                          : "#f8f9fa",
                        borderRadius: 10,
                        border: `1px solid ${formData.has_privilege ? "rgba(52,152,219,0.2)" : "#eef0f2"}`,
                        marginTop: 16,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: formData.has_privilege
                            ? "rgba(52,152,219,0.12)"
                            : "rgba(0,0,0,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={
                            formData.has_privilege ? "#3498db" : "#95a5a6"
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            margin: 0,
                            color: "#2c3e50",
                          }}
                        >
                          Privilege Access
                        </h4>
                        <p
                          style={{
                            fontSize: 11,
                            margin: "2px 0 0",
                            color: "#95a5a6",
                          }}
                        >
                          Grant special access rights
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            has_privilege: !formData.has_privilege,
                          })
                        }
                        style={{
                          width: 40,
                          height: 24,
                          borderRadius: 12,
                          border: "none",
                          background: formData.has_privilege
                            ? "#3498db"
                            : "#bdc3c7",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          flex: "0 0 auto",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "2px",
                            left: formData.has_privilege ? "20px" : "2px",
                            width: 20,
                            height: 20,
                            background: "white",
                            borderRadius: "50%",
                            transition: "left 0.3s ease",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                          }}
                        />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>

              {selectedUser.status === "inactive" ? (
                <button
                  className="modal-btn modal-btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                    border: "none",
                  }}
                  onClick={() => {
                    setConfirmAction({
                      type: "activate",
                      title: "Activate Account",
                      message: `Are you sure you want to activate ${selectedUser.name}'s account?`,
                      onConfirm: async () => {
                        try {
                          const response = await fetch(
                            `${API_URL}/users/${selectedUser.id}`,
                            {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "active" }),
                            },
                          );
                          if (response.ok) {
                            await fetchAllUsers();
                            setShowEditModal(false);
                            setShowConfirmModal(false);
                            setNotification({
                              type: "success",
                              message: `${selectedUser.name}'s account has been activated successfully`,
                            });
                            setTimeout(() => setNotification(null), 3500);
                          } else {
                            setShowConfirmModal(false);
                            setNotification({
                              type: "error",
                              message:
                                "Failed to activate account. Please try again.",
                            });
                            setTimeout(() => setNotification(null), 3500);
                          }
                        } catch (err) {
                          console.error("Error activating user:", err);
                          setShowConfirmModal(false);
                          setNotification({
                            type: "error",
                            message:
                              "Network error. Please check your connection.",
                          });
                          setTimeout(() => setNotification(null), 3500);
                        }
                      },
                    });
                    setShowConfirmModal(true);
                  }}
                >
                  Activate Account
                </button>
              ) : (
                (() => {
                  const hasChanges =
                    formData.status !== selectedUser.status ||
                    formData.role !== selectedUser.role ||
                    Boolean(formData.has_privilege) !==
                      Boolean(selectedUser.has_privilege);
                  return (
                    <button
                      className="modal-btn modal-btn-primary"
                      disabled={!hasChanges}
                      style={{
                        background: hasChanges ? "#3a3f47" : "#c8ccd0",
                        border: "none",
                        color: hasChanges ? "#fff" : "#f0f0f0",
                        cursor: hasChanges ? "pointer" : "not-allowed",
                        opacity: hasChanges ? 1 : 0.6,
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => {
                        setConfirmAction({
                          type: "save",
                          title: "Save Changes",
                          message: `Are you sure you want to save changes for ${selectedUser.name}?`,
                          onConfirm: async () => {
                            try {
                              const response = await fetch(
                                `${API_URL}/users/${selectedUser.id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    status: formData.status,
                                    has_privilege: formData.has_privilege,
                                    role: formData.role,
                                  }),
                                },
                              );
                              if (response.ok) {
                                await fetchAllUsers();
                                setShowEditModal(false);
                                setShowConfirmModal(false);
                                setNotification({
                                  type: "success",
                                  message: "Changes saved successfully",
                                });
                                setTimeout(() => setNotification(null), 3500);
                              } else {
                                setShowConfirmModal(false);
                                setNotification({
                                  type: "error",
                                  message:
                                    "Failed to save changes. Please try again.",
                                });
                                setTimeout(() => setNotification(null), 3500);
                              }
                            } catch (err) {
                              console.error("Error saving changes:", err);
                              setShowConfirmModal(false);
                              setNotification({
                                type: "error",
                                message:
                                  "Network error. Please check your connection.",
                              });
                              setTimeout(() => setNotification(null), 3500);
                            }
                          },
                        });
                        setShowConfirmModal(true);
                      }}
                    >
                      Save Changes
                    </button>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRIVILEGE MODAL */}
      {showPrivilegeModal && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setShowPrivilegeModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 560,
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="modal-header">
              <h3>Manage Application Permissions</h3>
              <button
                className="modal-close"
                onClick={() => setShowPrivilegeModal(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}
            >
              {/* User Info Header */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 14,
                  background:
                    "linear-gradient(135deg, #f8f9fb 0%, #eef1f5 100%)",
                  borderRadius: 12,
                  marginBottom: 20,
                  border: "1px solid #e1e8ed",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    flex: "0 0 auto",
                    overflow: "hidden",
                    background: selectedUser.avatar
                      ? "transparent"
                      : getInitialsColor(selectedUser.name).bg,
                    color: getInitialsColor(selectedUser.name).color,
                  }}
                >
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    getUserInitials(selectedUser.name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                      color: "#2c3e50",
                    }}
                  >
                    {selectedUser.name}
                  </h4>
                  <p
                    style={{
                      fontSize: 12,
                      margin: "2px 0 0",
                      color: "#7f8c9a",
                    }}
                  >
                    {selectedUser.position} • {selectedUser.department}
                  </p>
                </div>
                <div
                  style={{
                    padding: "5px 10px",
                    background: "#d4edda",
                    color: "#155724",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    flex: "0 0 auto",
                    letterSpacing: "0.3px",
                  }}
                >
                  PRIVILEGE
                </div>
              </div>

              {/* Application Permission List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#95a5a6",
                    margin: "0 0 4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Application Permissions
                </h4>
                {(() => {
                  // Get department default app codes from departments state
                  const dept = departments.find(
                    (d) => d.name === selectedUser.department,
                  );
                  let deptAppCodes = [];
                  if (dept && dept.allowed_apps) {
                    try {
                      const parsed =
                        typeof dept.allowed_apps === "string"
                          ? JSON.parse(dept.allowed_apps)
                          : dept.allowed_apps;
                      if (Array.isArray(parsed)) deptAppCodes = parsed;
                    } catch {
                      deptAppCodes = String(dept.allowed_apps)
                        .split(",")
                        .map((s) => s.trim());
                    }
                  }
                  // Get dept default app IDs
                  const deptAppIds = applications
                    .filter((app) => deptAppCodes.includes(app.code))
                    .map((app) => app.id);

                  // Only show active applications
                  const activeApps = applications.filter(
                    (app) => app.status === "active",
                  );

                  return activeApps.map((app) => {
                    const isDefault = deptAppIds.includes(app.id);
                    const isSelected = selectedApps.includes(app.id);
                    return (
                      <label
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          background: isSelected
                            ? isDefault
                              ? "#f0faf3"
                              : "#eef6ff"
                            : "#fafafa",
                          borderRadius: 10,
                          border: `1.5px solid ${isSelected ? (isDefault ? "#b8e6c8" : "#b8d4f0") : "#e8eaed"}`,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newValue = !isSelected;
                            setPendingAppToggle({
                              appId: app.id,
                              appName: app.name,
                              newValue,
                            });
                          }}
                          style={{
                            width: 18,
                            height: 18,
                            accentColor: isDefault ? "#27ae60" : "#3498db",
                            cursor: "pointer",
                            flex: "0 0 auto",
                          }}
                        />
                        <img
                          src={app.icon}
                          alt={app.name}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            objectFit: "contain",
                            background: "#fff",
                            border: "1px solid #eee",
                            padding: 2,
                            flex: "0 0 auto",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#2c3e50",
                              }}
                            >
                              {app.name}
                            </span>
                            {isDefault && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#27ae60",
                                  background: "#e8f8ef",
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  letterSpacing: "0.3px",
                                  textTransform: "uppercase",
                                }}
                              >
                                default access
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#95a5a6",
                              margin: "2px 0 0",
                            }}
                          >
                            {app.description}
                          </p>
                        </div>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: isSelected
                              ? isDefault
                                ? "#27ae60"
                                : "#3498db"
                              : "#ddd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            flex: "0 0 auto",
                          }}
                        >
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                padding: "14px 20px",
                borderTop: "1px solid #eef0f2",
              }}
            >
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowPrivilegeModal(false)}
                style={{ flex: "0 0 auto" }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                style={{
                  background: "#3a3f47",
                  border: "none",
                  color: "#fff",
                  flex: "0 0 auto",
                }}
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `${API_URL}/users/${selectedUser.id}/privileges`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          application_ids: selectedApps,
                          has_privilege: true,
                        }),
                      },
                    );
                    const data = await res.json();
                    if (data.success) {
                      setShowPrivilegeModal(false);
                      fetchAllUsers();
                      setNotification({
                        type: "success",
                        message: "Application permissions updated successfully",
                      });
                      setTimeout(() => setNotification(null), 3500);
                    } else {
                      setNotification({
                        type: "error",
                        message: data.message || "Failed to update permissions",
                      });
                      setTimeout(() => setNotification(null), 3500);
                    }
                  } catch (err) {
                    console.error("Error updating privileges:", err);
                    setNotification({
                      type: "error",
                      message: "Network error. Please check your connection.",
                    });
                    setTimeout(() => setNotification(null), 3500);
                  }
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP TOGGLE CONFIRMATION MODAL */}
      {pendingAppToggle && (
        <div
          className="confirm-dialog-overlay"
          style={{ zIndex: 1200 }}
          onClick={() => setPendingAppToggle(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body">
              <div
                className={`confirm-dialog-icon ${pendingAppToggle.newValue ? "info" : "warning"}`}
              >
                {pendingAppToggle.newValue ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
              </div>
              <h3>{pendingAppToggle.newValue ? "Enable" : "Disable"} App?</h3>
              <p>
                {pendingAppToggle.newValue ? (
                  <>
                    Grant <strong>{pendingAppToggle.appName}</strong> access to{" "}
                    <strong>{selectedUser?.name}</strong>?
                  </>
                ) : (
                  <>
                    Remove <strong>{pendingAppToggle.appName}</strong> access
                    from <strong>{selectedUser?.name}</strong>?
                  </>
                )}
              </p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                className="cd-btn cd-btn-cancel"
                onClick={() => setPendingAppToggle(null)}
              >
                Cancel
              </button>
              <button
                className={`cd-btn ${pendingAppToggle.newValue ? "cd-btn-primary" : "cd-btn-warning"}`}
                onClick={() => {
                  const { appId, newValue } = pendingAppToggle;
                  setSelectedApps((prev) =>
                    newValue
                      ? [...prev, appId]
                      : prev.filter((id) => id !== appId),
                  );
                  setPendingAppToggle(null);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {pendingAppToggle.newValue ? (
                    <polyline points="20 6 9 17 4 12"></polyline>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </>
                  )}
                </svg>
                {pendingAppToggle.newValue ? "Enable" : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && confirmAction && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              overflow: "hidden",
              animation: "fadeInScale 0.2s ease",
            }}
          >
            <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background:
                    confirmAction.type === "activate"
                      ? "rgba(39,174,96,0.1)"
                      : "rgba(52,152,219,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    confirmAction.type === "activate" ? "#27ae60" : "#3498db"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#2c3e50",
                  margin: "0 0 8px",
                }}
              >
                {confirmAction.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#7f8c9a",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {confirmAction.message}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "0 24px 24px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid #e1e8ed",
                  background: "#fff",
                  color: "#5a6c7d",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background:
                    confirmAction.type === "activate"
                      ? "linear-gradient(135deg, #27ae60, #2ecc71)"
                      : "linear-gradient(135deg, #3498db, #2980b9)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 12,
            background: notification.type === "success" ? "#fff" : "#fff",
            border: `1px solid ${notification.type === "success" ? "#d4edda" : "#f5c6cb"}`,
            boxShadow:
              notification.type === "success"
                ? "0 4px 20px rgba(39,174,96,0.15)"
                : "0 4px 20px rgba(231,76,60,0.15)",
            animation: "slideInRight 0.35s ease",
            maxWidth: 380,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background:
                notification.type === "success"
                  ? "rgba(39,174,96,0.1)"
                  : "rgba(231,76,60,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
            }}
          >
            {notification.type === "success" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#27ae60"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e74c3c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: notification.type === "success" ? "#1e7e4a" : "#c0392b",
              }}
            >
              {notification.type === "success" ? "Success" : "Error"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7f8c9a" }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#bdc3c7",
              flex: "0 0 auto",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserControl;
