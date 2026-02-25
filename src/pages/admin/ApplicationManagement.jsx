import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../utils/api";
import "../../styles/ApplicationManagement.css";

const ApplicationManagement = () => {
  const [expandedDept, setExpandedDept] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [departments, setDepartments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingToggle, setPendingToggle] = useState(null); // { deptId, appCode, appName, deptName, newValue }
  const { showToast } = useToast();

  // Icon mapping for departments (Font Awesome icons)
  const departmentIcons = {
    SALES: "fas fa-briefcase",
    HEAD_BRANCH: "fas fa-building",
    PROD_MGR: "fas fa-boxes",
    MKT: "fas fa-bullhorn",
    SALES_ADMIN: "fas fa-clipboard-list",
    TECH_SUP: "fas fa-tools",
    WH: "fas fa-warehouse",
    LOG: "fas fa-truck",
    PURCH: "fas fa-shopping-cart",
    IMPORT: "fas fa-file-import",
    GA: "fas fa-landmark",
    HR: "fas fa-users",
    IT: "fas fa-laptop-code",
    LEGAL: "fas fa-balance-scale",
    ACC: "fas fa-chart-line",
    TAX: "fas fa-dollar-sign",
    MGMT: "fas fa-chart-bar",
    HSE: "fas fa-shield-alt",
    DIR: "fas fa-user-tie",
    SEC: "fas fa-file-signature",
    FIN: "fas fa-money-bill-wave",
    INTL_REL: "fas fa-globe",
  };

  // Fetch departments, applications, and permissions from API
  useEffect(() => {
    fetchDepartmentsAndPermissions();
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await api.get("/applications");
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchDepartmentsAndPermissions = async () => {
    setLoading(true);
    try {
      // Fetch departments
      const deptData = await api.get("/departments");

      if (deptData.success) {
        // Sort departments by ID for consistent ordering
        const sortedDepts = deptData.data.sort((a, b) => a.id - b.id);
        setDepartments(sortedDepts);
      }

      // Fetch permissions from department_permissions table
      const permData = await api.get("/departments/permissions");

      if (permData.success) {
        // Convert to state format {deptId: {appId: boolean}}
        const permissionMap = {};
        permData.data.forEach((dept) => {
          permissionMap[dept.id] = {};
          dept.permissions.forEach((perm) => {
            permissionMap[dept.id][perm.application_code] = perm.enabled;
          });
        });
        setPermissions(permissionMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId) => {
    setExpandedDept(expandedDept === deptId ? null : deptId);
  };

  const togglePermission = async (deptId, appCode) => {
    const newValue = !permissions[deptId]?.[appCode];
    const app = applications.find((a) => a.code === appCode);
    const dept = departments.find((d) => d.id === deptId);
    setPendingToggle({
      deptId,
      appCode,
      appName: app?.name || appCode,
      deptName: dept?.name || "Department",
      newValue,
    });
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const { deptId, appCode, appName, deptName, newValue } = pendingToggle;

    // Optimistically update UI
    const oldPermissions = { ...permissions };
    const newPermissions = {
      ...permissions,
      [deptId]: {
        ...permissions[deptId],
        [appCode]: newValue,
      },
    };
    setPermissions(newPermissions);
    setPendingToggle(null);

    // Save to database
    try {
      const data = await api.patch(
        `/departments/${deptId}/permissions/${appCode}`,
        { enabled: newValue },
      );
      if (data.success !== false) {
        showToast(
          `${appName} ${newValue ? "enabled" : "disabled"} for ${deptName}`,
          "success",
        );
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      setPermissions(oldPermissions);
      showToast(`Failed to update ${appName} permission`, "error");
    }
  };

  const isPermissionEnabled = (deptId, appCode) => {
    return permissions[deptId]?.[appCode] || false;
  };

  const isAppActive = (appCode) => {
    const app = applications.find((a) => a.code === appCode);
    return app?.status === "active";
  };

  if (loading) {
    return (
      <div className="app-management-section">
        <div className="app-management-loading">
          <div className="loading-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          </div>
          <p className="loading-text">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-management-section">
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
        <h2>Application Management</h2>
      </div>

      <p className="privilege-subtitle">
        Control application access for each department. Toggle permissions per
        application.
      </p>

      <div className="department-accordion">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`department-item ${expandedDept === dept.id ? "expanded" : ""}`}
          >
            <div
              className="department-header"
              onClick={() => toggleDepartment(dept.id)}
            >
              <div
                className="department-icon"
                style={{
                  background: `${dept.color || "#95a5a6"}20`,
                  color: dept.color || "#95a5a6",
                }}
              >
                <i className={departmentIcons[dept.code] || "fas fa-folder"} />
              </div>
              <div className="department-info">
                <div className="department-name">{dept.name}</div>
                <div className="department-meta">
                  {
                    applications.filter((app) =>
                      isPermissionEnabled(dept.id, app.code),
                    ).length
                  }{" "}
                  of {applications.length} applications enabled
                </div>
              </div>
              <svg
                className="expand-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {expandedDept === dept.id && (
              <div className="department-content">
                <div className="app-grid">
                  {applications.map((app) => {
                    const isActive = isAppActive(app.code);
                    const isEnabled = isPermissionEnabled(dept.id, app.code);

                    return (
                      <div
                        key={app.id}
                        className={`app-card ${!isActive ? "app-inactive" : ""}`}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: 1,
                          }}
                        >
                          <div className="app-logo-container">
                            {app.icon && app.icon.trim() !== "" ? (
                              <img
                                src={app.icon}
                                alt={app.name}
                                className="app-logo"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback =
                                    e.target.parentElement.querySelector(
                                      ".app-logo-fallback",
                                    );
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : (
                              <div className="app-logo-fallback">
                                {app.name.charAt(0)}
                              </div>
                            )}
                            {app.icon && app.icon.trim() !== "" && (
                              <div
                                className="app-logo-fallback"
                                style={{ display: "none" }}
                              >
                                {app.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="app-info">
                            <div className="app-name-wrapper">
                              <span className="app-name">{app.name}</span>
                              {!isActive && (
                                <span className="inactive-badge">
                                  <i className="fas fa-times-circle"></i>
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <label className="toggle-switch-app">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => togglePermission(dept.id, app.code)}
                            disabled={!isActive}
                          />
                          <span className="slider-app"></span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toggle Confirmation Modal */}
      {pendingToggle && (
        <div
          className="confirm-dialog-overlay"
          onClick={() => setPendingToggle(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body">
              <div
                className={`confirm-dialog-icon ${pendingToggle.newValue ? "info" : "warning"}`}
              >
                {pendingToggle.newValue ? (
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
              <h3>
                {pendingToggle.newValue ? "Enable" : "Disable"} Application?
              </h3>
              <p>
                {pendingToggle.newValue ? (
                  <>
                    Enable <strong>{pendingToggle.appName}</strong> for{" "}
                    <strong>{pendingToggle.deptName}</strong>?
                  </>
                ) : (
                  <>
                    Disable <strong>{pendingToggle.appName}</strong> for{" "}
                    <strong>{pendingToggle.deptName}</strong>? Users in this
                    department will lose access.
                  </>
                )}
              </p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                className="cd-btn cd-btn-cancel"
                onClick={() => setPendingToggle(null)}
              >
                Cancel
              </button>
              <button
                className={`cd-btn ${pendingToggle.newValue ? "cd-btn-primary" : "cd-btn-warning"}`}
                onClick={confirmToggle}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {pendingToggle.newValue ? (
                    <polyline points="20 6 9 17 4 12"></polyline>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </>
                  )}
                </svg>
                {pendingToggle.newValue ? "Enable" : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;
