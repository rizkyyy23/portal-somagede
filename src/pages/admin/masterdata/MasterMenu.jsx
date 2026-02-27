import { useState, useEffect, useRef } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { api } from "../../../utils/api";
import "../../../styles/admin-dashboard.css";

// Font Awesome icon options for sidebar menus
const MENU_ICONS = [
  { name: "fas fa-th-large", label: "Dashboard" },
  { name: "fas fa-clock", label: "Clock" },
  { name: "fas fa-window-restore", label: "App Window" },
  { name: "fas fa-users-cog", label: "User Control" },
  { name: "fas fa-comment-dots", label: "Message" },
  { name: "fas fa-cog", label: "Settings" },
  { name: "fas fa-chart-bar", label: "Chart" },
  { name: "fas fa-file-alt", label: "File" },
  { name: "fas fa-shield-alt", label: "Shield" },
  { name: "fas fa-link", label: "Link" },
  { name: "fas fa-bell", label: "Bell" },
  { name: "fas fa-calendar-alt", label: "Calendar" },
  { name: "fas fa-envelope", label: "Email" },
  { name: "fas fa-folder-open", label: "Folder" },
  { name: "fas fa-globe", label: "Globe" },
  { name: "fas fa-home", label: "Home" },
  { name: "fas fa-headset", label: "Support" },
  { name: "fas fa-tools", label: "Tools" },
  { name: "fas fa-database", label: "Database" },
  { name: "fas fa-clipboard-list", label: "Clipboard" },
];

