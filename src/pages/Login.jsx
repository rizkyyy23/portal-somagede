import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const API_URL = "/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailInput = formData.email.trim().toLowerCase();
    const isAdmin = emailInput.endsWith("@admin.somagede.com");

    try {
      // Lookup user from database with password verification
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        setError(result.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      let userData;
      if (result.success && result.found) {
        // User found in database
        userData = result.data;
      } else {
        setError("Account not found. Please contact your administrator.");
        setIsLoading(false);
        return;
      }

      // Determine user type based on role
      const userType = userData.role === "Admin" || isAdmin ? "admin" : "user";

      // Store user data
      localStorage.setItem("userType", userType);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userData.id,
          name: userData.name,
          role: userData.role?.toUpperCase() || (isAdmin ? "ADMIN" : "USER"),
          department: userData.department,
          position: userData.position,
        }),
      );

      // Create active session
      try {
        await fetch(`${API_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userData.id || null,
            user_name: userData.name,
            user_email: userData.email,
            department: userData.department,
            role: userData.role || (isAdmin ? "Admin" : "User"),
            ip_address: "0.0.0.0",
            app_name: "Portal",
          }),
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
    console.log("Microsoft Teams 365 login clicked");
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
                  >
                    <i
                      className={`fas fa-eye${showPassword ? "-slash" : ""}`}
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
