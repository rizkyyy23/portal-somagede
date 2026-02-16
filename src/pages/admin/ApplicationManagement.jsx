import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

const ApplicationManagement = () => {
  const [expandedDept, setExpandedDept] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [departments, setDepartments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch(`${API_URL}/applications`);
      const data = await response.json();
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
      const deptResponse = await fetch(`${API_URL}/departments`);
      const deptData = await deptResponse.json();

      if (deptData.success) {
        // Sort departments by ID for consistent ordering
        const sortedDepts = deptData.data.sort((a, b) => a.id - b.id);
        setDepartments(sortedDepts);
      }

      // Fetch permissions from department_permissions table
      const permResponse = await fetch(`${API_URL}/departments/permissions`);
      const permData = await permResponse.json();

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

    // Optimistically update UI
    const newPermissions = {
      ...permissions,
      [deptId]: {
        ...permissions[deptId],
        [appCode]: newValue,
      },
    };
    setPermissions(newPermissions);

    // Save to database
    try {
      // Find application ID by code
      const app = applications.find((a) => a.code === appCode);
      if (app) {
        await fetch(`${API_URL}/departments/${deptId}/permissions/${app.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: newValue }),
        });
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      // Revert on error
      setPermissions(permissions);
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
      <div
        className="app-management-section"
        style={{ textAlign: "center", padding: "60px 20px" }}
      >
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
        <h3 style={{ color: "#7f8c9a", fontSize: "16px", margin: 0 }}>
          Loading departments...
        </h3>
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
                            gap: "14px",
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

      <style>{`
        .app-management-section {
          padding: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 2px solid #e1e8ed;
        }

        .section-header svg {
          width: 30px;
          height: 30px;
          color: #4a90e2;
        }

        .section-header h2 {
          font-size: 26px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .privilege-subtitle {
          color: #7f8c9a;
          font-size: 14px;
          margin: 0 0 28px 0;
          line-height: 1.6;
        }

        .department-accordion {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .department-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .department-item.expanded {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        .department-header {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 26px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .department-header:hover {
          background: #f8f9fa;
        }

        .department-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .department-info {
          flex: 1;
        }

        .department-name {
          font-size: 17px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 6px;
        }

        .department-meta {
          font-size: 13px;
          color: #7f8c9a;
        }

        .expand-icon {
          width: 22px;
          height: 22px;
          color: #7f8c9a;
          transition: transform 0.3s ease;
        }

        .department-item.expanded .expand-icon {
          transform: rotate(180deg);
        }

        .department-content {
          border-top: 1px solid #e1e8ed;
          padding: 26px;
          background: #f8f9fa;
        }

        .app-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .app-card {
          background: white;
          border: 2px solid #e1e8ed;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.2s ease;
          min-height: 82px;
        }

        .app-card:hover {
          border-color: #4a90e2;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
          transform: translateY(-2px);
        }

        .app-card.app-inactive {
          background: #fef2f2;
          border-color: #fecaca;
          opacity: 0.85;
        }

        .app-card.app-inactive:hover {
          border-color: #f87171;
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.15);
        }

        .app-logo-container {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .app-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .app-logo-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
        }

        .app-info {
          flex: 1;
          margin: 0;
          min-width: 0;
        }

        .app-name-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .app-name {
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;
          line-height: 1.4;
        }

        .inactive-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .inactive-badge i {
          font-size: 12px;
        }

        .toggle-switch-app {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .toggle-switch-app input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch-app input:disabled + .slider-app {
          background-color: #e5e7eb;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .slider-app {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          border-radius: 13px;
          transition: 0.3s;
        }

        .slider-app:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch-app input:checked + .slider-app {
          background-color: #27ae60;
        }

        .toggle-switch-app input:checked + .slider-app:before {
          transform: translateX(22px);
        }

        .toggle-switch-app:hover .slider-app:not(:disabled) {
          opacity: 0.9;
        }

        @media (max-width: 1200px) {
          .app-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .department-header {
            padding: 16px 20px;
          }

          .department-icon {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }

          .department-name {
            font-size: 15px;
          }

          .department-content {
            padding: 20px;
          }

          .app-grid {
            grid-template-columns: 1fr;
          }

          .app-card {
            padding: 16px 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default ApplicationManagement;
