import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState({ mastercard: false });
  const navigate = useNavigate();
  const location = useLocation();

  // Restore sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Update active section based on current route
  useEffect(() => {
    const path = location.pathname.split("/").pop();
    if (path) {
      setActiveSection(path);
    }
  }, [location]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const menuItems = [
    {
      id: "dashboard-admin",
      label: "Dashboard",
      path: "/admin/dashboard-admin",
      icon: (
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
      ),
    },
    {
      id: "active-session",
      label: "Active Session",
      path: "/admin/active-session",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      id: "application-management",
      label: "Application Management",
      path: "/admin/application-management",
      icon: (
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
      ),
    },
    {
      id: "user-control",
      label: "User Control",
      path: "/admin/user-control",
      icon: (
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
      ),
    },
    {
      id: "mastercard",
      label: "Mastercard",
      hasSubmenu: true,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      ),
      submenu: [
        {
          id: "master-departments",
          label: "Master Departments",
          path: "/admin/mastercard/departments",
        },
        {
          id: "master-applications",
          label: "Master Applications",
          path: "/admin/mastercard/applications",
        },
        {
          id: "master-roles",
          label: "Master Roles",
          path: "/admin/mastercard/roles",
        },
        {
          id: "master-positions",
          label: "Master Positions",
          path: "/admin/mastercard/positions",
        },
      ],
    },
    {
      id: "broadcast",
      label: "Broadcast Message",
      path: "/admin/broadcast",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
  ];

  const handleNavigation = (item) => {
    if (item.hasSubmenu) {
      // Toggle submenu expansion
      setExpandedMenus((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    } else {
      // Navigate to page
      setActiveSection(item.id);
      navigate(item.path);
    }
  };

  const handleSubmenuNavigation = (item, submenuItem) => {
    setActiveSection(submenuItem.id);
    navigate(submenuItem.path);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "RS";
    const names = name.split(" ");
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const user = JSON.parse(
    localStorage.getItem("user") ||
      '{"name":"RIZKY SETYO","role":"ADMIN USER"}',
  );

  return (
    <aside className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="logo-section">
        <div className="logo">
          <img
            src="/assets/logo somagede black.png"
            alt="Somagede Logo"
            className="logo-full"
          />
          <img
            src="/assets/logo somagede only.png"
            alt="Somagede"
            className="logo-icon"
          />
        </div>
      </div>

      <div className="sidebar-header">
        <div className="sidebar-title">ADMIN PANEL</div>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <svg
            className="icon-close"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <svg
            className="icon-open"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li key={item.id}>
            <div
              className={`nav-item ${activeSection === item.id ? "active" : ""} ${item.hasSubmenu ? "has-submenu" : ""}`}
              onClick={() => handleNavigation(item)}
              data-tooltip={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.hasSubmenu && (
                <svg
                  className={`submenu-arrow ${expandedMenus[item.id] ? "expanded" : ""}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </div>
            {item.hasSubmenu && expandedMenus[item.id] && (
              <ul className="submenu">
                {item.submenu.map((subItem) => (
                  <li
                    key={subItem.id}
                    className={`submenu-item ${activeSection === subItem.id ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmenuNavigation(item, subItem);
                    }}
                  >
                    <span>{subItem.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="user-profile">
        <div className="profile-card">
          <div className="profile-avatar">{getUserInitials(user.name)}</div>
          <div className="profile-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-role">{user.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
