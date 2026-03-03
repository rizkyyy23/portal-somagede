import React from "react";
import { useMsal } from "@azure/msal-react";

export default function MicrosoftLoginButton({ onLoginSuccess, disabled }) {
  const { instance } = useMsal();

  const handleLogin = async () => {
    if (disabled) return;
    try {
      const loginResponse = await instance.loginPopup();
      if (onLoginSuccess) {
        onLoginSuccess(loginResponse);
      }
    } catch (err) {
      if (err.errorCode === "interaction_in_progress") {
        // Bersihkan state MSAL dengan reload halaman
        window.location.reload();
        return;
      }
      alert("Login Microsoft gagal: " + err.message);
    }
  };

  return (
    <button
      type="button"
      className="microsoft-button"
      onClick={handleLogin}
      disabled={disabled}
    >
      <span style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 23 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="10.5" height="10.5" fill="#F25022" />
          <rect x="12" width="10.5" height="10.5" fill="#7FBA00" />
          <rect y="12" width="10.5" height="10.5" fill="#00A4EF" />
          <rect x="12" y="12" width="10.5" height="10.5" fill="#FFB900" />
        </svg>
      </span>
      <span>Login dengan Microsoft 365</span>
    </button>
  );
}
