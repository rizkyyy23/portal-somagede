import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { logger } from "../utils/logger";
import "../styles/reset-password.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) {
      setTokenInvalid(true);
    }
  }, [token]);

  // Password validation
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabels = [
    "",
    "Sangat Lemah",
    "Lemah",
    "Cukup",
    "Kuat",
    "Sangat Kuat",
  ];
  const strengthColors = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#16a34a",
  ];
  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }

    if (passwordStrength < 3) {
      setError(
        "Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, angka, dan simbol.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        // Handle specific error cases
        if (
          result.message?.includes("expired") ||
          result.message?.includes("kadaluarsa")
        ) {
          setError(
            "Link reset password sudah kadaluarsa. Silakan minta link baru.",
          );
          setTokenInvalid(true);
        } else if (
          result.message?.includes("invalid") ||
          result.message?.includes("tidak valid")
        ) {
          setError("Link reset password tidak valid.");
          setTokenInvalid(true);
        } else {
          setError(
            result.message || "Gagal mereset password. Silakan coba lagi.",
          );
        }
      }
    } catch (err) {
      logger.error("Reset password error:", err);
      setError("Terjadi kesalahan pada server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          {/* Logo */}
          <div className="reset-password-logo">
            <img src="/assets/logo somagede black.png" alt="Somagede Logo" />
          </div>

          {/* Invalid Token State */}
          {tokenInvalid && !success ? (
            <div className="reset-status">
              <div className="reset-status-icon error">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h2>Link Tidak Valid</h2>
              <p>
                {error ||
                  "Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru melalui halaman login."}
              </p>
              <button
                className="reset-btn-primary"
                onClick={() => navigate("/login")}
              >
                Kembali ke Login
              </button>
            </div>
          ) : success ? (
            /* Success State */
            <div className="reset-status">
              <div className="reset-status-icon success">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2>Password Berhasil Direset!</h2>
              <p>
                Password Anda telah diperbarui. Silakan login dengan password
                baru Anda. Semua sesi aktif Anda telah dihapus untuk keamanan.
              </p>
              <button
                className="reset-btn-primary"
                onClick={() => navigate("/login")}
              >
                Login Sekarang
              </button>
            </div>
          ) : (
            /* Reset Form */
            <>
              <div className="reset-password-header">
                <h1>Reset Password</h1>
                <p>Masukkan password baru untuk akun Anda.</p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="reset-error">
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
                    {error}
                  </div>
                )}

                <div className="reset-form-group">
                  <label htmlFor="new-password">Password Baru</label>
                  <div className="reset-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                      autoFocus
                    />
                    <span
                      className="reset-eye-icon"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <i
                        className={
                          showNewPassword ? "fas fa-eye" : "fas fa-eye-slash"
                        }
                      ></i>
                    </span>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`strength-segment ${passwordStrength >= level ? "active" : ""}`}
                            style={{
                              backgroundColor:
                                passwordStrength >= level
                                  ? strengthColors[passwordStrength]
                                  : "#e5e7eb",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="password-strength-label"
                        style={{ color: strengthColors[passwordStrength] }}
                      >
                        {strengthLabels[passwordStrength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="reset-form-group">
                  <label htmlFor="confirm-password">Konfirmasi Password</label>
                  <div className="reset-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      required
                    />
                    <span
                      className="reset-eye-icon"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <i
                        className={
                          showConfirmPassword
                            ? "fas fa-eye"
                            : "fas fa-eye-slash"
                        }
                      ></i>
                    </span>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <div
                      className={`password-match ${newPassword === confirmPassword ? "match" : "no-match"}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {newPassword === confirmPassword ? (
                          <polyline points="20 6 9 17 4 12"></polyline>
                        ) : (
                          <>
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </>
                        )}
                      </svg>
                      <span>
                        {newPassword === confirmPassword
                          ? "Password cocok"
                          : "Password tidak cocok"}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="reset-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="reset-spinner"></span>
                      Memproses...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="reset-back-link">
                  <button type="button" onClick={() => navigate("/login")}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Kembali ke Login
                  </button>
                </div>
              </form>

              <div className="reset-password-tips">
                <h4>Tips Password Aman:</h4>
                <ul>
                  <li>Minimal 8 karakter</li>
                  <li>Kombinasi huruf besar dan kecil</li>
                  <li>Sertakan angka dan simbol</li>
                  <li>Jangan gunakan informasi pribadi</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
