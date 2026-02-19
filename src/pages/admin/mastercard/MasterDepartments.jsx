import { useState, useEffect } from "react";
import { useToast } from "../../../contexts/ToastContext";
import "../../../styles/admin-dashboard.css";

const API_URL = "http://localhost:3001/api";

// 22 unique colors for departments
const DEPARTMENT_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#f1c40f",
  "#d35400",
  "#c0392b",
  "#7f8c8d",
  "#2c3e50",
  "#e91e63",
  "#00bcd4",
  "#4caf50",
  "#ff9800",
  "#795548",
];

// Mapping from database icon names (Lucide) to Font Awesome classes
const ICON_MAP = {
  Banknote: "fas fa-money-bill-wave",
  Users: "fas fa-users",
  Package: "fas fa-box",
  Monitor: "fas fa-desktop",
  Megaphone: "fas fa-bullhorn",
  TrendingUp: "fas fa-chart-line",
  Building: "fas fa-building",
  Box: "fas fa-box",
  ClipboardList: "fas fa-clipboard-list",
  Wrench: "fas fa-wrench",
  Truck: "fas fa-truck",
  ShoppingCart: "fas fa-shopping-cart",
  Download: "fas fa-download",
  Landmark: "fas fa-landmark",
  Scale: "fas fa-balance-scale",
  BarChart: "fas fa-chart-bar",
  DollarSign: "fas fa-dollar-sign",
  LineChart: "fas fa-chart-line",
  Shield: "fas fa-shield-alt",
  UserCheck: "fas fa-user-check",
  FileText: "fas fa-file-alt",
  Globe: "fas fa-globe",
  briefcase: "fas fa-briefcase",
  users: "fas fa-users",
  box: "fas fa-box",
  "laptop-code": "fas fa-laptop-code",
  bullhorn: "fas fa-bullhorn",
  "money-bill": "fas fa-money-bill-wave",
  tools: "fas fa-tools",
  industry: "fas fa-industry",
  "shield-alt": "fas fa-shield-alt",
  "balance-scale": "fas fa-balance-scale",
  "chart-line": "fas fa-chart-line",
  "shopping-cart": "fas fa-shopping-cart",
  clipboard: "fas fa-clipboard",
  "graduation-cap": "fas fa-graduation-cap",
  heartbeat: "fas fa-heartbeat",
  building: "fas fa-building",
  "dollar-sign": "fas fa-dollar-sign",
  landmark: "fas fa-landmark",
};

// Relevant icons for departments (Font Awesome)
const DEPARTMENT_ICONS = [
  { name: "briefcase", label: "Briefcase", class: "fas fa-briefcase" },
  { name: "users", label: "Users/HR", class: "fas fa-users" },
  { name: "box", label: "Package/Warehouse", class: "fas fa-box" },
  { name: "laptop-code", label: "IT/Tech", class: "fas fa-laptop-code" },
  { name: "bullhorn", label: "Marketing", class: "fas fa-bullhorn" },
  { name: "money-bill", label: "Finance", class: "fas fa-money-bill-wave" },
  { name: "tools", label: "Engineering", class: "fas fa-tools" },
  { name: "industry", label: "Production", class: "fas fa-industry" },
  { name: "shield-alt", label: "Security", class: "fas fa-shield-alt" },
  { name: "balance-scale", label: "Legal", class: "fas fa-balance-scale" },
  { name: "chart-line", label: "Sales", class: "fas fa-chart-line" },
  {
    name: "shopping-cart",
    label: "Procurement",
    class: "fas fa-shopping-cart",
  },
  { name: "clipboard", label: "Admin", class: "fas fa-clipboard" },
  { name: "graduation-cap", label: "Training", class: "fas fa-graduation-cap" },
  { name: "heartbeat", label: "Health/Safety", class: "fas fa-heartbeat" },
  { name: "building", label: "Office", class: "fas fa-building" },
  { name: "dollar-sign", label: "Accounting", class: "fas fa-dollar-sign" },
  { name: "landmark", label: "Corporate", class: "fas fa-landmark" },
];

