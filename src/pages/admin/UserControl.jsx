import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

const UserControl = () => {
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

  // Privilege modal states
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
        endpoint = "/users"; // Filter active on frontend
      } else if (activeTab === "admin-users") {
        endpoint = "/users"; // Filter admin on frontend
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
      { bg: "#f3e5f5", color: "#9b59b6" },
      { bg: "#fff3e0", color: "#f39c12" },
      { bg: "#e0f7fa", color: "#00bcd4" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setOriginalRole(user.role || "User"); // Store original role for comparison

    // NOTE: User data (name, email, department, position) comes from Third-Party API
    // These fields are READ-ONLY and cannot be modified by admin
    // Only 'role' field can be changed by admin
    // TODO: Fetch latest user data from third-party API before editing
    // const userData = await fetchUserDataFromThirdPartyAPI(user.id);

    setFormData({
      name: user.name, // READ-ONLY from API
      email: user.email, // READ-ONLY from API
      position: user.position, // READ-ONLY from API
      department: user.department, // READ-ONLY from API
      role: user.role || "User", // EDITABLE by admin
      status: user.status,
      accountActive: user.status === "active",
      privilegeAccess: user.has_privilege === 1 || user.has_privilege === true,
    });
    setShowEditModal(true);
  };

  const handleAddUser = () => {
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
    setShowAddModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    // Check if role is being changed to Admin
    if (
      showEditModal &&
      selectedUser &&
      originalRole !== "Admin" &&
      formData.role === "Admin"
    ) {
      setShowRoleConfirmModal(true);
      return; // Wait for confirmation
    }

    // Proceed with save
    await saveUserToDatabase();
  };

  const saveUserToDatabase = async () => {
    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        has_privilege: formData.privilegeAccess ? 1 : 0,
      };

      let response;
      if (showEditModal && selectedUser) {
        // Update existing user
        response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      } else {
        // Create new user
        response = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      }

      const data = await response.json();

      if (data.success) {
        alert(data.message || "User saved successfully!");
        setShowEditModal(false);
        setShowAddModal(false);
        setShowRoleConfirmModal(false);
        fetchUsers(); // Refresh the list
      } else {
        alert(data.message || "Failed to save user");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Failed to save user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Application mapping (matching the 4 applications in ApplicationManagement)
  const getAppLogo = (code) => {
    const logoMap = {
      // Map backend codes to the 4 main applications
      FIN_SYS: "/assets/SGI+.png", // Financial System → SGI+
      HR_PORTAL: "/assets/punch.png", // HR Portal → Punch
      WH_MGT: "/assets/oodo.png", // Warehouse → oodo
      INV_CTL: "/assets/oodo.png", // Inventory → oodo
      SALES_DB: "/assets/Ops.png", // Sales → OPS
      CUST_PORTAL: "/assets/Ops.png", // Customer Portal → OPS
      // Direct codes
      SGI_PLUS: "/assets/SGI+.png",
      PUNCH: "/assets/punch.png",
      OODO: "/assets/oodo.png",
      OPS: "/assets/Ops.png",
    };
    return logoMap[code] || "/assets/SGI+.png";
  };

  // Application name mapping
  const getAppName = (code) => {
    const nameMap = {
      // Backend codes to display names
      FIN_SYS: "SGI +",
      HR_PORTAL: "Punch Coretation",
      WH_MGT: "oodo",
      INV_CTL: "oodo",
      SALES_DB: "ops",
      CUST_PORTAL: "ops",
      // Direct codes
      SGI_PLUS: "SGI +",
      PUNCH: "Punch Coretation",
      OODO: "oodo",
      OPS: "ops",
    };
    return nameMap[code] || code;
  };

  const handleEditPrivilege = async (user) => {
    setSelectedUser(user);
    setLoading(true);

    try {
      // Fetch all applications
      const appsResponse = await fetch(`${API_URL}/applications`);
      const appsData = await appsResponse.json();

      if (appsData.success) {
        // Group to 4 main applications only
        const mainApps = [
          {
            id: "sgi-plus",
            code: "FIN_SYS",
            name: "SGI +",
            logo: "/assets/SGI+.png",
          },
          {
            id: "punch",
            code: "HR_PORTAL",
            name: "Punch Coretation",
            logo: "/assets/punch.png",
          },
          {
            id: "oodo",
            code: "WH_MGT",
            name: "oodo",
            logo: "/assets/oodo.png",
          },
          { id: "ops", code: "SALES_DB", name: "ops", logo: "/assets/Ops.png" },
        ];

        // Map database apps to main apps and get their actual DB IDs
        const mappedApps = mainApps.map((mainApp) => {
          const dbApp = appsData.data.find((app) => app.code === mainApp.code);
          return {
            id: dbApp ? dbApp.id : mainApp.id,
            name: mainApp.name,
            displayName: mainApp.name,
            code: mainApp.code,
            logo: mainApp.logo,
          };
        });

        setApplications(mappedApps);
      }

      // Fetch user's current privileges
      const privsResponse = await fetch(
        `${API_URL}/users/${user.id}/privileges`,
      );
      const privsData = await privsResponse.json();

      if (privsData.success) {
        const appIds = privsData.data.map((p) => p.application_id);
        setSelectedApps(appIds);
      }

      setShowPrivilegeModal(true);
    } catch (err) {
      console.error("Error loading privilege data:", err);
      alert("Failed to load privilege data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivilege = async () => {
    if (!selectedUser) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/${selectedUser.id}/privileges`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_ids: selectedApps,
            has_privilege: selectedApps.length > 0 ? 1 : 0,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert("Privilege settings saved successfully!");
        setShowPrivilegeModal(false);
        fetchUsers(); // Refresh user list
      } else {
        alert(
          "Failed to save privileges: " + (data.message || "Unknown error"),
        );
      }
    } catch (err) {
      console.error("Error saving privileges:", err);
      alert("Failed to save privileges. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApp = (appId) => {
    setSelectedApps((prev) => {
      if (prev.includes(appId)) {
        return prev.filter((id) => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAccountStatus = () => {
    setFormData((prev) => ({
      ...prev,
      accountActive: !prev.accountActive,
      status: !prev.accountActive ? "active" : "inactive",
    }));
  };

  const togglePrivilegeAccess = () => {
    setFormData((prev) => ({
      ...prev,
      privilegeAccess: !prev.privilegeAccess,
    }));
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
      // Sort: Admin users first, then regular users
      if (a.role === "Admin" && b.role !== "Admin") return -1;
      if (a.role !== "Admin" && b.role === "Admin") return 1;
      return 0;
    });

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
            className={`user-control-tab ${activeTab === "all-users" ? "active" : ""}`}
            onClick={() => setActiveTab("all-users")}
          >
            All Users
          </button>
          <button
            className={`user-control-tab ${activeTab === "active-users" ? "active" : ""}`}
            onClick={() => setActiveTab("active-users")}
          >
            Active Users
          </button>
          <button
            className={`user-control-tab ${activeTab === "inactive-users" ? "active" : ""}`}
            onClick={() => setActiveTab("inactive-users")}
          >
            Inactive Users
          </button>
          <button
            className={`user-control-tab ${activeTab === "privilege-users" ? "active" : ""}`}
            onClick={() => setActiveTab("privilege-users")}
          >
            Privilege Users
          </button>
          <button
            className={`user-control-tab ${activeTab === "admin-users" ? "active" : ""}`}
            onClick={() => setActiveTab("admin-users")}
          >
            Admin
          </button>
        </div>
      </div>

      {/* ALL USERS TAB */}
      {activeTab === "all-users" && (
        <div className="user-control-content active">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              className="search-input"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-user-btn" onClick={handleAddUser}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add User
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>No users found.</p>
            </div>
          ) : (
            <>
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
                        <tr key={user.id} className="status-active">
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
                              className={`role-badge ${user.role.toLowerCase()}`}
                              style={{
                                backgroundColor:
                                  user.role === "Admin" ? "#fef3c7" : "#e0e7ff",
                                color:
                                  user.role === "Admin" ? "#92400e" : "#3730a3",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${user.status}`}
                              style={{
                                backgroundColor:
                                  user.status === "active"
                                    ? "#d1fae5"
                                    : "#fee2e2",
                                color:
                                  user.status === "active"
                                    ? "#065f46"
                                    : "#991b1b",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.status.charAt(0).toUpperCase() +
                                user.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`role-badge ${user.position.toLowerCase().replace(" ", "-")}`}
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
                              className="btn btn-edit"
                              onClick={() => handleEditUser(user)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredUsers.length} of {users.length} users
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ACTIVE USERS TAB - Same as All Users */}
      {activeTab === "active-users" && (
        <div className="user-control-content active">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              className="search-input"
              placeholder="Search active users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>Loading active users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>No active users found.</p>
            </div>
          ) : (
            <>
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
                        <tr key={user.id} className="status-active">
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
                              className={`role-badge ${user.role.toLowerCase()}`}
                              style={{
                                backgroundColor:
                                  user.role === "Admin" ? "#fef3c7" : "#e0e7ff",
                                color:
                                  user.role === "Admin" ? "#92400e" : "#3730a3",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${user.status}`}
                              style={{
                                backgroundColor: "#d1fae5",
                                color: "#065f46",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.status.charAt(0).toUpperCase() +
                                user.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`role-badge ${user.position.toLowerCase().replace(" ", "-")}`}
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
                              className="btn btn-edit"
                              onClick={() => handleEditUser(user)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredUsers.length} of {activeUsers.length} active
                  users
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ADMIN TAB - Same as All Users */}
      {activeTab === "admin-users" && (
        <div className="user-control-content active">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              className="search-input"
              placeholder="Search admin users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>Loading admin users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>No admin users found.</p>
            </div>
          ) : (
            <>
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
                        <tr key={user.id} className="status-active">
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
                              className={`role-badge ${user.role.toLowerCase()}`}
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${user.status}`}
                              style={{
                                backgroundColor:
                                  user.status === "active"
                                    ? "#d1fae5"
                                    : "#fee2e2",
                                color:
                                  user.status === "active"
                                    ? "#065f46"
                                    : "#991b1b",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {user.status.charAt(0).toUpperCase() +
                                user.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`role-badge ${user.position.toLowerCase().replace(" ", "-")}`}
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
                              className="btn btn-edit"
                              onClick={() => handleEditUser(user)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredUsers.length} of {adminUsers.length} admin
                  users
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* INACTIVE USERS TAB */}
      {activeTab === "inactive-users" && (
        <div className="user-control-content active">
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>Loading inactive users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>No inactive users found.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const initials = getUserInitials(user.name);
                      const colors = getInitialsColor(user.name);
                      const deptType = getDeptType(user.department);
                      return (
                        <tr key={user.id}>
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
                              className={`role-badge ${user.position.toLowerCase().replace(" ", "-")}`}
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
                            <span className={`status-badge ${user.status}`}>
                              Inactive
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEditUser(user)}
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

              <div className="table-footer">
                <span>
                  Showing {filteredUsers.length} of {inactiveUsers.length}{" "}
                  inactive users
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* PRIVILEGE USERS TAB */}
      {activeTab === "privilege-users" && (
        <div className="user-control-content active">
          <div className="special-privileges-header"></div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>Loading privilege users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-gray)",
              }}
            >
              <p>No privilege users found.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="privileges-table">
                  <thead>
                    <tr>
                      <th>USER</th>
                      <th>POSITION</th>
                      <th>DEPARTMENT</th>
                      <th>SPECIAL APPS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const initials = getUserInitials(user.name);
                      const colors = getInitialsColor(user.name);
                      const deptType = getDeptType(user.department);
                      return (
                        <tr key={user.id} className="default-privilege-row">
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
                              className={`role-badge ${user.position.toLowerCase().replace(" ", "-")}`}
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
                            <div className="override-badges">
                              <span
                                className="override-badge"
                                style={{
                                  background: "#e1f5fe",
                                  color: "#0277bd",
                                }}
                              >
                                📊 {user.overrides || 0} Override
                                {(user.overrides || 0) > 1 ? "s" : ""}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEditPrivilege(user)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredUsers.length} of {privilegeUsers.length}{" "}
                  special privilege grants
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* EDIT USER MODAL - CONDITIONAL VERSION */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "580px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>
                {activeTab === "inactive-users" ? "Activate User" : "Edit User"}
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

            {/* SIMPLIFIED MODAL FOR INACTIVE USERS */}
            {activeTab === "inactive-users" ? (
              <>
                <div className="modal-body">
                  {/* User Info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "20px",
                      background: "#f8f9fa",
                      borderRadius: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      className="user-avatar"
                      style={{
                        background: getInitialsColor(selectedUser.name).bg,
                        color: getInitialsColor(selectedUser.name).color,
                        width: "64px",
                        height: "64px",
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      {getUserInitials(selectedUser.name)}
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#2c3e50",
                        }}
                      >
                        {selectedUser.name}
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#7f8c9a",
                        }}
                      >
                        {selectedUser.email}
                      </p>
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Inactive
                        </span>
                        <span
                          style={{
                            background: "#f0f3f7",
                            color: "#2c3e50",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                        >
                          {selectedUser.department} • {selectedUser.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activate Account Message */}
                  <div
                    style={{
                      padding: "16px",
                      background: "#fff9db",
                      borderLeft: "4px solid #f1c40f",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <p
                      style={{ margin: 0, fontSize: "14px", color: "#856404" }}
                    >
                      ⚠️ This account is currently inactive. Click the button
                      below to activate this user's account and grant them
                      access to the system.
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-btn modal-btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-primary"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        accountActive: true,
                        status: "active",
                      }));
                      handleSaveUser();
                    }}
                    disabled={loading}
                    style={{
                      background: "#27ae60",
                      borderColor: "#27ae60",
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
                    {loading ? "Activating..." : "Activate Account"}
                  </button>
                </div>
              </>
            ) : (
              /* FULL MODAL FOR ACTIVE/ALL/ADMIN/PRIVILEGE USERS */
              <>
                <div className="modal-body">
                  {/* Account Status */}
                  <div className="modal-account-status">
                    <div className="modal-account-status-info">
                      <h4>Account Status</h4>
                      <p>Blocked users cannot log in.</p>
                    </div>
                    <div
                      className={`toggle-switch ${formData.accountActive ? "active" : ""}`}
                      onClick={toggleAccountStatus}
                    ></div>
                  </div>

                  {/* Personal Information - Horizontal Layout */}
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

                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
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
                          gap: "16px",
                        }}
                      >
                        <div className="modal-form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            disabled
                            style={{
                              backgroundColor: "#f5f5f5",
                              cursor: "not-allowed",
                              color: "#666",
                            }}
                          />
                        </div>

                        <div className="modal-form-group">
                          <label>Corporate Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            style={{
                              backgroundColor: "#f5f5f5",
                              cursor: "not-allowed",
                              color: "#666",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#fff3cd",
                        borderLeft: "4px solid #ffc107",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#856404",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
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
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        These fields are synced from third-party API and cannot
                        be edited manually.
                      </p>
                    </div>
                  </div>

                  {/* Job Information - Read Only */}
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
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <h4>Job Information</h4>
                    </div>

                    <div className="modal-form-row">
                      <div className="modal-form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          disabled
                          style={{
                            backgroundColor: "#f5f5f5",
                            cursor: "not-allowed",
                            color: "#666",
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Position</label>
                        <input
                          type="text"
                          value={formData.position}
                          disabled
                          style={{
                            backgroundColor: "#f5f5f5",
                            cursor: "not-allowed",
                            color: "#666",
                          }}
                        />
                      </div>
                    </div>

                    <div className="modal-form-group">
                      <label>Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleFormChange}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Privilege Access Toggle */}
                  <div className="modal-section">
                    <div className="modal-privilege-toggle">
                      <div className="modal-privilege-toggle-info">
                        <h4>Privilege Access</h4>
                        <p>Enable special application permissions</p>
                      </div>
                      <div className="privilege-status">
                        <span
                          className={`privilege-status-badge yellow ${formData.privilegeAccess ? "enabled" : "disabled"}`}
                        >
                          {formData.privilegeAccess ? "Enabled" : "Disabled"}
                        </span>
                        <div
                          className={`toggle-switch yellow ${formData.privilegeAccess ? "active" : ""}`}
                          onClick={togglePrivilegeAccess}
                        ></div>
                      </div>
                    </div>

                    <div
                      className="yellow-banner"
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#fff9db",
                        borderLeft: "4px solid #f1c40f",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#856404",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
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
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        Use Privilege Users tab to manage which applications
                        this user can access.
                      </p>
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
                  <button
                    className="modal-btn modal-btn-primary"
                    onClick={handleSaveUser}
                    disabled={loading}
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
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "580px", maxHeight: "80vh", overflowY: "auto" }}
          >
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
                Add New User
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
              {/* Personal Information */}
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

                <div className="modal-form-group">
                  <label className="required">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter user's full name"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="modal-form-group">
                  <label className="required">Corporate Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="user@somagede.com"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Job Information */}
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
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <h4>Job Information</h4>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label className="required">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                    >
                      <option value="Finance">Finance</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="IT Department">IT Department</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </div>
                  <div className="modal-form-group">
                    <label className="required">Position</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleFormChange}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Senior Manager">Senior Manager</option>
                      <option value="Director">Director</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
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
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleSaveUser}
                disabled={loading}
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
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRIVILEGE MODAL */}
      {showPrivilegeModal && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setShowPrivilegeModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "580px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: "18px", margin: 0 }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: "18px", height: "18px" }}
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
                Manage Special Privileges
              </h3>
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
            <div className="modal-body" style={{ padding: "20px" }}>
              <div
                style={{
                  marginBottom: "16px",
                  padding: "14px",
                  background: "#f8f9fa",
                  border: "1px solid #e1e8ed",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    className="user-avatar"
                    style={{
                      background: getInitialsColor(selectedUser.name).bg,
                      color: getInitialsColor(selectedUser.name).color,
                      width: "44px",
                      height: "44px",
                      fontSize: "16px",
                    }}
                  >
                    {getUserInitials(selectedUser.name)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2c3e50",
                      }}
                    >
                      {selectedUser.name}
                    </h4>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#7f8c9a",
                      }}
                    >
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="modal-form-group"
                style={{ marginBottom: "12px" }}
              >
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--text-dark)",
                  }}
                >
                  📱 Application Access
                </p>
                <small
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "10px",
                    color: "#7f8c9a",
                  }}
                >
                  Select which applications this user can access
                </small>
                <div
                  style={{
                    display: "grid",
                    gap: "6px",
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {applications.length === 0 ? (
                    <p
                      style={{
                        color: "#7f8c9a",
                        fontSize: "11px",
                        fontStyle: "italic",
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >
                      Loading applications...
                    </p>
                  ) : (
                    applications.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          background: "white",
                          border: "1px solid #e8eef7",
                          borderRadius: "10px",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafb";
                          e.currentTarget.style.borderColor = "#d4ddf8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.borderColor = "#e8eef7";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              background:
                                "linear-gradient(135deg, #f5f7fa 0%, #e8eef7 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={app.logo}
                              alt={app.displayName || app.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML =
                                  '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#667eea">📱</div>';
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {app.displayName || app.name}
                              {selectedApps.includes(app.id) && (
                                <span className="privilege-access-badge-yellow">
                                  PRIVILEGE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <label
                          style={{
                            position: "relative",
                            display: "inline-block",
                            width: "36px",
                            height: "20px",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            style={{ opacity: 0, width: 0, height: 0 }}
                            checked={selectedApps.includes(app.id)}
                            onChange={() => handleToggleApp(app.id)}
                          />
                          <span
                            style={{
                              position: "absolute",
                              cursor: "pointer",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: selectedApps.includes(app.id)
                                ? "#27ae60"
                                : "#e0e0e0",
                              borderRadius: "10px",
                              transition: "0.3s",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                content: '""',
                                height: "16px",
                                width: "16px",
                                left: "2px",
                                bottom: "2px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                transition: "0.3s",
                                transform: selectedApps.includes(app.id)
                                  ? "translateX(16px)"
                                  : "translateX(0)",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                              }}
                            />
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  background: "#f0f4ff",
                  border: "1px solid #d4ddf8",
                  borderRadius: "8px",
                }}
              >
                <p style={{ margin: 0, fontSize: "11px", color: "#4a90e2" }}>
                  <strong>{selectedApps.length} application(s) selected</strong>
                  {selectedApps.length === 0 &&
                    " - User will have no special privileges"}
                </p>
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                justifyContent: "space-between",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowPrivilegeModal(false)}
                style={{ padding: "7px 12px", fontSize: "12px", flex: "0.8" }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleSavePrivilege}
                disabled={loading}
                style={{ padding: "7px 12px", fontSize: "12px", flex: "1" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {loading ? "Saving..." : "Save Privileges"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {showRoleConfirmModal && selectedUser && (
        <div
          className="modal-overlay confirmation-modal"
          onClick={() => setShowRoleConfirmModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "480px", maxWidth: "90vw" }}
          >
            <div className="modal-body">
              <div className="confirmation-icon warning">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3>Promote User to Admin?</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.6" }}>
                Are you sure you want to promote{" "}
                <strong>{selectedUser.name}</strong> to <strong>Admin</strong>{" "}
                role? This will grant them full administrative privileges
                including user management, application permissions, and system
                configuration access.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowRoleConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={saveUserToDatabase}
                disabled={loading}
                style={{ backgroundColor: "#f39c12", borderColor: "#f39c12" }}
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
                {loading ? "Saving..." : "Confirm Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserControl;
