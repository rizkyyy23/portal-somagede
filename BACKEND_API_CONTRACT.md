# Backend API Contract — Portal Somagede

> Dokumen ini berisi **seluruh kontrak API** yang harus diimplementasikan oleh tim backend
> agar frontend Portal Somagede dapat berjalan dengan sempurna.
>
> **Versi Frontend:** React 19 + Vite  
> **Base URL:** `http://localhost:3001/api`  
> **Tanggal:** 4 Maret 2026

---

## Daftar Isi

1. [Arsitektur & Alur Umum](#1-arsitektur--alur-umum)
2. [Konvensi Response](#2-konvensi-response)
3. [Autentikasi & Authorization](#3-autentikasi--authorization)
4. [API Endpoints](#4-api-endpoints)
   - [4.1 Auth — Login & Microsoft OAuth](#41-auth--login--microsoft-oauth)
   - [4.2 Users — Manajemen User](#42-users--manajemen-user)
   - [4.3 Sessions — Active Session & Tracking](#43-sessions--active-session--tracking)
   - [4.4 Applications — Manajemen Aplikasi](#44-applications--manajemen-aplikasi)
   - [4.5 Departments — Manajemen Departemen](#45-departments--manajemen-departemen)
   - [4.6 Positions — Manajemen Jabatan](#46-positions--manajemen-jabatan)
   - [4.7 Roles — Manajemen Role](#47-roles--manajemen-role)
   - [4.8 Menus — Manajemen Menu Sidebar](#48-menus--manajemen-menu-sidebar)
   - [4.9 Broadcasts — Manajemen Pengumuman](#49-broadcasts--manajemen-pengumuman)
   - [4.10 Dashboard Stats — Statistik Admin](#410-dashboard-stats--statistik-admin)
   - [4.11 Analytics — Tren Login](#411-analytics--tren-login)
   - [4.12 Login History — Riwayat Login](#412-login-history--riwayat-login)
   - [4.13 Device Info — Informasi Perangkat](#413-device-info--informasi-perangkat)
   - [4.14 User Privileges — Hak Akses Aplikasi per User](#414-user-privileges--hak-akses-aplikasi-per-user)
5. [Database Schema (Rekomendasi)](#5-database-schema-rekomendasi)
6. [Alur Lengkap per Fitur](#6-alur-lengkap-per-fitur)
7. [File Upload](#7-file-upload)
8. [CORS & Proxy](#8-cors--proxy)
9. [Catatan Penting](#9-catatan-penting)

---

## 1. Arsitektur & Alur Umum

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  Vite Dev Server → proxy /api → http://localhost:3001       │
│  Vite Dev Server → proxy /uploads → http://localhost:3001   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP (JSON / FormData)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express/etc)                     │
│  Port: 3001                                                 │
│  Base Path: /api                                            │
│  Static Files: /uploads (untuk avatar, icon)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
│  Tables: users, sessions, applications, departments,        │
│          positions, roles, menus, broadcasts,                │
│          login_history, user_privileges,                     │
│          department_permissions                              │
└─────────────────────────────────────────────────────────────┘
```

### Alur Autentikasi

```
LOGIN EMAIL/PASSWORD:
  User → POST /api/users/login { email, password }
       → Backend validasi password (bcrypt)
       → Return { success, data: { id, name, email, role, department, position, avatar, token } }
       → Frontend simpan token + user data ke localStorage
       → POST /api/sessions { user_id, user_name, ... }
       → Navigate ke /dashboard

LOGIN MICROSOFT:
  User → MSAL popup → dapat loginResponse dari Azure AD
       → POST /api/auth/microsoft { microsoft_id, email, name, id_token }
       → Backend validasi id_token dengan Azure AD
       → Cek email di database (hanya user yang sudah terdaftar)
       → Return { success, data: { id, name, email, role, department, position, avatar, token } }
       → Frontend simpan token + user data ke localStorage
       → POST /api/sessions { user_id, user_name, ... }
       → Navigate ke /dashboard

PROTECTED ROUTES:
  Setiap request → Header: Authorization: Bearer <JWT_token>
  Jika token expired/invalid → Backend return 401
  Frontend → dispatch event "session-expired" → tampilkan overlay

FORCE LOGOUT:
  Admin → DELETE /api/sessions/:id
  Frontend user → polling GET /api/sessions/user/:id setiap 5 detik
  Jika response data = [] → tampilkan overlay "Session Terminated"
```

---

## 2. Konvensi Response

### Semua response HARUS mengikuti format ini:

**Success:**
```json
{
  "success": true,
  "data": { ... },         // Object atau Array
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Deskripsi error yang bisa ditampilkan ke user"
}
```

**HTTP Status Codes yang digunakan:**
| Code | Penggunaan |
|------|-----------|
| 200  | OK — GET, PUT, PATCH, DELETE berhasil |
| 201  | Created — POST berhasil |
| 400  | Bad Request — Validasi gagal, data tidak lengkap |
| 401  | Unauthorized — Token expired/invalid → frontend trigger session-expired |
| 403  | Forbidden — User tidak punya akses |
| 404  | Not Found — Resource tidak ditemukan |
| 500  | Internal Server Error |

---

## 3. Autentikasi & Authorization

### JWT Token

- Frontend mengirimkan token di header: `Authorization: Bearer <token>`
- Token diambil dari `localStorage.getItem("token")`
- Jika body request adalah `FormData` (file upload), Content-Type TIDAK diset oleh frontend (browser auto-set multipart boundary)
- Jika body request adalah JSON, frontend set `Content-Type: application/json`

### Kapan 401 Harus Dikembalikan

Backend HARUS return 401 jika:
- Token tidak ada di header (kecuali endpoint public)
- Token expired
- Token invalid/tampered

Frontend akan menangkap 401 dan:
1. Dispatch event `session-expired` → tampilkan overlay
2. Throw error (tidak lanjut proses)

### Endpoint yang TIDAK memerlukan token (public):
- `POST /api/users/login`
- `POST /api/auth/microsoft`

---

## 4. API Endpoints

---

### 4.1 Auth — Login & Microsoft OAuth

#### `POST /api/users/login`

Login dengan email dan password.

**Request Body:**
```json
{
  "email": "user@somagede.com",
  "password": "password123"
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@somagede.com",
    "role": "Admin",
    "department": "IT",
    "position": "Software Engineer",
    "avatar": "/uploads/avatars/john.jpg",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response Gagal (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Catatan:**
- Password harus diverifikasi dengan bcrypt
- `token` adalah JWT dengan payload minimal `{ id, email, role }`
- `avatar` berisi path relatif ke file gambar (bisa null)

---

#### `POST /api/auth/microsoft`

Login dengan Microsoft OAuth — validasi id_token dari Azure AD.

**Request Body:**
```json
{
  "microsoft_id": "abc123-local-account-id",
  "email": "user@somagede.com",
  "name": "John Doe",
  "id_token": "eyJ0eXAiOiJKV1Qi..."
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@somagede.com",
    "role": "Admin",
    "department": "IT",
    "position": "Software Engineer",
    "avatar": "/uploads/avatars/john.jpg",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response Gagal — User belum terdaftar (404):**
```json
{
  "success": false,
  "message": "Microsoft login failed. Account not registered in the system."
}
```

**Logika Backend:**
1. Validasi `id_token` dengan Azure AD public keys (JWKS)
   - Verify signature, audience (client_id: `188be485-1d9c-4fca-b1a2-e3877a2a772a`), issuer, expiry
2. Cari user di database berdasarkan `email`
3. Jika ditemukan → generate JWT token → return user data
4. Jika tidak ditemukan → return error (hanya user yang sudah didaftarkan oleh admin yang boleh login)
5. Opsional: simpan/update `microsoft_id` di tabel users untuk referensi

---

### 4.2 Users — Manajemen User

#### `GET /api/users`
Ambil semua user aktif.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@somagede.com",
      "role": "Admin",
      "status": "active",
      "position": "Software Engineer",
      "department": "IT",
      "avatar": "/uploads/avatars/john.jpg",
      "has_privilege": true,
      "extra_app_count": 3,
      "limit_app_count": 5
    }
  ]
}
```

**Catatan tentang field:**
- `has_privilege`: boolean, apakah user punya hak akses app tambahan diluar departemen
- `extra_app_count`: jumlah app tambahan yang diberikan ke user (dari tabel privileges)
- `limit_app_count`: batas maksimal app yang boleh diakses (opsional, bisa null)

---

#### `GET /api/users/inactive`
Ambil semua user dengan status `inactive`.

**Response:** Sama seperti `GET /api/users` tapi filter `status = 'inactive'`

---

#### `GET /api/users/admins`
Ambil semua user dengan role `Admin`.

**Response:** Sama seperti `GET /api/users` tapi filter `role = 'Admin'`

---

#### `GET /api/users/privilege`
Ambil semua user yang memiliki privilege (hak akses app tambahan).

**Response:** Sama seperti `GET /api/users` tapi filter `has_privilege = true`

---

#### `GET /api/users/:id`
Ambil detail satu user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@somagede.com",
    "role": "Admin",
    "status": "active",
    "position": "Software Engineer",
    "department": "IT",
    "avatar": "/uploads/avatars/john.jpg",
    "phone": "+6281234567890",
    "has_privilege": true,
    "password_changed_at": "2026-02-15T10:30:00Z",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

**Catatan:**
- `password_changed_at` digunakan oleh Profile untuk menghitung cooldown ganti password (30 hari)
- `phone` digunakan di halaman Profile (bisa null)

---

#### `POST /api/users`
Buat user baru (admin-only).

**Request:** `multipart/form-data` (karena ada file avatar)
```
name: "Jane Doe"
email: "jane@somagede.com"
password: "password123"
department: "Finance"
position: "Accountant"
role: "User"
status: "active"
avatar: [File] (opsional)
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully"
}
```

---

#### `PUT /api/users/:id`
Update user (admin-only). Frontend mengirim field yang ingin diubah.

**Request Body (JSON):**
```json
{
  "status": "active",
  "has_privilege": true,
  "role": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

**Kasus penggunaan:**
1. Aktivasi akun: `{ "status": "active" }`
2. Ubah role & privilege: `{ "status": "active", "has_privilege": true, "role": "Admin" }`

---

#### `PUT /api/users/:id/change-password`
Ganti password user sendiri.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response Sukses:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response Gagal:**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Logika Backend:**
1. Validasi `currentPassword` dengan bcrypt compare
2. Hash `newPassword` dengan bcrypt
3. Update password + set `password_changed_at` = NOW()
4. Return success

---

### 4.3 Sessions — Active Session & Tracking

#### `POST /api/sessions`
Buat active session saat user login.

**Request Body:**
```json
{
  "user_id": 1,
  "user_name": "John Doe",
  "user_email": "john@somagede.com",
  "department": "IT",
  "role": "Admin",
  "app_name": "-"
}
```

**Catatan:** Backend HARUS auto-detect dari request headers:
- `ip_address` — dari `req.ip` atau `X-Forwarded-For`
- `browser` — dari User-Agent parsing (Chrome, Firefox, Edge, Safari)
- `os` — dari User-Agent parsing (Windows 10, macOS, Linux, Android, iOS)
- `os_version` — versi OS
- `device_type` — desktop/mobile/tablet
- `login_at` — timestamp saat session dibuat
- `city`, `region`, `country` — dari IP geolocation (opsional, bisa pakai ip-api.com / ipinfo.io)

**Response:**
```json
{
  "success": true,
  "message": "Session created"
}
```

---

#### `GET /api/sessions`
Ambil semua active sessions (admin-only, untuk halaman Active Session).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "John Doe",
      "user_email": "john@somagede.com",
      "user_avatar": "/uploads/avatars/john.jpg",
      "role": "Admin",
      "department": "IT",
      "app_name": "SGI+",
      "ip_address": "192.168.1.100",
      "browser": "Chrome",
      "os": "Windows",
      "os_version": "10",
      "device_type": "desktop",
      "city": "Jakarta",
      "region": "DKI Jakarta",
      "country": "Indonesia",
      "login_at": "2026-03-04T08:30:00Z"
    }
  ]
}
```

---

#### `GET /api/sessions/user/:userId`
Ambil active sessions milik user tertentu.

**Response:** Sama seperti `GET /api/sessions` tapi filter `user_id = :userId`

**PENTING:** Endpoint ini dipanggil:
1. Di halaman **Profile** — untuk menampilkan "Recent Login Activity"
2. Oleh **SessionExpiredOverlay** — polling setiap **5 detik** untuk deteksi force logout
   - Jika response `data` array kosong `[]` → frontend menampilkan overlay "Session Terminated"
   - Artinya: jika admin menghapus semua session user, user otomatis ter-logout

---

#### `PUT /api/sessions/update-app`
Update nama aplikasi yang sedang aktif digunakan user.

**Request Body:**
```json
{
  "user_id": 1,
  "app_name": "SGI+"
}
```

**Logika:**
- Saat user klik "Launch Application" pada app card di Dashboard → `app_name` = nama aplikasi
- Saat user kembali ke tab Portal (visibilitychange event) → `app_name` = `"-"`
- Update session record terbaru milik user tersebut

**Response:**
```json
{
  "success": true
}
```

---

#### `DELETE /api/sessions/:id`
Hapus (terminate) satu session tertentu.

**Penggunaan:**
1. Admin force logout user dari halaman Active Session
2. Admin force logout dari Dashboard Admin
3. User logout session sendiri dari halaman Profile

**Response:**
```json
{
  "success": true
}
```

---

#### `DELETE /api/sessions/user/:userId`
Hapus semua session milik user tertentu (digunakan saat logout).

**Penggunaan:** Dipanggil oleh frontend saat user klik "Logout" dari Dashboard.

**Response:**
```json
{
  "success": true
}
```

---

### 4.4 Applications — Manajemen Aplikasi

#### `GET /api/applications`
Ambil semua aplikasi (flat list).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "SGI+",
      "code": "SGI",
      "description": "Supply chain management system",
      "url": "https://sgi.somagede.com",
      "icon": "/uploads/icons/sgi.png",
      "status": "active",
      "category": "Supply Chain"
    }
  ]
}
```

---

#### `GET /api/applications/categories`
Ambil aplikasi yang dikelompokkan berdasarkan category.

**Response:**
```json
{
  "success": true,
  "data": {
    "Supply Chain": [
      {
        "id": 1,
        "name": "SGI+",
        "code": "SGI",
        "url": "https://sgi.somagede.com",
        "icon": "/uploads/icons/sgi.png",
        "status": "active"
      }
    ],
    "Finance": [
      { "id": 2, "name": "Oodo", "code": "OODO", "..." : "..." }
    ],
    "Other": [
      { "id": 3, "name": "Punch", "code": "PUNCH", "..." : "..." }
    ]
  }
}
```

**Catatan:**
- Digunakan oleh Dashboard user untuk menampilkan app cards per kategori
- Kategori `"Other"` / `"Others"` akan ditampilkan sebagai nama departemen user
- `status: "inactive"` → frontend tampilkan sebagai "Temporarily Unavailable" dengan icon ban

---

#### `POST /api/applications`
Buat aplikasi baru (admin-only).

**Request:** `multipart/form-data`
```
name: "SGI+"
code: "SGI"
description: "Supply chain management system"
url: "https://sgi.somagede.com"
status: "active"
icon: [File] (opsional, gambar PNG/JPG)
```

**Response (201):**
```json
{
  "success": true,
  "message": "Application created successfully"
}
```

---

#### `PUT /api/applications/:id`
Update aplikasi (admin-only).

**Request:** `multipart/form-data`
```
name: "SGI+"
code: "SGI"
description: "Updated description"
url: "https://sgi.somagede.com"
status: "active" atau "inactive"
icon: [File] (opsional, hanya jika ganti icon)
```

**Response:**
```json
{
  "success": true,
  "message": "Application updated successfully"
}
```

---

#### `DELETE /api/applications/:id`
Hapus aplikasi (admin-only).

**Response:**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

### 4.5 Departments — Manajemen Departemen

#### `GET /api/departments`
Ambil semua departemen.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "IT",
      "code": "IT",
      "description": "Information Technology Department",
      "icon": "/uploads/icons/it.png",
      "icon_type": "upload",
      "color": "#3b82f6",
      "allowed_apps": "[\"SGI\", \"OODO\", \"PUNCH\"]"
    }
  ]
}
```

**Catatan tentang `allowed_apps`:**
- Berisi array kode aplikasi yang boleh diakses oleh departemen tersebut
- Bisa berupa JSON string `"[\"SGI\",\"OODO\"]"` atau array proper
- Frontend parse & bandingkan dengan `app.code` untuk menentukan apakah tampilkan app
- Admin melihat semua app, user non-admin hanya melihat app yang departemennya diizinkan

---

#### `POST /api/departments`
Buat departemen baru (admin-only).

**Request:** `multipart/form-data` ATAU `application/json`
```json
{
  "name": "IT",
  "code": "IT",
  "description": "Information Technology",
  "icon": "💻",
  "color": "#3b82f6"
}
```
*Atau FormData jika icon adalah file upload.*

**Response (201):**
```json
{
  "success": true,
  "message": "Department created successfully"
}
```

---

#### `PUT /api/departments/:id`
Update departemen.

**Request:** Sama seperti POST.

**Response:**
```json
{
  "success": true,
  "message": "Department updated successfully"
}
```

---

#### `DELETE /api/departments/:id`
Hapus departemen.

**Response:**
```json
{
  "success": true,
  "message": "Department deleted successfully"
}
```

---

#### `GET /api/departments/permissions`
Ambil permission masing-masing departemen terhadap aplikasi.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "permissions": [
        { "application_code": "SGI", "enabled": true },
        { "application_code": "OODO", "enabled": false },
        { "application_code": "PUNCH", "enabled": true }
      ]
    }
  ]
}
```

**Catatan:**
- `id` = department ID
- `permissions` = array of { application_code, enabled }
- Digunakan di halaman Application Management untuk matrix departemen ↔ aplikasi

---

#### `PATCH /api/departments/:deptId/permissions/:appCode`
Toggle permission satu departemen terhadap satu aplikasi.

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 4.6 Positions — Manajemen Jabatan

#### `GET /api/positions`
Ambil semua jabatan.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Software Engineer",
      "code": "SE",
      "description": "Develops and maintains software",
      "userCount": 5
    }
  ]
}
```

---

#### `POST /api/positions`
Buat jabatan baru.

**Request Body:**
```json
{
  "name": "Software Engineer",
  "code": "SE",
  "description": "Develops and maintains software"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Position created successfully"
}
```

---

#### `PUT /api/positions/:id`
Update jabatan.

**Request Body:** Sama seperti POST.

---

#### `DELETE /api/positions/:id`
Hapus jabatan.

---

### 4.7 Roles — Manajemen Role

#### `GET /api/roles`
Ambil semua role.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "code": "ADMIN",
      "description": "Full system access",
      "permissions": ["read", "write", "delete", "manage_users"],
      "isActive": true,
      "userCount": 3
    }
  ]
}
```

**Catatan:**
- `permissions` = array of string (nama-nama permission)
- `isActive` = boolean, apakah role ini aktif
- `userCount` = jumlah user yang menggunakan role ini

---

#### `POST /api/roles`
Buat role baru.

**Request Body:**
```json
{
  "name": "Manager",
  "code": "MGR",
  "description": "Department manager",
  "permissions": ["read", "write", "approve"],
  "isActive": true
}
```

---

#### `PUT /api/roles/:id`
Update role.

**Request Body:** Sama seperti POST.

---

#### `DELETE /api/roles/:id`
Hapus role.

---

#### `PATCH /api/roles/:id/toggle`
Toggle status aktif/non-aktif role.

**Response:**
```json
{
  "success": true,
  "message": "Role status toggled"
}
```

---

### 4.8 Menus — Manajemen Menu Sidebar

#### `GET /api/menus`
Ambil semua menu sidebar admin.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Dashboard",
      "path": "/admin/dashboard-admin",
      "icon": "LayoutDashboard",
      "customIcon": null,
      "order": 1,
      "isActive": true
    }
  ]
}
```

---

#### `POST /api/menus`
Buat menu baru.

**Request Body:**
```json
{
  "label": "Reports",
  "path": "/admin/reports",
  "icon": "FileText",
  "customIcon": null,
  "order": 6,
  "isActive": true
}
```

---

#### `PUT /api/menus/:id`
Update menu.

---

#### `DELETE /api/menus/:id`
Hapus menu.

---

### 4.9 Broadcasts — Manajemen Pengumuman

#### `GET /api/broadcasts`
Ambil semua broadcast (untuk Dashboard user).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "System Maintenance",
      "message": "Portal akan maintenance pada tanggal 5 Maret 2026",
      "priority": "urgent",
      "target_audience": "all",
      "created_at": "2026-03-01T10:00:00Z",
      "expires_at": "2026-03-10T23:59:59Z"
    }
  ]
}
```

**Catatan:**
- `priority`: `"urgent"` | `"high"` | `"normal"`
- `target_audience`: `"all"` | `"admin"` | `"staff"`
- Frontend filter berdasarkan `expires_at` dan `target_audience`
- Frontend sort: urgent → high → normal, lalu by created_at descending

---

#### `GET /api/broadcasts/active`
Ambil broadcast yang masih aktif (belum expired, belum dihapus).

**Response:** Sama seperti `GET /api/broadcasts` tapi sudah difilter.

**Query Parameter:** `?t=<timestamp>` (cache-busting, digunakan oleh frontend)

---

#### `GET /api/broadcasts/history`
Ambil broadcast yang sudah expired atau dihapus (arsip).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Old Announcement",
      "message": "...",
      "priority": "normal",
      "created_at": "2026-01-01T10:00:00Z",
      "expires_at": "2026-01-31T23:59:59Z",
      "deleted_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

---

#### `POST /api/broadcasts`
Buat broadcast baru (admin-only).

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "Portal akan maintenance...",
  "priority": "urgent",
  "target_audience": "all",
  "expires_at": "2026-03-10T23:59:59Z",
  "admin_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Broadcast created successfully"
}
```

---

#### `DELETE /api/broadcasts/:id`
Hapus (soft-delete) broadcast.

**Query Parameter:** `?admin_id=<userId>` (untuk logging siapa yang menghapus)

**Response:**
```json
{
  "success": true,
  "message": "Broadcast deleted successfully"
}
```

**Catatan:** Sebaiknya soft-delete (set `deleted_at`) agar masih muncul di history.

---

### 4.10 Dashboard Stats — Statistik Admin

#### `GET /api/dashboard/stats`
Ambil seluruh statistik untuk Dashboard Admin.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeSessionCount": 15,
    "totalApplications": 8,
    "totalDepartments": 22,
    "totalUsers": 150,
    "recentSessions": [
      {
        "id": 1,
        "user_name": "John Doe",
        "user_email": "john@somagede.com",
        "user_avatar": "/uploads/avatars/john.jpg",
        "department": "IT",
        "role": "Admin",
        "app_name": "SGI+",
        "login_at": "2026-03-04T08:30:00Z"
      }
    ],
    "departmentStats": [
      { "department": "IT", "count": 5, "color": "#3b82f6" }
    ],
    "activeSessionsByDept": [
      { "department": "IT", "count": 3 }
    ],
    "topActiveApps": [
      { "name": "SGI+", "value": 7 },
      { "name": "Punch", "value": 3 }
    ]
  }
}
```

**Catatan:**
- `recentSessions` = 5-10 session terbaru (untuk tabel "Recent Activity")
- `departmentStats` = jumlah user per departemen (untuk pie chart)
- `activeSessionsByDept` = jumlah session aktif per departemen (untuk bar chart)
- `topActiveApps` = app paling banyak digunakan saat ini (untuk chart)

---

### 4.11 Analytics — Tren Login

#### `GET /api/analytics/trends`
Ambil tren login harian (7-30 hari terakhir, untuk line chart).

**Response:**
```json
{
  "success": true,
  "data": [
    { "day": "2026-02-26", "count": 45 },
    { "day": "2026-02-27", "count": 52 },
    { "day": "2026-02-28", "count": 38 },
    { "day": "2026-03-01", "count": 61 },
    { "day": "2026-03-02", "count": 49 },
    { "day": "2026-03-03", "count": 55 },
    { "day": "2026-03-04", "count": 32 }
  ]
}
```

---

### 4.12 Login History — Riwayat Login

#### `GET /api/login-history/user/:userId`
Ambil riwayat login user (untuk "Recent Login Activity" di Profile).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "ip_address": "192.168.1.100",
      "browser": "Chrome",
      "os": "Windows",
      "os_version": "10",
      "device_type": "desktop",
      "device_info": "Chrome on Windows",
      "city": "Jakarta",
      "region": "DKI Jakarta",
      "country": "Indonesia",
      "location": "Jakarta, Indonesia",
      "login_at": "2026-03-04T08:30:00Z"
    }
  ]
}
```

**Catatan:**
- Frontend menggabungkan data ini dengan `GET /api/sessions/user/:userId`
- Deduplicate berdasarkan IP + device, prioritas session aktif
- Entry dengan `ip_address = "0.0.0.0"` di-skip oleh frontend

---

### 4.13 Device Info — Informasi Perangkat

#### `GET /api/device-info`
Ambil informasi perangkat & IP dari request saat ini.

**Response:**
```json
{
  "success": true,
  "data": {
    "ip": "192.168.1.100",
    "ip_address": "192.168.1.100",
    "browser": "Chrome",
    "os": "Windows",
    "os_version": "10",
    "device_type": "desktop",
    "city": "Jakarta",
    "region": "DKI Jakarta",
    "country": "Indonesia"
  }
}
```

**Penggunaan:** Frontend memanggil ini di Profile untuk memperkaya data session yang mungkin tidak memiliki info lokasi.

---

### 4.14 User Privileges — Hak Akses Aplikasi per User

#### `GET /api/users/:id/privileges`
Ambil daftar app yang diberi privilege ke user tertentu.

**Response:**
```json
{
  "success": true,
  "data": [
    { "application_id": 1 },
    { "application_id": 3 },
    { "application_id": 5 }
  ]
}
```

**Catatan:**
- Berbeda dari department permissions, ini adalah privilege **per-user**
- User dengan `has_privilege = true` bisa mengakses app-app ini SELAIN app departemennya
- Admin secara default bisa akses semua app

---

#### `PUT /api/users/:id/privileges`
Set ulang privilege user (replace all).

**Request Body:**
```json
{
  "application_ids": [1, 3, 5],
  "has_privilege": true
}
```

**Logika Backend:**
1. Hapus semua privilege lama milik user ini
2. Insert privilege baru sesuai `application_ids`
3. Update field `has_privilege` di tabel users

**Response:**
```json
{
  "success": true,
  "message": "Privileges updated successfully"
}
```

---

## 5. Database Schema (Rekomendasi)

```sql
-- =============================================
-- TABEL USERS
-- =============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,           -- bcrypt hash
  role VARCHAR(20) DEFAULT 'User',          -- 'Admin' | 'User' | 'staff'
  status VARCHAR(20) DEFAULT 'active',      -- 'active' | 'inactive'
  department VARCHAR(100),
  position VARCHAR(100),
  avatar VARCHAR(255),                      -- path to avatar file
  phone VARCHAR(20),
  microsoft_id VARCHAR(255),               -- Azure AD localAccountId (opsional)
  has_privilege BOOLEAN DEFAULT FALSE,
  password_changed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL SESSIONS (Active Sessions)
-- =============================================
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),
  user_email VARCHAR(100),
  department VARCHAR(100),
  role VARCHAR(20),
  app_name VARCHAR(100) DEFAULT '-',        -- Aplikasi yang sedang digunakan
  ip_address VARCHAR(45),
  browser VARCHAR(100),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(20),                  -- 'desktop' | 'mobile' | 'tablet'
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100),
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABEL LOGIN_HISTORY (Riwayat Login)
-- =============================================
CREATE TABLE login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  ip_address VARCHAR(45),
  browser VARCHAR(100),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(20),
  device_info VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100),
  location VARCHAR(255),
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABEL APPLICATIONS
-- =============================================
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,         -- Kode singkat: 'SGI', 'OODO', 'PUNCH'
  description TEXT,
  url VARCHAR(255),                         -- URL aplikasi
  icon VARCHAR(255),                        -- Path ke file icon
  status VARCHAR(20) DEFAULT 'active',      -- 'active' | 'inactive'
  category VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL DEPARTMENTS
-- =============================================
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),                        -- Emoji atau path file
  icon_type VARCHAR(20),                    -- 'emoji' | 'upload'
  color VARCHAR(10),                        -- Hex color: '#3b82f6'
  allowed_apps JSON,                        -- Array kode app: ["SGI","OODO"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL DEPARTMENT_PERMISSIONS
-- =============================================
CREATE TABLE department_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT,
  application_code VARCHAR(20),
  enabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dept_app (department_id, application_code)
);

-- =============================================
-- TABEL USER_PRIVILEGES
-- =============================================
CREATE TABLE user_privileges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  application_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_app (user_id, application_id)
);

-- =============================================
-- TABEL POSITIONS
-- =============================================
CREATE TABLE positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL ROLES
-- =============================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  permissions JSON,                         -- Array string: ["read","write","delete"]
  isActive BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL MENUS (Sidebar Admin)
-- =============================================
CREATE TABLE menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  path VARCHAR(255) NOT NULL,
  icon VARCHAR(50),                         -- Nama icon Lucide: 'LayoutDashboard'
  customIcon TEXT,                          -- Custom SVG (opsional)
  `order` INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL BROADCASTS
-- =============================================
CREATE TABLE broadcasts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal',    -- 'urgent' | 'high' | 'normal'
  target_audience VARCHAR(20) DEFAULT 'all', -- 'all' | 'admin' | 'staff'
  admin_id INT,                             -- User ID admin yang membuat
  expires_at DATETIME,
  deleted_at DATETIME,                      -- Soft delete
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 6. Alur Lengkap per Fitur

### 6.1 Login → Dashboard → Logout

```
1. User buka /login
2. Input email + password → POST /api/users/login
3. Backend validasi → return user data + JWT token
4. Frontend simpan ke localStorage:
   - token, userType, userEmail, user (JSON)
5. POST /api/sessions (buat session baru, backend auto-detect device/IP/location)
6. Navigate ke /dashboard
7. Dashboard load:
   - GET /api/users/:id (detail user)
   - GET /api/users/:id/privileges (app privileges)
   - GET /api/applications/categories (apps by category)
   - GET /api/departments (untuk filter apps by department)
   - GET /api/broadcasts (pengumuman aktif)
8. User klik app → window.open(url) + PUT /api/sessions/update-app { app_name }
9. User kembali ke tab Portal → PUT /api/sessions/update-app { app_name: "-" }
10. User klik Logout:
    - DELETE /api/sessions/user/:userId
    - Clear localStorage
    - Navigate ke /login
```

### 6.2 Force Logout oleh Admin

```
1. Admin buka /admin/active-session
2. GET /api/sessions → lihat semua active sessions
3. Admin klik "Force Logout" pada session → DELETE /api/sessions/:id
4. User yang ter-force-logout:
   - SessionExpiredOverlay polling GET /api/sessions/user/:userId setiap 5 detik
   - Response data = [] → tampilkan overlay "Session Terminated"
   - User klik "Login Again" → clear localStorage → redirect /login
```

### 6.3 Ganti Password

```
1. User buka /profile → tab "Settings"
2. Frontend cek password_changed_at → hitung apakah sudah 30 hari
3. Jika belum 30 hari → tombol disabled, tampilkan sisa hari
4. Jika sudah → user klik "Change Password"
5. Input current password + new password + confirm
6. Frontend validasi: min 8 char, match confirm, beda dari current
7. PUT /api/users/:id/change-password { currentPassword, newPassword }
8. Backend verify current password → hash new password → update + set password_changed_at
```

### 6.4 Department App Permissions (Admin)

```
1. Admin buka /admin/application-management
2. GET /api/applications → semua app
3. GET /api/departments → semua departemen
4. GET /api/departments/permissions → matrix dept ↔ app
5. Admin toggle checkbox → PATCH /api/departments/:deptId/permissions/:appCode { enabled }
```

### 6.5 User Privileges (Admin)

```
1. Admin buka /admin/user-control
2. GET /api/users (+ /inactive, /admins, /privilege untuk tab-tab berbeda)
3. GET /api/applications → untuk assign privileges
4. Klik user → GET /api/users/:id/privileges → lihat app apa saja yang sudah di-assign
5. Admin centang/uncentang apps → PUT /api/users/:id/privileges { application_ids }
```

---

## 7. File Upload

Frontend menggunakan `FormData` untuk upload file. Backend harus:

1. **Accept `multipart/form-data`** pada endpoint yang menerima file
2. **Simpan file** ke folder `/uploads/avatars/` atau `/uploads/icons/`
3. **Return path** relatif: `/uploads/avatars/filename.jpg`
4. **Serve static files** dari folder `/uploads`

Endpoint yang menerima file upload:
- `POST /api/users` → field `avatar`
- `POST /api/applications` → field `icon`
- `PUT /api/applications/:id` → field `icon`
- `POST /api/departments` → field `icon` (jika bukan emoji)
- `PUT /api/departments/:id` → field `icon`

---

## 8. CORS & Proxy

### Development

Vite proxy sudah dikonfigurasi:
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
  },
  '/uploads': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
  }
}
```

Artinya:
- Frontend di `http://localhost:5173` → request `/api/*` diteruskan ke `http://localhost:3001/api/*`
- Request `/uploads/*` diteruskan ke `http://localhost:3001/uploads/*`

### Production

Backend perlu setup CORS headers:
```
Access-Control-Allow-Origin: <frontend-domain>
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 9. Catatan Penting

### 9.1 Polling Session (Performance)

Frontend melakukan polling `GET /api/sessions/user/:userId` setiap **5 detik** untuk SETIAP user yang sedang login. Ini bertujuan mendeteksi force logout oleh admin.

**Rekomendasi optimasi:**
- Endpoint ini harus sangat ringan (query sederhana, no joins)
- Pertimbangkan caching atau WebSocket sebagai alternatif jangka panjang
- Response cukup `{ success: true, data: [] }` atau `{ success: true, data: [{ id }] }` (minimal)

### 9.2 IP Geolocation

Untuk mendapatkan city/region/country dari IP address, bisa menggunakan:
- **ip-api.com** (gratis, 45 req/menit)
- **ipinfo.io** (gratis tier, 50k req/bulan)
- **MaxMind GeoLite2** (database lokal, tanpa rate limit)

Implementasi di `POST /api/sessions` saat membuat session baru.

### 9.3 User Agent Parsing

Untuk mengekstrak browser, OS, device type dari User-Agent header, gunakan library:
- **ua-parser-js** (Node.js)
- **express-useragent** (Express middleware)

### 9.4 Microsoft Token Validation

Untuk validasi `id_token` dari Azure AD:
- Gunakan library **jwks-rsa** + **jsonwebtoken**
- JWKS URL: `https://login.microsoftonline.com/common/discovery/v2.0/keys`
- Validasi: signature, audience (`188be485-1d9c-4fca-b1a2-e3877a2a772a`), issuer, expiry

### 9.5 localStorage Structure

Frontend menyimpan data berikut di localStorage:
```
token          → JWT token (string)
userType       → "admin" | "user" (string)
userEmail      → email user (string)
user           → JSON string: { id, name, role, department, position, avatar }
msalAccount    → JSON string dari Microsoft account (hanya untuk Microsoft login)
rememberedEmail → email yang di-remember (opsional)
sidebarCollapsed → "true" | "false" (state sidebar admin)
```

### 9.6 Ringkasan Seluruh Endpoint

| # | Method | Endpoint | Auth | Deskripsi |
|---|--------|----------|------|-----------|
| 1 | POST | `/api/users/login` | ❌ | Login email/password |
| 2 | POST | `/api/auth/microsoft` | ❌ | Login Microsoft OAuth |
| 3 | GET | `/api/users` | ✅ | Semua user aktif |
| 4 | GET | `/api/users/inactive` | ✅ | User non-aktif |
| 5 | GET | `/api/users/admins` | ✅ | User admin |
| 6 | GET | `/api/users/privilege` | ✅ | User dengan privilege |
| 7 | GET | `/api/users/:id` | ✅ | Detail user |
| 8 | POST | `/api/users` | ✅ | Buat user baru |
| 9 | PUT | `/api/users/:id` | ✅ | Update user |
| 10 | PUT | `/api/users/:id/change-password` | ✅ | Ganti password |
| 11 | GET | `/api/users/:id/privileges` | ✅ | Ambil privileges user |
| 12 | PUT | `/api/users/:id/privileges` | ✅ | Set privileges user |
| 13 | POST | `/api/sessions` | ✅ | Buat session baru |
| 14 | GET | `/api/sessions` | ✅ | Semua active sessions |
| 15 | GET | `/api/sessions/user/:userId` | ✅ | Sessions milik user |
| 16 | PUT | `/api/sessions/update-app` | ✅ | Update active app |
| 17 | DELETE | `/api/sessions/:id` | ✅ | Hapus session |
| 18 | DELETE | `/api/sessions/user/:userId` | ✅ | Hapus semua session user |
| 19 | GET | `/api/applications` | ✅ | Semua aplikasi |
| 20 | GET | `/api/applications/categories` | ✅ | Aplikasi per kategori |
| 21 | POST | `/api/applications` | ✅ | Buat aplikasi |
| 22 | PUT | `/api/applications/:id` | ✅ | Update aplikasi |
| 23 | DELETE | `/api/applications/:id` | ✅ | Hapus aplikasi |
| 24 | GET | `/api/departments` | ✅ | Semua departemen |
| 25 | POST | `/api/departments` | ✅ | Buat departemen |
| 26 | PUT | `/api/departments/:id` | ✅ | Update departemen |
| 27 | DELETE | `/api/departments/:id` | ✅ | Hapus departemen |
| 28 | GET | `/api/departments/permissions` | ✅ | Matrix dept ↔ app |
| 29 | PATCH | `/api/departments/:deptId/permissions/:appCode` | ✅ | Toggle permission |
| 30 | GET | `/api/positions` | ✅ | Semua jabatan |
| 31 | POST | `/api/positions` | ✅ | Buat jabatan |
| 32 | PUT | `/api/positions/:id` | ✅ | Update jabatan |
| 33 | DELETE | `/api/positions/:id` | ✅ | Hapus jabatan |
| 34 | GET | `/api/roles` | ✅ | Semua role |
| 35 | POST | `/api/roles` | ✅ | Buat role |
| 36 | PUT | `/api/roles/:id` | ✅ | Update role |
| 37 | DELETE | `/api/roles/:id` | ✅ | Hapus role |
| 38 | PATCH | `/api/roles/:id/toggle` | ✅ | Toggle status role |
| 39 | GET | `/api/menus` | ✅ | Semua menu |
| 40 | POST | `/api/menus` | ✅ | Buat menu |
| 41 | PUT | `/api/menus/:id` | ✅ | Update menu |
| 42 | DELETE | `/api/menus/:id` | ✅ | Hapus menu |
| 43 | GET | `/api/broadcasts` | ✅ | Semua broadcast |
| 44 | GET | `/api/broadcasts/active` | ✅ | Broadcast aktif |
| 45 | GET | `/api/broadcasts/history` | ✅ | Broadcast arsip |
| 46 | POST | `/api/broadcasts` | ✅ | Buat broadcast |
| 47 | DELETE | `/api/broadcasts/:id` | ✅ | Hapus broadcast |
| 48 | GET | `/api/dashboard/stats` | ✅ | Statistik dashboard |
| 49 | GET | `/api/analytics/trends` | ✅ | Tren login harian |
| 50 | GET | `/api/login-history/user/:userId` | ✅ | Riwayat login user |
| 51 | GET | `/api/device-info` | ✅ | Info perangkat saat ini |

**Total: 51 endpoint**
