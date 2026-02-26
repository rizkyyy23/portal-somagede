import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const savedEmail = localStorage.getItem("rememberedEmail") || "";
    return {
      email: savedEmail,
      password: "",
      rememberMe: !!savedEmail,
    };
  });
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailInput = formData.email.trim().toLowerCase();
    try {
      // Lookup user from database with password verification
      const result = await api.post("/users/login", {
        email: emailInput,
        password: formData.password,
      });

      if (!result.success) {
        setError(result.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      const userData = result.data;
      if (!userData) {
        setError("Account not found. Please contact your administrator.");
        setIsLoading(false);
        return;
      }

      // Store auth token if backend provides one
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }

      // Determine user type based on role from backend
      const userRole = userData.role?.toLowerCase();
      const userType = userRole === "admin" ? "admin" : "user";

      // Handle Remember Me persistence
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", userData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Store user data
      localStorage.setItem("userType", userType);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userData.id,
          name: userData.name,
          role: userData.role?.toUpperCase() || (userType === "admin" ? "ADMIN" : "USER"),
          department: userData.department,
          position: userData.position,
          avatar: userData.avatar || null,
        }),
      );

      // Create active session
      try {
        await api.post("/sessions", {
          user_id: userData.id || null,
          user_name: userData.name,
          user_email: userData.email,
          department: userData.department,
          role: userData.role || (isAdmin ? "Admin" : "User"),
          ip_address: "0.0.0.0",
          app_name: "Portal",
        });
      } catch (sessionError) {
        console.error("Session creation failed:", sessionError);
      }

      // Navigate ALL users to the main dashboard
      // Admins can access the Admin Panel from the dashboard profile dropdown
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMicrosoftLogin = () => {
    // TODO: Implement Microsoft Teams 365 OAuth
    // After successful auth, redirect to /dashboard
  };

  return (
    <div className="login-page">
      <div className="container">
        {/* Left Side */}
        <div className="left-side">
          <div className="left-content">
            <div className="left-logo">
              <img src="/assets/logo somagede white.png" alt="Logo Somagede" />
            </div>

            <div className="left-title">
              Indonesia's #1 Cutting
              <br />
              Tools & Adhesive Supplier
            </div>

            <div className="left-description">
              The heartbeat of heavy equipment manufacturing. Access the
              <br />
              internal logistics and production portal.
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="right-side">
          <div className="login-container">
            <div className="top-logo">
              <img src="/assets/logo somagede black.png" alt="Somagede Logo" />
            </div>

            <div className="login-header">
              <h1>Employee Login</h1>
              <p>
                Welcome back. Please enter your credentials to access the
                production floor systems.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    color: "#dc2626",
                    fontSize: "13px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Employee ID or Email</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="username@somagede.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your security key"
                    required
                  />
                  <span
                    className="eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={
                        showPassword ? "fas fa-eye" : "fas fa-eye-slash"
                      }
                    ></i>
                  </span>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember Me</span>
                </label>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                Login
              </button>

              <div className="divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="google-button"
                onClick={handleMicrosoftLogin}
                disabled
                title="Coming Soon"
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                <svg
                  className="google-icon"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="10.5" height="10.5" fill="#F25022" />
                  <rect x="12" width="10.5" height="10.5" fill="#7FBA00" />
                  <rect y="12" width="10.5" height="10.5" fill="#00A4EF" />
                  <rect
                    x="12"
                    y="12"
                    width="10.5"
                    height="10.5"
                    fill="#FFB900"
                  />
                </svg>
                Sign in with Microsoft
                <span
                  style={{
                    fontSize: "10px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  SOON
                </span>
              </button>
            </form>

            <div className="support-link">
              <i className="fas fa-question-circle support-icon"></i>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Logging in...</p>
          </div>
        </div>
      )}
    </div>
  );
}
