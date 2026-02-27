import { useState, useEffect, useRef } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { api } from "../../../utils/api";
import "../../../styles/admin-dashboard.css";

const MasterRoles = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api.get("/roles");
      if (data.success) {
        setRoles(data.data);
      } else {
        showToast("Failed to fetch roles", "error");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    permissions: [],
    isActive: true,
  });

  const availablePermissions = [
    { id: "manage_users", label: "Manage Users" },
    { id: "manage_apps", label: "Manage Applications" },
    { id: "manage_departments", label: "Manage Departments" },
    { id: "view_sessions", label: "View Active Sessions" },
    { id: "broadcast", label: "Send Broadcasts" },
    { id: "view_apps", label: "View Applications" },
    { id: "use_apps", label: "Use Applications" },
  ];

  const handleAdd = () => {
    setSelectedRole(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      permissions: [],
      isActive: true,
    });
    setShowModal(true);
  };

  const originalData = useRef(null);

  const handleEdit = (role) => {
    setSelectedRole(role);
    const editData = {
      name: role.name,
      code: role.code,
      description: role.description || "",
      permissions: role.permissions || [],
      isActive: role.isActive,
    };
    setFormData(editData);
    originalData.current = { ...editData, permissions: [...(role.permissions || [])] };
    setShowModal(true);
  };

  const handleDelete = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showToast("Role name is required", "warning");
      return;
    }
    if (formData.name.length > 100) {
      showToast("Role name must be less than 100 characters", "warning");
      return;
    }
    if (!formData.code?.trim()) {
      showToast("Role code is required", "warning");
      return;
    }
    if (formData.code.length > 20) {
      showToast("Role code must be less than 20 characters", "warning");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (selectedRole) {
        data = await api.put(`/roles/${selectedRole.id}`, formData);
        if (data.success) {
          showToast("Role updated successfully", "success");
        } else {
          showToast(data.message || "Failed to update role", "error");
          return;
        }
      } else {
        data = await api.post("/roles", formData);
        if (data.success) {
          showToast("Role added successfully", "success");
        } else {
          showToast(data.message || "Failed to create role", "error");
          return;
        }
      }

      setShowModal(false);
      fetchRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (selectedRole.userCount > 0) {
      showToast(
        `Cannot delete role "${selectedRole.name}" because ${selectedRole.userCount} users are assigned to this role.`,
        "error",
      );
      return;
    }

    try {
      const data = await api.delete(`/roles/${selectedRole.id}`);
      if (data.success) {
        showToast("Role deleted successfully", "success");
        setShowDeleteModal(false);
        fetchRoles();
      } else {
        showToast(data.message || "Failed to delete role", "error");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      showToast("Failed to connect to server", "error");
    }
  };

  const toggleStatus = async (role) => {
    if (role.code === "ADMIN" || role.code === "USER") {
      showToast(
        "Cannot deactivate default system roles (Admin and User)",
        "warning",
      );
      return;
    }

    try {
      const data = await api.patch(`/roles/${role.id}/toggle`);
      if (data.success) {
        fetchRoles();
      } else {
        showToast(data.message || "Failed to toggle role status", "error");
      }
    } catch (error) {
      console.error("Error toggling role status:", error);
      showToast("Failed to connect to server", "error");
    }
  };

  const togglePermission = (permissionId) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      role.code.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <div className="masterdata-wrapper">
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
        <h2>Master Roles</h2>
      </div>

      <div className="masterdata-header">
        <div className="search-bar">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="add-button" onClick={handleAdd}>
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
          Add Role
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading roles...</div>
      ) : filteredRoles.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? "No roles found" : "No roles available"}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>ID</th>
                <th>Role Name</th>
                <th style={{ width: "120px" }}>Code</th>
                <th>Permissions</th>
                <th style={{ width: "100px", textAlign: "center" }}>Users</th>
                <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                <th style={{ width: "180px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td>{role.id}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: "500" }}>{role.name}</div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "2px",
                        }}
                      >
                        {role.description}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="code-badge">{role.code}</span>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      {(role.permissions || []).slice(0, 3).map((perm) => (
                        <span
                          key={perm}
                          style={{
                            backgroundColor: "#e8f4fd",
                            color: "#4a90e2",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontSize: "11px",
                          }}
                        >
                          {availablePermissions.find((p) => p.id === perm)
                            ?.label || perm}
                        </span>
                      ))}
                      {(role.permissions || []).length > 3 && (
                        <span style={{ fontSize: "11px", color: "#666" }}>
                          +{(role.permissions || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "600" }}>
                    {role.userCount}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        backgroundColor: role.isActive ? "#27ae60" : "#95a5a6",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {role.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-toggle"
                        onClick={() => toggleStatus(role)}
                        style={{
                          backgroundColor: role.isActive
                            ? "#95a5a6"
                            : "#27ae60",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        {role.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(role)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(role)}
                        disabled={role.code === "ADMIN" || role.code === "USER"}
                        style={{
                          opacity:
                            role.code === "ADMIN" || role.code === "USER"
                              ? 0.5
                              : 1,
                          cursor:
                            role.code === "ADMIN" || role.code === "USER"
                              ? "not-allowed"
                              : "pointer",
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
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRole ? "Edit Role" : "Add New Role"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
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
              <div className="modal-form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Manager"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Role Code *</label>
                <input
                  type="text"
                  placeholder="e.g., MANAGER"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  style={{ textTransform: "uppercase" }}
                  disabled={
                    selectedRole &&
                    (selectedRole.code === "ADMIN" ||
                      selectedRole.code === "USER")
                  }
                />
                {selectedRole &&
                  (selectedRole.code === "ADMIN" ||
                    selectedRole.code === "USER") && (
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      System roles cannot be renamed
                    </small>
                  )}
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Role description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="modal-form-group">
                <label>Permissions</label>
                <div className="modal-permission-grid">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`modal-permission-item ${
                        formData.permissions.includes(perm.id) ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              {(() => {
                const isEdit = !!selectedRole;
                const hasChanges = !isEdit || !originalData.current ||
                  formData.name !== originalData.current.name ||
                  formData.code !== originalData.current.code ||
                  formData.description !== originalData.current.description ||
                  JSON.stringify(formData.permissions) !== JSON.stringify(originalData.current.permissions);
                const canSave = hasChanges && !loading;
                return (
                  <button
                    className={`modal-btn ${canSave ? 'modal-btn-primary' : 'modal-btn-disabled'}`}
                    onClick={handleSave}
                    disabled={!canSave}
                    style={{
                      opacity: canSave ? 1 : 0.5,
                      cursor: canSave ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
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
                    {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Role'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedRole && (
        <div
          className="confirm-dialog-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body">
              <div className="confirm-dialog-icon warning">
                <svg
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
              <h3>Delete Role?</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedRole.name}</strong> role?
                {selectedRole.userCount > 0 ? (
                  <span style={{ color: "#e74c3c", fontWeight: "600" }}>
                    <br />
                    Warning: {selectedRole.userCount} users are currently
                    assigned to this role.
                  </span>
                ) : (
                  " This action cannot be undone."
                )}
              </p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                className="cd-btn cd-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="cd-btn cd-btn-danger" onClick={confirmDelete}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterRoles;
