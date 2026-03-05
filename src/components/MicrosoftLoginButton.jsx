import React from "react";
import { useMsal } from "@azure/msal-react";
import { logger } from "../utils/logger";

export default function MicrosoftLoginButton({ onLoginSuccess, disabled }) {
  const { instance, inProgress } = useMsal();

  // Bersihkan MSAL interaction state yang stuck di sessionStorage
  const clearMsalInteractionState = () => {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.includes("msal") && key.includes("interaction")) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const attemptLogin = async () => {
    const loginResponse = await instance.loginPopup();
    if (onLoginSuccess) {
      onLoginSuccess(loginResponse);
    }
  };

  const handleLogin = async () => {
    if (disabled) return;

    // Daftar error yang bisa diabaikan (user cancel, popup ditutup, timeout)
    const isIgnorableError = (error) => {
      const ignorableCodes = [
        "user_cancelled",
        "popup_closed_by_user",
        "timed_out",
        "monitor_window_timeout",
        "hash_empty_error",
      ];
      if (ignorableCodes.includes(error.errorCode)) return true;
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("user cancelled") ||
        msg.includes("popup closed") ||
        msg.includes("timed_out")
      )
        return true;
      return false;
    };

    try {
      await attemptLogin();
    } catch (err) {
      // User menutup popup / popup timeout — bersihkan state, tidak perlu alert
      if (isIgnorableError(err)) {
        // Login cancelled or timed out — silently clean up
        clearMsalInteractionState();
        return;
      }

      // Interaction masih berjalan (stuck) — bersihkan lalu retry otomatis
      if (err.errorCode === "interaction_in_progress") {
        console.warn("Interaction stuck, membersihkan state dan retry...");
        clearMsalInteractionState();
        // Tunggu sebentar agar MSAL bisa membaca ulang state
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          await attemptLogin();
        } catch (retryErr) {
          if (isIgnorableError(retryErr)) {
            // Login cancelled or timed out on retry — silently clean up
            clearMsalInteractionState();
            return;
          }
          logger.error("Retry login gagal:", retryErr);
          alert("Login Microsoft gagal: " + retryErr.message);
        }
        return;
      }

      logger.error("Login error:", err);
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
