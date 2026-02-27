import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState({ masterdata: false });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [isMenusLoaded, setIsMenusLoaded] = useState(false);
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

  // Fetch dynamic menus from DB
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const data = await api.get("/menus");
        if (data.success) {
          // Filter out menus that are already in the Master Data exclusion list if needed
          // or just take all active menus
          setDynamicMenus(data.data.filter((m) => m.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch sidebar menus:", error);
      } finally {
        setIsMenusLoaded(true);
      }
    };
    fetchMenus();
  }, []);

  const renderMenuIcon = (item) => {
    if (!item.icon && !item.customIcon) return null;

    // Handle custom uploaded icon (base64)
    if (item.customIcon) {
      return (
        <img
          src={item.customIcon}
          alt=""
          style={{
            width: 18,
            height: 18,
            objectFit: "contain",
            marginRight: 0,
          }}
        />
      );
    }

    // Handle Font Awesome class
    if (typeof item.icon === "string" && item.icon.startsWith("fas")) {
      return <i className={item.icon} style={{ fontSize: 18 }}></i>;
    }

    // Fallback to SVG (legacy/static)
    return item.icon;
  };

  const getMenuItems = () => {
    if (!isMenusLoaded) {
      return []; // Or some default skeleton
    }

    // Construct final list by mapping dynamic menus and attaching submenus to Master Data
    return dynamicMenus.map((menu) => {
      // If this is the Master Data entry (by path), attach the submenu
      if (menu.path === "/admin/masterdata") {
        return {
          ...menu,
          hasSubmenu: true,
          submenu: [
            {
              id: "master-departments",
              label: "Master Departments",
              path: "/admin/masterdata/departments",
            },
            {
              id: "master-applications",
              label: "Master Applications",
              path: "/admin/masterdata/applications",
            },
            {
              id: "master-roles",
              label: "Master Roles",
              path: "/admin/masterdata/roles",
            },
            {
              id: "master-positions",
              label: "Master Positions",
              path: "/admin/masterdata/positions",
            },
            {
              id: "master-menu",
              label: "Master Menu",
              path: "/admin/masterdata/menu",
            },
          ],
        };
      }
      return menu;
    });
  };

  const menuItems = getMenuItems();

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
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    // Simulate logout process (untuk animasi)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Delete active session
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser?.id) {
        await api.delete(`/sessions/user/${storedUser.id}`);
      }
    } catch (e) {
      console.error("Failed to cleanup session:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("adminWelcomeShown");
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getUserInitials = (name) => {
    if (!name) return "RS";
    const names = name.split(" ");
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  if (!user) return null;

  return (
    <>
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
                {renderMenuIcon(item)}
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
            <div className="profile-avatar" style={{ overflow: "hidden" }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                getUserInitials(user.name)
              )}
            </div>
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

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="logout-modal-overlay" onClick={cancelLogout}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
              <div className="logout-modal-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <h3>Logout Confirmation</h3>
              <p>Are you sure you want to logout from admin panel?</p>
              <div className="logout-modal-buttons">
                <button
                  className="logout-btn-cancel"
                  onClick={cancelLogout}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  className="logout-btn-confirm"
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Page Loading Overlay */}
        {isLoggingOut && (
          <div className="loading-overlay">
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Logging out...</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;
