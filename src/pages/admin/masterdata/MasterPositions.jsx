import { useState, useEffect, useRef } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { api } from "../../../utils/api";
import "../../../styles/admin-dashboard.css";

const MasterPositions = () => {
  const { showToast } = useToast();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const data = await api.get("/positions");
      if (data.success) {
        setPositions(data.data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
      showToast("Failed to load positions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPosition(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const originalData = useRef(null);

  const handleEdit = (pos) => {
    setSelectedPosition(pos);
    const editData = {
      name: pos.name,
      code: pos.code,
      description: pos.description || "",
      isActive: pos.status === "active" || pos.isActive,
    };
    setFormData(editData);
    originalData.current = { ...editData };
    setShowModal(true);
  };

  const handleDelete = (pos) => {
    setSelectedPosition(pos);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showToast("Position name is required", "warning");
      return;
    }
    if (formData.name.length > 100) {
      showToast("Position name must be less than 100 characters", "warning");
      return;
    }
    if (!formData.code?.trim()) {
      showToast("Position code is required", "warning");
      return;
    }
    if (formData.code.length > 20) {
      showToast("Position code must be less than 20 characters", "warning");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (selectedPosition) {
        data = await api.put(`/positions/${selectedPosition.id}`, formData);
      } else {
        data = await api.post("/positions", formData);
      }

      if (data.success) {
        showToast(data.message || "Position saved successfully", "success");
        setShowModal(false);
        fetchPositions();
      } else {
        showToast(data.message || "Failed to save position", "error");
      }
    } catch (error) {
      console.error("Error saving position:", error);
      showToast("Failed to save position", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const data = await api.delete(`/positions/${selectedPosition.id}`);

      if (data.success) {
        showToast(data.message || "Position deleted successfully", "success");
        setShowDeleteModal(false);
        fetchPositions();
      } else {
        showToast(data.message || "Failed to delete position", "error");
      }
    } catch (error) {
      console.error("Error deleting position:", error);
      showToast("Failed to delete position", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (pos) => {
    setLoading(true);
    try {
      const data = await api.patch(`/positions/${pos.id}/toggle`);

      if (data.success) {
        fetchPositions();
      } else {
        showToast(data.message || "Failed to toggle status", "error");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Failed to toggle status", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter(
    (pos) =>
      pos.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      pos.code.toLowerCase().includes(searchQuery.trim().toLowerCase()),
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <polyline points="17 11 19 13 23 9"></polyline>
        </svg>
        <h2>Master Positions</h2>
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
            placeholder="Search positions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="add-button" onClick={handleAdd} disabled={loading}>
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
          Add Position
        </button>
      </div>

      {loading && positions.length === 0 ? (
        <div className="empty-state">Loading positions...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>ID</th>
                <th>Position Name</th>
                <th style={{ width: "120px" }}>Code</th>
                <th>Description</th>
                <th style={{ width: "80px", textAlign: "center" }}>Users</th>
                <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                <th style={{ width: "150px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    {searchQuery
                      ? "No positions found"
                      : "No positions available"}
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => (
                  <tr key={pos.id}>
                    <td>{pos.id}</td>
                    <td style={{ fontWeight: "500" }}>{pos.name}</td>
                    <td>
                      <span
                        style={{
                          backgroundColor: "#e8f4fd",
                          color: "#2e5c8a",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                        }}
                      >
                        {pos.code}
                      </span>
                    </td>
                    <td style={{ color: "#7f8c9a" }}>
                      {pos.description || "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          backgroundColor: "#f0f3f7",
                          color: "#2c3e50",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {pos.userCount || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => toggleStatus(pos)}
                        disabled={loading}
                        style={{
                          backgroundColor:
                            pos.status === "active" || pos.isActive
                              ? "#27ae60"
                              : "#95a5a6",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {pos.status === "active" || pos.isActive
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleEdit(pos)}
                          className="btn-action edit"
                          title="Edit"
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
                        </button>
                        <button
                          onClick={() => handleDelete(pos)}
                          className="btn-action delete"
                          title="Delete"
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
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPosition ? "Edit Position" : "Add New Position"}</h3>
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
                <label>Position Name *</label>
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
                <label>Position Code *</label>
                <input
                  type="text"
                  placeholder="e.g., MGR"
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
                <label>Description</label>
                <textarea
                  placeholder="Position description (optional)"
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
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              {(() => {
                const isEdit = !!selectedPosition;
                const hasChanges = !isEdit || !originalData.current ||
                  formData.name !== originalData.current.name ||
                  formData.code !== originalData.current.code ||
                  formData.description !== originalData.current.description;
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
                    {loading ? "Saving..." : isEdit ? "Save Changes" : "Save Position"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPosition && (
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
              <h3>Delete Position?</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedPosition.name}</strong>?
                {selectedPosition.userCount > 0 && (
                  <span
                    style={{
                      color: "#e74c3c",
                      display: "block",
                      marginTop: "8px",
                      fontWeight: "600",
                    }}
                  >
                    Warning: {selectedPosition.userCount} user(s) are currently
                    assigned to this position.
                  </span>
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
              <button
                className="cd-btn cd-btn-danger"
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
                {loading ? "Deleting..." : "Delete Position"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPositions;
