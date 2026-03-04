/**
 * Centralized API Client for Portal Somagede
 *
 * - Otomatis menambahkan Authorization header jika token tersedia
 * - Otomatis handle response.ok check
 * - Handle 401 (auto redirect ke login)
 * - Support FormData (file upload) dan JSON
 */

export const API_URL = "/api";

/**
 * Wrapper untuk fetch API yang sudah include auth header & error handling.
 *
 * @param {string} endpoint - Path endpoint (contoh: "/users" atau "/users/1")
 * @param {object} options - Fetch options (method, body, headers, dll)
 * @returns {Promise<object>} Parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Build headers — jangan set Content-Type jika body adalah FormData
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized — token expired atau tidak valid
  if (response.status === 401) {
    // Jangan redirect jika sedang di halaman login
    const isLoginEndpoint = endpoint.includes("/login");
    if (!isLoginEndpoint) {
      // Dispatch event so SessionExpiredOverlay can show the modal
      window.dispatchEvent(
        new CustomEvent("session-expired", {
          detail: { reason: "session_timeout" },
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
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.id) return;
      await apiClient("/sessions/update-app", {
        method: "PUT",
        body: JSON.stringify({
          user_id: storedUser.id,
          app_name: appName || "-",
        }),
      });
    } catch (err) {
      console.error("Failed to update active app:", err);
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
