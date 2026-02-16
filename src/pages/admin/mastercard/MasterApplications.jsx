import { useState, useEffect } from "react";
import { useToast } from "../../../contexts/ToastContext";
import "../../../styles/admin-dashboard.css";

const API_URL = "http://localhost:3001/api";

const MasterApplications = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    url: "",
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/applications`);
      const data = await response.json();
      if (data.success) {
        // Map DB fields to UI fields if necessary, or ensure backend sends matching fields
        // DB: status='active'/'inactive', UI: isActive=true/false
        const mappedApps = data.data.map((app) => ({
          ...app,
          isActive: app.status === "active",
        }));
        setApplications(mappedApps);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      showToast("Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedApp(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      url: "",
      isActive: true,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const handleEdit = (app) => {
    setSelectedApp(app);
    setFormData({
      name: app.name,
      code: app.code,
      description: app.description || "",
      url: app.url || "",
      isActive: app.isActive,
    });
    setLogoFile(null);
    setLogoPreview(app.icon || null); // Display existing icon as preview
    setShowModal(true);
  };

  const handleDelete = (app) => {
    setSelectedApp(app);
    setShowDeleteModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showToast("Name and code are required", "error");
      return;
    }

    setLoading(true);
    try {
      const method = selectedApp ? "PUT" : "POST";
      const endpoint = selectedApp
        ? `${API_URL}/applications/${selectedApp.id}`
        : `${API_URL}/applications`;

      const data = new FormData();
      data.append("name", formData.name);
      data.append("code", formData.code);
      data.append("description", formData.description);
      data.append("url", formData.url);
      data.append("status", formData.isActive ? "active" : "inactive");
      if (logoFile) {
        data.append("icon", logoFile);
      }

      const response = await fetch(endpoint, {
        method,
        body: data, // No Content-Type header needed for FormData, browser sets it
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          result.message || "Application saved successfully",
          "success",
        );
        setShowModal(false);
        fetchApplications();
      } else {
        showToast(result.message || "Failed to save application", "error");
      }
    } catch (error) {
      console.error("Error saving application:", error);
      showToast("Failed to save application", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/applications/${selectedApp.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (data.success) {
        showToast(
          data.message || "Application deleted successfully",
          "success",
        );
        setShowDeleteModal(false);
        fetchApplications();
      } else {
        showToast(data.message || "Failed to delete application", "error");
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      showToast("Failed to delete application", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (app) => {
    setSelectedApp(app);
    setShowStatusModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedApp) return;

    setLoading(true);
    try {
      const newStatus = !selectedApp.isActive;
      const response = await fetch(
        `${API_URL}/applications/${selectedApp.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedApp.name,
            code: selectedApp.code,
            description: selectedApp.description,
            url: selectedApp.url,
            status: newStatus ? "active" : "inactive",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        showToast(
          `Application ${newStatus ? "activated" : "deactivated"} successfully`,
          "success",
        );
        setShowStatusModal(false);
        fetchApplications();
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mastercard-wrapper">
      <div className="section-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <h2>Master Applications</h2>
      </div>

      <div className="mastercard-header">
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
            placeholder="Search applications..."
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
          Add Application
        </button>
      </div>

      {/* List View - Row Based */}
      <div className="app-list-container">
        {filteredApps.length === 0 ? (
          <div className="empty-state">
            {searchQuery
              ? "No applications found"
              : "No applications available"}
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="app-row">
              {/* Logo */}
              <div className="app-row-logo">
                {app.icon ? (
                  <img src={app.icon} alt={app.name} />
                ) : (
                  <div className="app-logo-placeholder">
                    {app.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="app-row-info">
                <div className="app-row-header">
                  <h4 className="app-row-name">{app.name}</h4>
                  {!app.isActive && (
                    <span className="app-row-badge-inactive">
                      <i className="fas fa-times-circle"></i>
                      INACTIVE
                    </span>
                  )}
                </div>
                <p className="app-row-description">
                  {app.description || "No description"}
                </p>
              </div>

              {/* Actions */}
              <div className="app-row-actions">
                <button
                  className={`btn-row-toggle ${app.isActive ? "active" : "inactive"}`}
                  onClick={() => handleToggleStatus(app)}
                  title={app.isActive ? "Deactivate" : "Activate"}
                >
                  {app.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="btn-row-action edit"
                  onClick={() => handleEdit(app)}
                  title="Edit"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  className="btn-row-action delete"
                  onClick={() => handleDelete(app)}
                  title="Delete"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "580px", maxWidth: "90vw" }}
          >
            <div className="modal-header">
              <h3>
                {selectedApp ? "Edit Application" : "Add New Application"}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-form-group">
                <label>Application Name *</label>
                <input
                  type="text"
                  placeholder="e.g., SGI+"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Application Code *</label>
                <input
                  type="text"
                  placeholder="e.g., SGI_PLUS"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="modal-form-group">
                <label>Application Icon</label>
                <div
                  className="file-upload-container"
                  onClick={() => document.getElementById("icon-upload").click()}
                  style={{
                    border: "2px dashed #cbd5e0",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "#f8f9fa",
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.borderColor = "#3498db")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor = "#cbd5e0")
                  }
                >
                  <input
                    id="icon-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {logoPreview ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src={logoPreview}
                        alt="Preview"
                        style={{
                          width: "64px",
                          height: "64px",
                          objectFit: "contain",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "#3498db" }}>
                        Click to change icon
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        color: "#7f8c8d",
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span style={{ fontSize: "14px" }}>
                        Click to upload icon
                      </span>
                      <span style={{ fontSize: "12px", color: "#95a5a6" }}>
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-form-group">
                <label>Application URL</label>
                <input
                  type="text"
                  placeholder="https://app.example.com"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Application description"
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
                <label
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleSave}
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
                {loading ? "Saving..." : "Save Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedApp && (
        <div
          className="modal-overlay confirmation-modal"
          onClick={() => setShowDeleteModal(false)}
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
              <h3>Delete Application?</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedApp.name}</strong>? This action cannot be
                undone and will affect all department permissions and user
                access to this application.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={confirmDelete}
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
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                {loading ? "Deleting..." : "Delete Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CONFIRMATION MODAL */}
      {showStatusModal && selectedApp && (
        <div
          className="modal-overlay confirmation-modal"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "480px", maxWidth: "90vw" }}
          >
            <div className="modal-body">
              <div
                className={`confirmation-icon ${selectedApp.isActive ? "warning" : "info"}`}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {selectedApp.isActive ? (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </>
                  )}
                </svg>
              </div>
              <h3>
                {selectedApp.isActive ? "Deactivate" : "Activate"} Application?
              </h3>
              <p>
                Are you sure you want to{" "}
                {selectedApp.isActive ? "deactivate" : "activate"}{" "}
                <strong>{selectedApp.name}</strong>?{" "}
                {selectedApp.isActive
                  ? "This will disable the application and remove access for all departments."
                  : "This will enable the application and allow departments to configure access."}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button
                className={`modal-btn ${selectedApp.isActive ? "modal-btn-warning" : "modal-btn-primary"}`}
                onClick={confirmToggleStatus}
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
                  {selectedApp.isActive ? (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </>
                  ) : (
                    <>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </>
                  )}
                </svg>
                {loading
                  ? "Processing..."
                  : selectedApp.isActive
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterApplications;
