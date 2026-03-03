# File admin-dashboard.css tidak digunakan

Berdasarkan hasil pencarian di seluruh project, file `src/styles/admin-dashboard.css` tidak pernah diimport atau digunakan di kode manapun. Semua halaman admin dan user menggunakan `DashboardAdmin.css` atau `DashboardNew.css`.

File ini aman untuk dihapus agar tidak membingungkan.

---

# Saran Rename

- `DashboardNew.css` → `dashboard-user.css` (untuk dashboard user)
- `DashboardAdmin.css` → `dashboard-admin.css` (untuk dashboard admin)

Jika ingin melakukan rename, pastikan juga update semua import di file terkait.
