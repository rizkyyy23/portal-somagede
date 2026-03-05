import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MicrosoftLoginButton from "../components/MicrosoftLoginButton";
import { api } from "../utils/api";
import { logger } from "../utils/logger";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

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

      // Store user data + create session
      await storeUserAndCreateSession(userData);

      // Navigate ALL users to the main dashboard
      // Admins can access the Admin Panel from the dashboard profile dropdown
      navigate("/dashboard");
    } catch (error) {
      logger.error("Login error:", error);
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

  // Open forgot password modal — pre-fill email if already typed in login form
  const openForgotModal = () => {
    setForgotEmail(formData.email || "");
    setForgotSent(false);
    setForgotError("");
    setShowForgotModal(true);
  };

  // Handle forgot password submission
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    if (!email) return;

    setForgotLoading(true);
    setForgotError("");

    try {
      await api.post("/auth/forgot-password", { email });
      // Always show success — never reveal if email exists or not (security)
      setForgotSent(true);
    } catch (err) {
      logger.error("Forgot password error:", err);
      setForgotError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Shared function to store user data and create session after successful auth
  const storeUserAndCreateSession = async (userData) => {
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
      logger.error("Session creation failed:", sessionError);
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
      logger.error("Microsoft login error:", error);
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
                <button
                  type="button"
                  className="forgot-password"
                  onClick={openForgotModal}
                >
                  Forgot Password?
                </button>
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
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="forgot-modal-overlay"
          onClick={() => setShowForgotModal(false)}
        >
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="forgot-modal-close"
              onClick={() => setShowForgotModal(false)}
            >
              &times;
            </button>

            {!forgotSent ? (
              <>
                <div className="forgot-modal-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <h2>Lupa Password?</h2>
                <p className="forgot-modal-desc">
                  Masukkan email akun Anda. Jika terdaftar, kami akan mengirim
                  link untuk reset password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  {forgotError && (
                    <div className="forgot-error">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      {forgotError}
                    </div>
                  )}

                  <div className="forgot-form-group">
                    <label htmlFor="forgot-email">Email Address</label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@somagede.com"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="forgot-spinner"></span>
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Link Reset"
                    )}
                  </button>
                </form>

                <div className="forgot-modal-info">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>
                    Karyawan internal? Gunakan{" "}
                    <strong>Login dengan Microsoft 365</strong> di halaman
                    login.
                  </span>
                </div>
              </>
            ) : (
              <div className="forgot-success">
                <div className="forgot-success-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2>Email Terkirim!</h2>
                <p className="forgot-modal-desc">
                  Jika email tersebut terdaftar di sistem kami, Anda akan
                  menerima link untuk reset password dalam beberapa menit.
                </p>
                <p className="forgot-success-note">
                  Tidak menerima email? Periksa folder spam atau hubungi Admin
                  IT.
                </p>
                <button
                  className="forgot-submit-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Kembali ke Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
