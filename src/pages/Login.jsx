import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MicrosoftLoginButton from "../components/MicrosoftLoginButton";
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

      // Handle Remember Me persistence
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", userData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Store user data + create session
      await storeUserAndCreateSession(userData);

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

  // Shared function to store user data and create session after successful auth
  const storeUserAndCreateSession = async (userData) => {
    // Store auth token
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }

    // Determine user type based on role
    const userRole = userData.role?.toLowerCase();
    const userType = userRole === "admin" ? "admin" : "user";

    // Store user data
    localStorage.setItem("userType", userType);
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: userData.id,
        name: userData.name,
        role:
          userData.role?.toUpperCase() ||
          (userType === "admin" ? "ADMIN" : "USER"),
        department: userData.department,
        position: userData.position,
        avatar: userData.avatar || null,
      }),
    );

    // Create active session — backend auto-detects IP, browser, OS, device, location
    try {
      await api.post("/sessions", {
        user_id: userData.id || null,
        user_name: userData.name,
        user_email: userData.email,
        department: userData.department,
        role: userData.role || (userType === "admin" ? "Admin" : "User"),
        app_name: "-",
      });
    } catch (sessionError) {
      console.error("Session creation failed:", sessionError);
    }
  };

  // Handle Microsoft login callback — validate with backend before navigating
  const handleMicrosoftLoginSuccess = async (loginResponse) => {
    setIsLoading(true);
    setError("");

    try {
      const account = loginResponse.account;

      // POST to backend for validation — backend checks if user is registered
      const result = await api.post("/auth/microsoft", {
        microsoft_id: account.localAccountId,
        email: account.username,
        name: account.name,
        id_token: loginResponse.idToken,
      });

      if (!result.success) {
        setError(
          result.message ||
            "Microsoft login failed. Account not registered in the system.",
        );
        setIsLoading(false);
        return;
      }

      const userData = result.data;
      if (!userData) {
        setError(
          "Account not found. Please contact your administrator to register your Microsoft account.",
        );
        setIsLoading(false);
        return;
      }

      // Store MSAL account for reference
      localStorage.setItem("msalAccount", JSON.stringify(account));

      // Store user data + create session (same as email/password login)
      await storeUserAndCreateSession(userData);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Microsoft login error:", error);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

              <MicrosoftLoginButton
                onLoginSuccess={handleMicrosoftLoginSuccess}
                disabled={isLoading}
              />
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
