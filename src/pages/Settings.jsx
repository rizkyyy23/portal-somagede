import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import "../styles/profile.css";

export default function Settings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
    darkMode: false,
    language: "en",
  });

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleSettingChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    showToast("Settings saved successfully!", "success");
  };

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src="/assets/logo somagede black.png"
            alt="Logo"
            className="navbar-logo"
          />
        </div>
        <div className="navbar-right">
          <span className="user-email">
            {localStorage.getItem("userEmail")}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="profile-container">
        <div className="profile-header">
          <h1>Settings</h1>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <h2>Notification Settings</h2>
            <div className="settings-item">
              <label className="settings-label">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleSettingChange}
                />
                <span>Email Notifications</span>
              </label>
              <p className="settings-description">
                Receive email notifications for important updates
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>Security Settings</h2>
            <div className="settings-item">
              <label className="settings-label">
                <input
                  type="checkbox"
                  name="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onChange={handleSettingChange}
                />
                <span>Two-Factor Authentication</span>
              </label>
              <p className="settings-description">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>Display Settings</h2>
            <div className="settings-item">
              <label className="settings-label">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleSettingChange}
                />
                <span>Dark Mode</span>
              </label>
              <p className="settings-description">
                Use dark theme for the interface
              </p>
            </div>

            <div className="settings-item">
              <label>Language</label>
              <select
                name="language"
                value={settings.language}
                onChange={handleSettingChange}
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="zh">中文</option>
              </select>
              <p className="settings-description">
                Choose your preferred language
              </p>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn-save" onClick={handleSaveSettings}>
              <i className="fas fa-check"></i> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