const MasterMenu = () => {
  const { showToast } = useToast();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    path: "",
    icon: "fas fa-th-large",
    customIcon: null,
    order: 1,
    isActive: true,
  });

  // Fetch menus from API
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const data = await api.get("/menus");
      if (data.success) {
        setMenus(data.data);
      } else {
        showToast("Failed to fetch menus", "error");
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setSelectedMenu(null);
    setFormData({
      label: "",
      path: "/admin/",
      icon: "fas fa-th-large",
      customIcon: null,
      order: menus.length + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  const originalData = useRef(null);

  const handleEdit = (menu) => {
    setSelectedMenu(menu);
    const editData = {
      label: menu.label,
      path: menu.path,
      icon: menu.icon,
      customIcon: menu.customIcon || null,
      order: menu.order,
      isActive: menu.isActive,
    };
    setFormData(editData);
    originalData.current = { ...editData };
    setShowModal(true);
  };

  const handleDelete = (menu) => {
    setSelectedMenu(menu);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.label?.trim()) {
      showToast("Menu label is required", "error");
      return;
    }
    if (formData.label.length > 50) {
      showToast("Menu label must be less than 50 characters", "warning");
      return;
    }
    if (!formData.path?.trim()) {
      showToast("Menu path is required", "error");
      return;
    }

    setLoading(true);
    try {
      if (selectedMenu) {
        const data = await api.put(`/menus/${selectedMenu.id}`, formData);
        if (data.success) {
          showToast("Menu updated successfully", "success");
          fetchMenus();
        } else {
          showToast(data.message || "Failed to update menu", "error");
        }
      } else {
        const data = await api.post("/menus", formData);
        if (data.success) {
          showToast("Menu added successfully", "success");
          fetchMenus();
        } else {
          showToast(data.message || "Failed to add menu", "error");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving menu:", error);
      showToast("Failed to save menu", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const data = await api.delete(`/menus/${selectedMenu.id}`);
      if (data.success) {
        showToast(`Menu "${selectedMenu.label}" deleted`, "success");
        fetchMenus();
      } else {
        showToast(data.message || "Failed to delete menu", "error");
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      showToast("Failed to delete menu", "error");
    }
    setShowDeleteModal(false);
    setSelectedMenu(null);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }
    if (file.size > 512000) {
      showToast("Icon must be less than 500KB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        customIcon: event.target.result,
        icon: "__custom__",
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeCustomIcon = () => {
    setFormData((prev) => ({
      ...prev,
      customIcon: null,
      icon: "fas fa-th-large",
    }));
  };

  const filteredMenus = menus
    .filter(
      (menu) =>
        (menu.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.path.toLowerCase().includes(searchQuery.toLowerCase())) &&
        menu.path !== "/admin/masterdata",
    )
    .sort((a, b) => a.order - b.order);

  return (
    <div className="masterdata-wrapper">
      {/* Page Header */}
      <div className="section-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <h2>Master Menu</h2>
      </div>

      {/* Toolbar */}
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
            placeholder="Search menus..."
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
          Add Menu
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="empty-state">Loading menus...</div>
      ) : filteredMenus.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? "No menus found" : "No menus available"}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th style={{ width: 60 }}>Icon</th>
                <th>Label</th>
                <th>Path</th>
                <th style={{ width: 90 }}>Order</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenus.map((menu, index) => (
                <tr key={menu.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: menu.isActive ? "#eff6ff" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: menu.isActive ? "#4a90e2" : "#94a3b8",
                        fontSize: 15,
                        overflow: "hidden",
                      }}
                    >
                      {menu.customIcon ? (
                        <img
                          src={menu.customIcon}
                          alt=""
                          style={{
                            width: 20,
                            height: 20,
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <i className={menu.icon}></i>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-medium">{menu.label}</span>
                  </td>
                  <td>
                    <code
                      style={{
                        fontSize: 12,
                        background: "#f1f5f9",
                        padding: "4px 10px",
                        borderRadius: 6,
                        color: "#475569",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {menu.path}
                    </code>
                  </td>
                  <td className="text-center">{menu.order}</td>
                  <td>
                    <span
                      className={`status-pill ${menu.isActive ? "status-active-pill" : "status-inactive-pill"}`}
                    >
                      {menu.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-action edit"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          cursor: "pointer",
                          color: "#4a90e2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleEdit(menu)}
                        title="Edit"
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        className="btn-action delete"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          cursor: "pointer",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleDelete(menu)}
                        title="Delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ADD / EDIT MODAL
          ═══════════════════════════════════════════ */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-modern"
            style={{ maxWidth: 720, width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header-modern">
              <div className="modal-title-box">
                <div
                  className="modal-icon-badge"
                  style={{
                    background: selectedMenu ? "#fef3c7" : "#eff6ff",
                    color: selectedMenu ? "#d97706" : "#4a90e2",
                  }}
                >
                  <i
                    className={selectedMenu ? "fas fa-pen" : "fas fa-plus"}
                    style={{ fontSize: 16 }}
                  ></i>
                </div>
                <h3>{selectedMenu ? "Edit Menu" : "Add New Menu"}</h3>
              </div>
              <button
                className="close-btn-modern"
                onClick={() => setShowModal(false)}
              >
                <svg
                  width="16"
                  height="16"
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

            {/* Body */}
            <div className="modal-body-modern" style={{ padding: "24px 30px" }}>
              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "30px",
                  alignItems: "start" 
                }}
              >
                {/* Left Column: General Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "0 0 10px 0", borderBottom: "1px solid #f1f5f9", marginBottom: "5px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>General Info</h4>
                  </div>

                  {/* Menu Label */}
                  <div className="form-group-modern">
                    <label>
                      Menu Label <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <i className="fas fa-tag" style={{ fontSize: 13 }}></i>
                      </span>
                      <input
                        type="text"
                        className="modern-input with-icon"
                        value={formData.label}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        placeholder="input menu name..."
                      />
                    </div>
                  </div>

                  {/* Route Path */}
                  <div className="form-group-modern">
                    <label>
                      Route Path <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <i className="fas fa-route" style={{ fontSize: 13 }}></i>
                      </span>
                      <input
                        type="text"
                        className="modern-input with-icon"
                        value={formData.path}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            path: e.target.value,
                          }))
                        }
                        placeholder="/admin/page-name"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <span className="form-hint" style={{ marginTop: 4 }}>
                      URL path untuk navigasi sidebar
                    </span>
                  </div>

                  {/* Display Order */}
                  <div className="form-group-modern">
                    <label>Display Order</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <i
                          className="fas fa-sort-numeric-down"
                          style={{ fontSize: 13 }}
                        ></i>
                      </span>
                      <input
                        type="number"
                        className="modern-input with-icon"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            order: parseInt(e.target.value) || 1,
                          }))
                        }
                        min="1"
                      />
                    </div>
                    <span className="form-hint" style={{ marginTop: 4 }}>
                      Urutan tampil menu di sidebar (1 = paling atas)
                    </span>
                  </div>

                  {/* Status Toggle (only in Edit mode) */}
                  {selectedMenu && (
                    <div className="form-group-modern">
                      <label>Status</label>
                      <div className="toggle-group">
                        <label
                          className="toggle-label-wrapper"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: !prev.isActive,
                            }))
                          }
                        >
                          <div className="toggle-text">
                            <span className="toggle-title">
                              {formData.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="toggle-subtitle" style={{ fontSize: "10px" }}>
                              {formData.isActive
                                ? "Menu ditampilkan"
                                : "Menu disembunyikan"}
                            </span>
                          </div>
                          <div
                            className={`modern-toggle ${formData.isActive ? "active" : ""}`}
                          >
                            <div className="toggle-circle"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Icon Management */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "0 0 10px 0", borderBottom: "1px solid #f1f5f9", marginBottom: "5px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Icon Management</h4>
                  </div>

                  <div className="form-group-modern">
                    <label>Current Selected</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: formData.isActive ? "#eff6ff" : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: formData.isActive ? "#4a90e2" : "#94a3b8",
                          fontSize: 18,
                          overflow: "hidden",
                        }}
                      >
                        {formData.customIcon ? (
                          <img
                            src={formData.customIcon}
                            alt=""
                            style={{
                              width: 24,
                              height: 24,
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <i className={formData.icon}></i>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                          {formData.customIcon ? "Custom Icon" : (MENU_ICONS.find(i => i.name === formData.icon)?.label || "Menu Icon")}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Icon used in sidebar
                        </span>
                      </div>
                      {formData.customIcon && (
                        <button
                          className="remove-icon-btn"
                          onClick={removeCustomIcon}
                          title="Remove custom icon"
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            background: "#fff1f2",
                            color: "#ef4444",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div className="form-group-modern">
                    <label>Select From Preset</label>
                    <div 
                      className="icon-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 8,
                        maxHeight: 140,
                        overflowY: "auto",
                        padding: "10px",
                        background: "#ffffff",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                      }}
                    >
                      {MENU_ICONS.map((icon) => (
                        <div
                          key={icon.name}
                          className={`icon-option ${formData.icon === icon.name && !formData.customIcon ? "active" : ""}`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              icon: icon.name,
                              customIcon: null,
                            }))
                          }
                          title={icon.label}
                          style={{
                            height: 38,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: (formData.icon === icon.name && !formData.customIcon) ? "#4a90e2" : "#f8fafc",
                            color: (formData.icon === icon.name && !formData.customIcon) ? "white" : "#64748b",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s",
                          }}
                        >
                          <i className={icon.name} style={{ fontSize: "16px" }}></i>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload Custom Icon */}
                  <div className="form-group-modern">
                    <label>Upload Custom File</label>
                    <div
                      className="upload-area"
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: 12,
                        padding: "16px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        background: "#f8fafc",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        <i className="fas fa-cloud-upload-alt" style={{ marginBottom: 6, display: "block", fontSize: "20px", color: "#4a90e2" }}></i>
                        <span style={{ fontWeight: "600" }}>Choose Image</span>
                        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>PNG, JPG up to 500KB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer-modern" style={{ padding: "12px 20px" }}>
              <button
                className="btn-modern-secondary"
                style={{ height: 36, padding: "0 16px", fontSize: 13 }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              {(() => {
                const isEdit = !!selectedMenu;
                const hasChanges = !isEdit || !originalData.current ||
                  formData.label !== originalData.current.label ||
                  formData.path !== originalData.current.path ||
                  formData.icon !== originalData.current.icon ||
                  formData.customIcon !== originalData.current.customIcon ||
                  formData.order !== originalData.current.order ||
                  formData.isActive !== originalData.current.isActive;
                const canSave = hasChanges && !loading;
                return (
                  <button 
                    className={`${canSave ? 'btn-modern-primary' : 'btn-modern-disabled'}`}
                    style={{ 
                      height: 36, padding: "0 16px", fontSize: 13,
                      opacity: canSave ? 1 : 0.5,
                      cursor: canSave ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={handleSave}
                    disabled={!canSave}
                  >
                    <i
                      className={selectedMenu ? "fas fa-check" : "fas fa-plus"}
                    ></i>
                    {loading ? 'Saving...' : selectedMenu ? "Save Changes" : "Add Menu"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════ */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-container-modern-alert"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-content">
              <div className="alert-icon-box danger">
                <i className="fas fa-trash-alt" style={{ fontSize: 24 }}></i>
              </div>
              <div className="alert-text">
                <h3>Delete Menu</h3>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>"{selectedMenu?.label}"</strong>? This menu will be
                  removed from the sidebar.
                </p>
              </div>
            </div>
            <div className="alert-actions" style={{ padding: "0 24px 24px" }}>
              <button
                className="btn-modern-secondary"
                style={{ height: 36, padding: "0 16px", fontSize: 13 }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-modern-danger" 
                style={{ height: 36, padding: "0 16px", fontSize: 13 }}
                onClick={confirmDelete}
              >
                <i className="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterMenu;
