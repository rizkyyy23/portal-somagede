/**
 * Request SSO URL dari backend untuk aplikasi tertentu.
 * @param {string} appName Nama aplikasi (misal: "SGI+")
 * @returns {Promise<string>} URL tujuan SSO (misal: https://sgi+.domain.com/sso-login?token=xxxx)
 *
 * Ganti endpoint '/api/sso/:appName' sesuai dengan endpoint backend yang akan disediakan.
 */
export const getSsoUrl = async (appName) => {
  // TODO: Ganti endpoint di bawah ini jika backend sudah siap
  const endpoint = `/sso/${encodeURIComponent(appName)}`;
  const response = await apiClient(endpoint, { method: "GET" });
  // Asumsikan backend mengembalikan { url: "https://sgi+.domain.com/sso-login?token=xxxx" }
  if (!response || !response.url) throw new Error("SSO URL tidak ditemukan");
  return response.url;
};
/**
 * Centralized API Client for Portal Somagede
 *
 * - Autentikasi via httpOnly cookie (session-based, dikirim otomatis oleh browser)
 * - Otomatis handle response.ok check
 * - Handle 401 (auto redirect ke login)
 * - Support FormData (file upload) dan JSON
 */

export const API_URL = "/api";
import { logger } from "./logger";

/**
 * Wrapper untuk fetch API yang sudah include cookie credentials & error handling.
 *
 * @param {string} endpoint - Path endpoint (contoh: "/users" atau "/users/1")
 * @param {object} options - Fetch options (method, body, headers, dll)
 * @returns {Promise<object>} Parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  // Build headers — jangan set Content-Type jika body adalah FormData
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  // credentials: "include" supaya browser otomatis kirim httpOnly cookie
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle 401 Unauthorized — session expired, idle timeout, atau force logout
  if (response.status === 401) {
    // Jangan redirect jika sedang di halaman login
    const isLoginEndpoint = endpoint.includes("/login");
    if (!isLoginEndpoint) {
      // Coba baca reason dari response body backend
      let reason = "session_timeout";
      try {
        const errBody = await response.clone().json();
        // Backend bisa kirim: { message: "force_logout" | "idle_timeout" | "session_expired" }
        if (
          errBody.message?.includes("force") ||
          errBody.message?.includes("not found")
        ) {
          reason = "force_logout";
        } else if (errBody.message?.includes("idle")) {
          reason = "idle_timeout";
        }
      } catch (_) {
        // Tidak bisa parse body — gunakan default reason
      }

      // Dispatch event so SessionExpiredOverlay can show the modal
      window.dispatchEvent(
        new CustomEvent("session-expired", {
          detail: { reason },
        }),
      );
      throw new Error("Session expired. Please login again.");
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    // Coba parse error message dari backend
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`HTTP Error ${response.status}`);
    }
    // Return error data agar component bisa handle message-nya
    return { success: false, ...errorData };
  }

  return response.json();
};

/**
 * Shorthand helpers untuk HTTP methods
 */
export const api = {
  /**
   * Update active app name for current user's session.
   * Call when user opens an app (appName = "SGI+") or returns to portal (appName = "-").
   */
  updateActiveApp: async (appName) => {
    try {
      await apiClient("/sessions/update-app", {
        method: "PUT",
        body: JSON.stringify({
          app_name: appName || "-",
        }),
      });
    } catch (err) {
      logger.error("Failed to update active app:", err);
    }
  },

  get: (endpoint) => apiClient(endpoint),

  post: (endpoint, body) =>
    apiClient(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    apiClient(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    apiClient(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    apiClient(endpoint, {
      method: "DELETE",
    }),
};
