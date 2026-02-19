import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalRole, setOriginalRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [privilegeUsers, setPrivilegeUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);

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

  // Fetch users based on active tab
  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = "/users";
      if (activeTab === "inactive-users") {
        endpoint = "/users/inactive";
      } else if (activeTab === "privilege-users") {
        endpoint = "/users/privilege";
      } else if (activeTab === "active-users") {
        endpoint = "/users"; // Filter active di frontend
      } else if (activeTab === "admin-users") {
        endpoint = "/users"; // Filter admin di frontend
      }

      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();

      if (data.success) {
        if (activeTab === "all-users") {
          setUsers(data.data);
        } else if (activeTab === "inactive-users") {
          setInactiveUsers(data.data);
        } else if (activeTab === "privilege-users") {
          setPrivilegeUsers(data.data);
        } else if (activeTab === "active-users") {
          setActiveUsers(data.data.filter((u) => u.status === "active"));
        } else if (activeTab === "admin-users") {
          setAdminUsers(data.data.filter((u) => u.role === "Admin"));
        }
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions (getDeptType, getUserInitials, getInitialsColor, etc.)
  const getDeptType = (department) => {
    const mapping = {
      Finance: "finance",
      "Human Resources": "hr",
      Warehouse: "warehouse",
      "IT Department": "it",
      Marketing: "marketing",
      Sales: "sales",
    };
    return mapping[department] || "default";
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
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
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
            onClick={() => setActiveTab("all-users")}
          >
            All Users
          </button>
          <button
            className={`user-control-tab${activeTab === "active-users" ? " active" : ""}`}
            onClick={() => setActiveTab("active-users")}
          >
            Active Users
          </button>
          <button
            className={`user-control-tab${activeTab === "inactive-users" ? " active" : ""}`}
            onClick={() => setActiveTab("inactive-users")}
          >
            Inactive Users
          </button>
          <button
            className={`user-control-tab${activeTab === "privilege-users" ? " active" : ""}`}
            onClick={() => setActiveTab("privilege-users")}
          >
            Privilege Users
          </button>
          <button
            className={`user-control-tab${activeTab === "admin-users" ? " active" : ""}`}
            onClick={() => setActiveTab("admin-users")}
          >
            Admin Users
          </button>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #e1e8ed" }}
          />
          <button
            className="add-user-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add User
          </button>
        </div>
      </div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const initials = getUserInitials(user.name);
                  const colors = getInitialsColor(user.name);
                  const deptType = getDeptType(user.department);
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
                          <div
                            className="user-avatar"
                            style={{
                              background: colors.bg,
                              color: colors.color,
                            }}
                          >
                            {initials}
                          </div>
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <p>{user.email}</p>
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
                        <span
                          className={`role-badge ${user.position?.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {user.position}
                        </span>
                      </td>
                      <td>
                        <span className={`dept-badge ${deptType}`}>
                          {user.department}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              name: user.name,
                              email: user.email,
                              position: user.position,
                              department: user.department,
                              role: user.role,
                              status: user.status,
                              accountActive: user.accountActive,
                              privilegeAccess: user.privilegeAccess,
                              privileges: user.privileges || {},
                            });
                            setShowEditModal(true);
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
                  <div className="modal-form-group">
                    <label className="required">Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password..."
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Photo</label>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          background: getInitialsColor(formData.name).bg,
                          color: getInitialsColor(formData.name).color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          fontWeight: 700,
                          boxShadow: "0 2px 8px rgba(74,144,226,0.08)",
                        }}
                      >
                        {formData.avatar ? (
                          <img
                            src={URL.createObjectURL(formData.avatar)}
                            alt="Avatar Preview"
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #e1e8ed",
                            }}
                          />
                        ) : (
                          getUserInitials(formData.name)
                        )}
                        <label
                          htmlFor="avatar-upload"
                          style={{
                            position: "absolute",
                            bottom: -8,
                            right: -8,
                            background: "#4a90e2",
                            color: "#fff",
                            borderRadius: "50%",
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 1px 4px rgba(74,144,226,0.12)",
                            fontSize: 16,
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M16.24 7.76a6 6 0 1 1-8.48 0" />
                          </svg>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          name="avatar"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({
                                ...formData,
                                avatar: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </div>
                      <span style={{ color: "#7f8c9a", fontSize: 13 }}>
                        Upload photo (jpg, png, max 2MB)
                      </span>
                    </div>
                  </div>
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
                  <div className="modal-form-group">
                    <label>Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
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
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary">
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
            style={{ maxWidth: 580, maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>Edit User</h3>
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
            <div className="modal-body" style={{ padding: "18px 16px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
                <div
                  className="modal-avatar-editor"
                  style={{ flex: "0 0 auto" }}
                >
                  <div
                    className="modal-avatar-large"
                    style={{
                      background: getInitialsColor(formData.name).bg,
                      color: getInitialsColor(formData.name).color,
                      width: 48,
                      height: 48,
                      fontSize: 18,
                    }}
                  >
                    {getUserInitials(formData.name)}
                  </div>
                </div>
                {/* Name and Email - Read Only */}
                <div
                  style={{
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div className="modal-form-group" style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#34495e",
                        marginBottom: 4,
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      disabled
                      style={{
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                        color: "#666",
                        fontSize: 14,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    />
                  </div>
                  <div className="modal-form-group" style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#34495e",
                        marginBottom: 4,
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      style={{
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                        color: "#666",
                        fontSize: 14,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Job Information - Read Only */}
              <div style={{ height: 16 }}></div>
              <div className="modal-section" style={{ marginBottom: 12 }}>
                <div
                  className="modal-section-header"
                  style={{ gap: 6, marginBottom: 8, paddingBottom: 4 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ width: 16, height: 16 }}
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
                  <h4
                    style={{
                      fontSize: 13,
                      color: "#2c3e50",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Job Information
                  </h4>
                </div>
                <div className="modal-form-row" style={{ gap: 8 }}>
                  <div className="modal-form-group" style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#34495e",
                        marginBottom: 4,
                      }}
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      disabled
                      style={{
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                        color: "#666",
                        fontSize: 14,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    />
                    {/* Accessible Applications Info */}
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        background: "#f8fafc",
                        borderRadius: 8,
                        padding: "10px 12px",
                        border: "1px solid #e1e8ed",
                        boxShadow: "0 1px 2px rgba(74,144,226,0.04)",
                      }}
                    >
                      <span
                        style={{
                          color: "#4a90e2",
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 8,
                          display: "block",
                        }}
                      >
                        Accessible Applications:
                      </span>
                      {(() => {
                        const department = formData.department;
                        const departmentApps = {
                          HSE: ["OPS", "PUNCH"],
                          Finance: ["SGI_PLUS", "OODO", "OPS", "PUNCH", "2"],
                          "Human Resource": ["OODO", "OPS", "PUNCH"],
                        };
                        const appData = {
                          SGI_PLUS: { name: "SGI+", logo: "/assets/SGI+.png" },
                          PUNCH: { name: "Punch", logo: "/assets/punch.png" },
                          OODO: { name: "Oodo", logo: "/assets/oodo.png" },
                          OPS: { name: "Ops", logo: "/assets/Ops.png" },
                          2: { name: "Punch", logo: "/assets/punch.png" },
                        };
                        const apps = departmentApps[department] || [];
                        if (apps.length > 0) {
                          return (
                            <ul
                              style={{
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {apps.map((code) => (
                                <li
                                  key={code}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    background: "#fff",
                                    borderRadius: 6,
                                    padding: "7px 10px",
                                    border: "1px solid #e1e8ed",
                                    boxShadow:
                                      "0 1px 2px rgba(74,144,226,0.03)",
                                    minHeight: 32,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      height: 24,
                                      width: 24,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked
                                      disabled
                                      style={{
                                        accentColor: "#4a90e2",
                                        width: 18,
                                        height: 18,
                                        margin: 0,
                                      }}
                                    />
                                  </div>
                                  <img
                                    src={appData[code]?.logo}
                                    alt={appData[code]?.name}
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 4,
                                      objectFit: "contain",
                                      background: "#fff",
                                      border: "1px solid #e1e8ed",
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: "#34495e",
                                      fontWeight: 600,
                                      fontSize: 13,
                                    }}
                                  >
                                    {appData[code]?.name || code}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        } else {
                          return (
                            <span
                              style={{
                                color: "#7f8c9a",
                                fontSize: 12,
                                marginLeft: 4,
                              }}
                            >
                              No applications assigned
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div className="modal-form-group" style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#34495e",
                        marginBottom: 4,
                      }}
                    >
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      disabled
                      style={{
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                        color: "#666",
                        fontSize: 14,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    />
                  </div>
                </div>
                <div className="modal-form-group" style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#34495e",
                      marginBottom: 4,
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
                      fontSize: 14,
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary">
                Save Changes
              </button>
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
            style={{ maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>Manage Privileges</h3>
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
            <div className="modal-body">
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
                  <h4>Privileges</h4>
                </div>
                <div className="modal-form-row">
                  {privileges.map((priv) => (
                    <div key={priv.key} className="modal-form-group">
                      <label>{priv.label}</label>
                      <div className="modal-toggle-group">
                        <input
                          type="checkbox"
                          checked={formData.privileges[priv.key]}
                          onChange={() => handlePrivilegeToggle(priv.key)}
                        />
                        <span
                          className={
                            formData.privileges[priv.key]
                              ? "modal-badge-active"
                              : "modal-badge-inactive"
                          }
                        >
                          {formData.privileges[priv.key]
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowPrivilegeModal(false)}
              >
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE CONFIRMATION MODAL */}
      {showRoleConfirmModal && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setShowRoleConfirmModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="modal-header">
              <h3>Confirm Role Change</h3>
              <button
                className="modal-close"
                onClick={() => setShowRoleConfirmModal(false)}
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
              style={{ textAlign: "center", padding: "32px 0" }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e67e22"
                strokeWidth="2"
                style={{ marginBottom: 16 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12" y2="16" />
              </svg>
              <p style={{ fontWeight: 600, fontSize: 16 }}>
                Are you sure you want to change this user's role?
              </p>
              <p style={{ color: "#7f8c9a", fontSize: 13, marginTop: 8 }}>
                This action may affect user permissions and access.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowRoleConfirmModal(false)}
              >
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserControl;
import "../../styles/UserControl.css";
