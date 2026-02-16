# File Cleanup - Portal Somagede

## 🗑️ File Yang Bisa Dihapus (Tidak Dipakai Lagi)

### 1. **Folder HTML Statis** ❌

```
src/html somagede/
├── admin/
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboardd.js
└── assets/
```

**Alasan:** Sudah migrasi ke React, tidak perlu HTML statis lagi.

---

### 2. **CSS Duplikat/Tidak Terpakai** ❌

```
src/styles/dashboard.css          # Duplikasi dengan admin-dashboard.css
src/styles/admin.css               # Sudah di-merge ke admin-dashboard.css
src/App.css                        # Minimal/tidak digunakan
```

---

### 3. **File Dokumentasi Lama** ❌

```
REACT_CONVERSION_README.md        # Konversi sudah selesai
```

---

## ✅ File Yang TETAP DIPERTAHANKAN

### Frontend (User)

- `src/pages/Dashboard.jsx` - User dashboard
- `src/pages/Profile.jsx` - User profile (akan digabung dengan Settings)
- `src/pages/Settings.jsx` - User settings
- `src/pages/Login.jsx` - Login page
- `src/components/Sidebar.jsx` - User sidebar
- `src/components/Navbar.jsx` - User navbar
- `src/styles/global.css` - Global styles
- `src/styles/sidebar.css` - Sidebar styles
- `src/styles/profile.css` - Profile styles
- `src/styles/login.css` - Login styles

### Frontend (Admin)

- `src/pages/admin/DashboardAdmin.jsx` - Admin overview
- `src/pages/admin/ActiveSession.jsx` - Active sessions
- `src/pages/admin/ApplicationManagement.jsx` - Manage app permissions per dept
- `src/pages/admin/UserControl.jsx` - User management
- `src/pages/admin/Broadcast.jsx` - Broadcast messages
- `src/components/AdminLayout.jsx` - Admin layout wrapper
- `src/styles/admin-dashboard.css` - Admin styles (consolidated)

### Backend

- `backend/server.js` - Express server
- `backend/config/database.js` - DB connection
- `backend/routes/userRoutes.js` - User API routes
- `backend/routes/departmentRoutes.js` - Department API routes
- `backend/controllers/userController.js` - User logic
- `backend/controllers/departmentController.js` - Department logic

### Database

- `backend/database/schema.sql` - Database structure
- `backend/database/22_departments.sql` - 22 departments setup
- `backend/database/update_icons.sql` - Icon updates
- `backend/database/create_trigger.sql` - Triggers

---

## 📝 File Yang Perlu DIBUAT (Untuk Fitur Baru)

### Mastercard (Admin)

```
src/pages/admin/mastercard/
├── MastercardLayout.jsx              # Wrapper dengan submenu dropdown
├── MasterDepartments.jsx              # CRUD departments
├── MasterApplications.jsx             # CRUD applications
├── MasterPositions.jsx                # CRUD positions/jabatan
├── MasterRoles.jsx                    # CRUD roles & permissions
└── MasterAPIConfig.jsx                # API pihak ke-3 configuration
```

### Backend Routes (Mastercard)

```
backend/routes/
├── mastercardRoutes.js               # Main mastercard routes
├── positionRoutes.js                 # Position/jabatan CRUD
└── roleRoutes.js                     # Role management

backend/controllers/
├── mastercardController.js
├── positionController.js
└── roleController.js
```

### User Enhancement

```
src/pages/
├── ProfileSettings.jsx               # Gabungan Profile + Settings (tabbed)
└── Applications.jsx                  # User app list dengan lock icon
```

---

## 🔄 File Yang Perlu DIUPDATE

### ActiveSession.jsx

- ❌ Hapus kolom "Windows Version"
- ✅ Tetap: User, Device, IP, Login Time, Logout Action

### UserControl.jsx

- ✅ Nama, Email, Dept, Position → Read-only (dari API pihak ke-3)
- ✅ Role → Editable (SuperAdmin/User only)
- ✅ Tambah modal konfirmasi untuk promote ke SuperAdmin
- ✅ Limit: max 3 SuperAdmin

### AdminLayout.jsx / Sidebar

- ✅ Tambah menu "Mastercard" dengan dropdown submenu

---

## 🚀 Action Plan Cleanup

**Fase 1: Hapus File Tidak Terpakai**

```bash
# Delete HTML static files
rm -rf "src/html somagede"

# Delete duplicate CSS
rm src/styles/dashboard.css
rm src/styles/admin.css
rm src/App.css

# Delete old docs
rm REACT_CONVERSION_README.md
```

**Fase 2: Buat Struktur Mastercard**

```bash
# Create mastercard folder
mkdir src/pages/admin/mastercard

# Create mastercard components (empty structure)
touch src/pages/admin/mastercard/MastercardLayout.jsx
touch src/pages/admin/mastercard/MasterDepartments.jsx
touch src/pages/admin/mastercard/MasterApplications.jsx
touch src/pages/admin/mastercard/MasterPositions.jsx
touch src/pages/admin/mastercard/MasterRoles.jsx
touch src/pages/admin/mastercard/MasterAPIConfig.jsx
```

**Fase 3: Update Existing Files**

- Update ActiveSession: remove Windows version column
- Update UserControl: read-only user data, editable role only
- Update AdminLayout: add Mastercard dropdown menu

---

## ❓ Konfirmasi Yang Diperlukan

1. **Apakah saya hapus folder `src/html somagede/` sekarang?** (Ya/Tidak)
2. **Apakah saya buat struktur Mastercard sekarang?** (Ya/Tidak)
3. **Prioritas update mana dulu:**
   - [ ] Hapus Windows Version di ActiveSession
   - [ ] Read-only user data di UserControl
   - [ ] Buat Mastercard menu structure
   - [ ] Buat ProfileSettings (gabung Profile+Settings)

Silakan konfirmasi agar saya bisa lanjutkan dengan tepat!