const MasterDepartments = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [iconMode, setIconMode] = useState("picker"); // "picker" or "upload"
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    icon: "",
    color: "#3498db",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/departments`);
      const data = await response.json();
      if (data.success) {
        // Sort by ID (1-22)
        const sortedData = data.data.sort((a, b) => a.id - b.id);
        setDepartments(sortedData);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      showToast("Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      icon: "briefcase",
      color: "", // No default color - admin must choose
    });
    setIconMode("picker");
    setIconFile(null);
    setIconPreview(null);
    setShowModal(true);
  };

  const handleEdit = (dept) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      icon: dept.icon || "briefcase",
      color: dept.color || "",
    });
    setIconMode("picker");
    setIconFile(null);
    setIconPreview(null);
    setShowModal(true);
  };

  const handleDelete = (dept) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showToast("Name and code are required", "error");
      return;
    }

    if (!formData.color) {
      showToast("Please select a color from the palette", "error");
      return;
    }

    setLoading(true);
    try {
      const method = selectedDepartment ? "PUT" : "POST";
      const endpoint = selectedDepartment
        ? `${API_URL}/departments/${selectedDepartment.id}`
        : `${API_URL}/departments`;

      let requestData;

      // If uploading icon file
      if (iconMode === "upload" && iconFile) {
        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("code", formData.code);
        formDataObj.append("description", formData.description);
        formDataObj.append("icon", iconFile);
        formDataObj.append("color", formData.color);

        const response = await fetch(endpoint, {
          method,
          body: formDataObj,
        });
        const data = await response.json();

        if (data.success) {
          showToast(data.message || "Department saved successfully", "success");
          setShowModal(false);
          fetchDepartments();
        } else {
          showToast(data.message || "Failed to save department", "error");
        }
      } else {
        // Using icon picker
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          showToast(data.message || "Department saved successfully", "success");
          setShowModal(false);
          fetchDepartments();
        } else {
          showToast(data.message || "Failed to save department", "error");
        }
      }
    } catch (error) {
      console.error("Error saving department:", error);
      showToast("Failed to save department", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/departments/${selectedDepartment.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message || "Department deleted successfully", "success");
        setShowDeleteModal(false);
        fetchDepartments();
      } else {
        showToast(data.message || "Failed to delete department", "error");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      showToast("Failed to delete department", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments
    .filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.id - b.id); // Always sort by ID

  return (
    <div className="mastercard-wrapper">
      <div className="section-header">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        <h2>Master Departments</h2>
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
            placeholder="Search departments..."
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
          Add Department
        </button>
      </div>

      {loading && departments.length === 0 ? (
        <div className="empty-state">Loading departments...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>ID</th>
                <th style={{ width: "60px" }}>Icon</th>
                <th>Department Name</th>
                <th style={{ width: "80px" }}>Color</th>
                <th style={{ width: "120px" }}>Code</th>
                <th>Description</th>
                <th style={{ width: "150px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {searchQuery
                      ? "No departments found"
                      : "No departments available"}
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.id}</td>
                    <td>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          color: "#333",
                        }}
                      >
                        {dept.icon_type === "upload" && dept.icon ? (
                          <img
                            src={dept.icon}
                            alt={dept.name}
                            style={{
                              width: "24px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                        ) : dept.icon && ICON_MAP[dept.icon] ? (
                          <i className={ICON_MAP[dept.icon]} />
                        ) : dept.icon ? (
                          <i className={`fas fa-${dept.icon.toLowerCase()}`} />
                        ) : (
                          dept.name.charAt(0)
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: "500" }}>{dept.name}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: dept.color || "#95a5a6",
                            borderRadius: "6px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {dept.color}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="code-badge">{dept.code}</span>
                    </td>
                    <td style={{ color: "#666", fontSize: "13px" }}>
                      {dept.description || "-"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(dept)}
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
                          onClick={() => handleDelete(dept)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedDepartment ? "Edit Department" : "Add New Department"}
              </h3>
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
                <label>Department Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Department Code *</label>
                <input
                  type="text"
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
                <label>Department Icon *</label>

                {/* Icon Mode Toggle */}
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                >
                  <button
                    type="button"
                    onClick={() => setIconMode("picker")}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      border:
                        iconMode === "picker"
                          ? "2px solid #3498db"
                          : "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: iconMode === "picker" ? "#e3f2fd" : "white",
                      color: iconMode === "picker" ? "#3498db" : "#666",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Choose Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconMode("upload")}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      border:
                        iconMode === "upload"
                          ? "2px solid #3498db"
                          : "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: iconMode === "upload" ? "#e3f2fd" : "white",
                      color: iconMode === "upload" ? "#3498db" : "#666",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Upload Icon
                  </button>
                </div>

                {/* Icon Picker Mode */}
                {iconMode === "picker" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: "#fafafa",
                    }}
                  >
                    {DEPARTMENT_ICONS.map((icon) => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, icon: icon.name })
                        }
                        title={icon.label}
                        style={{
                          padding: "12px",
                          border:
                            formData.icon === icon.name
                              ? "2px solid #3498db"
                              : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          background:
                            formData.icon === icon.name ? "#e3f2fd" : "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          transition: "all 0.2s",
                          color:
                            formData.icon === icon.name ? "#3498db" : "#333",
                        }}
                      >
                        <i className={icon.class} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Upload Mode */}
                {iconMode === "upload" && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                      id="icon-upload-dept"
                      style={{ display: "none" }}
                    />
                    <div
                      onClick={() =>
                        document.getElementById("icon-upload-dept").click()
                      }
                      style={{
                        border: "2px dashed #cbd5e0",
                        borderRadius: "8px",
                        padding: "20px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#f8f9fa",
                      }}
                    >
                      {iconPreview ? (
                        <div>
                          <img
                            src={iconPreview}
                            alt="Icon preview"
                            style={{
                              width: "64px",
                              height: "64px",
                              objectFit: "contain",
                              marginBottom: "8px",
                            }}
                          />
                          <p style={{ fontSize: "12px", color: "#666" }}>
                            Click to change icon
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontSize: "32px",
                              marginBottom: "8px",
                              display: "flex",
                              justifyContent: "center",
                              color: "#94a3b8",
                            }}
                          >
                            <svg
                              width="48"
                              height="48"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#666",
                              margin: 0,
                            }}
                          >
                            Click to upload icon
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#999",
                              marginTop: "4px",
                            }}
                          >
                            PNG, JPG, SVG (max 2MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-form-group">
                <label>Department Color *</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                    }}
                  >
                    <label
                      htmlFor="color-picker"
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "3px solid #e0e0e0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,0,0,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.1)";
                      }}
                    >
                      <input
                        type="color"
                        id="color-picker"
                        value={formData.color || "#3498db"}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                    </label>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        Selected Color:
                      </div>
                      <input
                        type="text"
                        value={formData.color || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                            setFormData({ ...formData, color: value });
                          }
                        }}
                        placeholder="#1c40f"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontFamily: "monospace",
                          fontWeight: "600",
                          color: "#333",
                          background: "white",
                          textTransform: "uppercase",
                        }}
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          marginTop: "6px",
                        }}
                      >
                        Click the color box or enter hex code
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Department description (optional)"
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
                {loading ? "Saving..." : "Save Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedDepartment && (
        <div
          className="modal-overlay confirmation-modal"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirmation-icon warning">
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
              <h3>Delete Department?</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedDepartment.name}</strong>? This action cannot
                be undone and may affect users and permissions associated with
                this department.
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
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                {loading ? "Deleting..." : "Delete Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDepartments;
