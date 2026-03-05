/**
 * Shared helper functions — Portal Somagede
 *
 * Fungsi-fungsi yang dipakai di banyak halaman dikumpulkan di sini
 * supaya tidak duplikat dan mudah di-maintain.
 */

/**
 * Ambil inisial dari nama (maks 2 huruf).
 * Contoh: "John Doe" → "JD", "Rizky" → "RI", "" → "?"
 *
 * @param {string} name
 * @param {string} fallback - Karakter default kalau nama kosong (default: "?")
 * @returns {string}
 */
export const getInitials = (name, fallback = "?") => {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generate warna background + text berdasarkan nama.
 * Selalu mengembalikan warna yang konsisten untuk nama yang sama.
 *
 * @param {string} name
 * @returns {{ bg: string, color: string }}
 */
export const getInitialsColor = (name) => {
  const palette = [
    { bg: "#e3f2fd", color: "#4a90e2" },
    { bg: "#ffebee", color: "#e74c3c" },
    { bg: "#e8f5e9", color: "#27ae60" },
    { bg: "#f3e5f5", color: "#9b59b6" },
    { bg: "#fff3e0", color: "#f39c12" },
    { bg: "#e0f7fa", color: "#00bcd4" },
    { bg: "#fce4ec", color: "#d81b60" },
    { bg: "#f1f8e9", color: "#388e3c" },
  ];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};
