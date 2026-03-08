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

 FRONTEND (React)  

│  Vite Dev Server → proxy /api → http://localhost:5173/      │
│  Vite Dev Server → proxy /uploads → http://localhost:5173/  │

              

### Alur Autentikasi

Portal punya 2 metode login untuk 2 tipe user:

| Metode               | Untuk Siapa                                          | Cara Akun Dibuat                                       |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **Microsoft 365**    | Karyawan internal (punya akun Microsoft perusahaan)  | Data diambil dari talenta (pihak ke 3 kepegawaian), login pakai Microsoft |
| **Email + Password** | User eksternal / (tidak punya akun Microsoft) | Admin buat akun + password di User Control             |

Kedua metode menghasilkan output yang sama: JWT di httpOnly cookie + session di database.

```
LOGIN EMAIL/PASSWORD (Eksternal):
  User → POST /api/users/login { email, password }
       → Backend validasi password (bcrypt)
       → Backend generate JWT, set httpOnly cookie di response
       → Return { success, data: { id, name, email, role, department, position, avatar } }
       → Frontend simpan user data ke localStorage (bukan token)
       → POST /api/sessions { user_id, user_name, ... }
       → Navigate ke /dashboard

LOGIN MICROSOFT (Internal):
  User → MSAL popup → dapat loginResponse dari Azure AD
       → POST /api/auth/microsoft { microsoft_id, email, name, id_token }
       → Backend validasi id_token dengan Azure AD
       → Cek email di database (hanya user yang sudah terdaftar)
       → Backend generate JWT, set httpOnly cookie di response
       → Return { success, data: { id, name, email, role, department, position, avatar } }
       → Frontend simpan user data ke localStorage (bukan token)
       → POST /api/sessions { user_id, user_name, ... }
       → Navigate ke /dashboard

PROTECTED ROUTES:
  Setiap request → browser otomatis kirim httpOnly cookie (berisi JWT)
  Jika JWT tidak valid / expired → Backend return 401
  Frontend → dispatch event "session-expired" → tampilkan overlay

FORCE LOGOUT:
  Admin → DELETE /api/sessions/:id
  Request berikutnya dari user → auth middleware cek session → tidak ditemukan → 401
  Frontend tangkap 401 → tampilkan overlay "Session Terminated"
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
| 200 | OK — GET, PUT, PATCH, DELETE berhasil |
| 201 | Created — POST berhasil |
| 400 | Bad Request — Validasi gagal, data tidak lengkap |
| 401 | Unauthorized — Token expired/invalid → frontend trigger session-expired |
| 403 | Forbidden — User tidak punya akses |
| 404 | Not Found — Resource tidak ditemukan |
| 500 | Internal Server Error |

---

## 3. Autentikasi & Authorization

### JWT di httpOnly Cookie

- **JWT** — token punya signature (tidak bisa dipalsukan), expiry otomatis, dan bisa menyimpan data user (id, email, role) tanpa harus query database setiap request.
- **httpOnly cookie** — JavaScript di browser tidak bisa baca isi cookie, jadi kebal dari serangan XSS. Kalau cuma pakai localStorage, script jahat bisa mencuri token.

Frontend sama sekali tidak tahu isi JWT-nya apa. Yang terjadi cuma browser kirim cookie otomatis, backend baca dan verifikasi.

### Alur Autentikasinya

1. User login → backend verifikasi kredensial → generate JWT (payload: `{ id, email, role }`) → kirim JWT lewat `Set-Cookie` header.
2. Browser menyimpan cookie dan mengirimnya di setiap request berikutnya secara otomatis.
3. Backend terima request → baca JWT dari cookie → verifikasi signature dan expiry → kalau valid, lanjut proses. Kalau tidak, return 401.

Backend juga tetap bisa query tabel `sessions` untuk keperluan tracking dan force logout. Tapi untuk autentikasi murni, JWT sudah cukup karena signature-nya bisa diverifikasi tanpa ke database.

### Cara Backend Set Cookie

Saat login berhasil, backend set cookie di response header:

```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800
```

Penjelasan flag:

- `HttpOnly` — cookie tidak bisa diakses JavaScript (kebal XSS)
- `Secure` — cookie hanya dikirim lewat HTTPS (untuk production)
- `SameSite=Lax` — cegah CSRF dari domain lain
- `Path=/` — cookie berlaku untuk semua path
- `Max-Age=28800` — kadaluarsa 8 jam (1 hari kerja)

Untuk development (localhost), `Secure` boleh dihilangkan karena belum HTTPS.

### Session Timeout Policy (3 Lapis Pertahanan)

Sistem menggunakan 3 lapis timeout. **Semua security enforcement di backend.** Frontend hanya UX layer.

| Layer                | Mekanisme                                        | Durasi                    | Siapa yang Handle                         | Bisa Dibypass User? |
| -------------------- | ------------------------------------------------ | ------------------------- | ----------------------------------------- | ------------------- |
| **Idle Timeout**     | Backend cek `last_activity` di setiap request    | **30 menit**              | **Backend** (middleware)                  | ❌ Tidak bisa       |
| **Absolute Timeout** | JWT `exp` claim — batas maksimal session         | **8 jam** (Max-Age=28800) | **Backend** (JWT expiry)                  | ❌ Tidak bisa       |
| **Force Logout**     | Admin terminate session via Active Session panel | Kapan saja                | **Backend** (hapus dari tabel `sessions`) | ❌ Tidak bisa       |

---

#### 🔒 Idle Timeout — Backend Enforcement

**Kenapa harus backend?** Karena kalau hanya frontend yang mengatur idle timeout:

- User bisa disable JavaScript
- User bisa manipulasi DevTools / console
- Tab bisa tetap terbuka tanpa event
- Request API tetap bisa jalan via script (curl, Postman, dll)

**Cara kerja di backend:**

Backend menyimpan kolom `last_activity` di tabel `sessions`. Setiap request yang melewati auth middleware:

```
1. Baca JWT dari cookie → verifikasi signature & expiry
2. Query sessions WHERE user_id = jwt.id
3. Cek: NOW() - last_activity > 30 menit?
   → YA:  Hapus session dari tabel, hapus cookie, return 401
   → TIDAK: Update last_activity = NOW(), lanjut proses request
```

Pseudo-code middleware:

```javascript
// Auth middleware — jalankan di SETIAP protected route
async function authMiddleware(req, res, next) {
  // 1. Baca & verifikasi JWT
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Token invalid/expired" });
  }

  // 2. Cek idle timeout dari database
  const [sessions] = await db.query(
    "SELECT id, last_activity FROM sessions WHERE user_id = ?",
    [payload.id],
  );

  if (sessions.length === 0) {
    res.clearCookie("token");
    return res
      .status(401)
      .json({ message: "Session not found (force logout)" });
  }

  const session = sessions[0];
  const idleMinutes =
    (Date.now() - new Date(session.last_activity).getTime()) / 60000;

  if (idleMinutes > 30) {
    // Idle terlalu lama — hapus session & cookie
    await db.query("DELETE FROM sessions WHERE id = ?", [session.id]);
    res.clearCookie("token");
    return res.status(401).json({ message: "Session expired (idle timeout)" });
  }

  // 3. Masih aktif — update last_activity
  await db.query("UPDATE sessions SET last_activity = NOW() WHERE id = ?", [
    session.id,
  ]);

  req.user = payload; // Attach user info ke request
  next();
}
```

**Endpoint yang TIDAK perlu cek idle (public):**

- `POST /users/login`
- `POST /users/microsoft-login`
- `POST /users/logout`
- `GET /sessions/user/:id` (untuk halaman Profile)

---

#### 🎨 Frontend Idle — UX Layer Saja

Frontend punya `useIdleTimeout` hook yang track aktivitas user (mouse, keyboard, scroll, dll). Tapi ini **bukan security**, hanya UX:

| Frontend                       | Fungsi                                            |
| ------------------------------ | ------------------------------------------------- |
| Timer 30 menit tanpa aktivitas | Tampilkan overlay "Session Idle" supaya user tahu |
| Tangkap 401 dari backend       | Tampilkan overlay + clear localStorage            |

Tidak ada polling. Force logout terdeteksi saat request berikutnya → 401.

Jadi walaupun user bypass frontend (disable JS, manipulasi DevTools), **backend tetap menolak request** karena `last_activity` sudah lebih dari 30 menit.

---

#### Alur Absolute Timeout

1. JWT punya `exp` claim = 8 jam dari waktu login
2. Setelah 8 jam, walaupun user masih aktif, backend reject request (401)
3. Frontend tangkap 401 → tampilkan overlay "Session Expired"

Ini tidak bisa dimanipulasi karena `exp` ada di dalam JWT yang signed oleh backend.

### JWT Payload

Isi minimal JWT yang di-generate backend:

```json
{
  "id": 1,
  "email": "user@somagede.com",
  "role": "Admin",
  "iat": 1709622000,
  "exp": 1709650800
}
```

Gunakan secret key yang kuat, simpan di `.env`, jangan hardcode.

### Frontend: credentials include

Frontend sudah diset `credentials: "include"` di setiap fetch request. Ini supaya browser mau mengirim cookie ke backend. Frontend tidak set header `Authorization` dan tidak menyimpan token di mana pun.

### Kapan Backend Harus Return 401

Kembalikan status 401 kalau:

- Cookie `token` tidak ada di request
- JWT signature tidak valid (token dipalsukan)
- JWT sudah expired

Dari sisi frontend, semua response 401 akan ditangkap dan langsung menampilkan overlay "Session Expired".

### Saat Logout

Backend harus menghapus cookie dengan mengirim:

```
Set-Cookie: token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
```

Dan hapus session dari tabel `sessions`.

### Endpoint Public (tidak perlu cookie):

- `POST /api/users/login`
- `POST /api/auth/microsoft`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

---

## 4. API Endpoints

---

### 4.1 Auth — Login & Microsoft OAuth

#### `POST /api/users/login`

Login dengan email dan password — **untuk user eksternal** (intern, kontraktor, dll) yang tidak punya akun Microsoft perusahaan. Akun dibuat oleh admin melalui User Control.

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
    "auth_provider": "local"
  }
}
```

**Response Header (Set-Cookie):**

```
Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800
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
- JWT dikirim lewat httpOnly cookie, bukan di response body
- `avatar` berisi path relatif ke file gambar (bisa null)
- `auth_provider` selalu `"local"` untuk login via endpoint ini

---

#### `POST /api/auth/microsoft`

Login dengan Microsoft OAuth — **untuk karyawan internal** yang punya akun Microsoft 365 perusahaan. Validasi id_token dari Azure AD.

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
    "auth_provider": "microsoft"
  }
}
```

**Response Header (Set-Cookie):**

```
Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800
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
3. Jika ditemukan:
   - Update `auth_provider = 'microsoft'` dan `microsoft_id` di tabel users (jika belum)
   - Generate JWT → set httpOnly cookie → return user data
4. Jika tidak ditemukan → return error (hanya user yang sudah didaftarkan oleh admin yang boleh login)

---

### 4.1b Auth — Forgot Password & Reset Password

Flow reset password untuk **user eksternal** (`auth_provider = 'local'`). User Microsoft tidak menggunakan fitur ini — password mereka dikelola oleh Microsoft.

#### `POST /api/auth/forgot-password`

Request link reset password. **Endpoint ini SELALU return success**, bahkan jika email tidak ditemukan. Ini untuk mencegah email enumeration attack.

**Request Body:**

```json
{
  "email": "user@email.com"
}
```

**Response (selalu sama):**

```json
{
  "success": true,
  "message": "If the email exists, we've sent reset instructions."
}
```

**Logika Backend:**

1. Cari user berdasarkan `email` di tabel `users`
2. Jika email TIDAK ditemukan → return success (jangan expose info)
3. Jika email ditemukan DAN `auth_provider = 'microsoft'` → return success (jangan kirim email, Microsoft user tidak perlu reset password lokal)
4. Jika email ditemukan DAN `auth_provider = 'local'`:
   a. Generate token random (gunakan `crypto.randomBytes(32).toString('hex')`)
   b. Hash token dengan SHA-256 sebelum simpan ke database (jangan simpan plain token)
   c. Simpan ke tabel `password_resets`:
   - `email` — email user
   - `token` — hashed token
   - `expires_at` — NOW() + 15 menit
     d. Hapus token lama untuk email yang sama (jika ada)
     e. Kirim email ke user berisi link:
   ```
   https://portal.somagede.co.id/reset-password?token=<plain_token>
   ```
   f. Return success

**Catatan Keamanan:**

- Token di-hash (SHA-256) sebelum disimpan ke database
- Token yang dikirim via email adalah plain token (sebelum hash)
- Saat verifikasi, backend hash token dari URL lalu cocokkan dengan database
- Rate limiting: maksimal 3 request per email per jam

---

#### `POST /api/auth/reset-password`

Reset password user menggunakan token dari email.

**Request Body:**

```json
{
  "token": "abc123xyz...",
  "newPassword": "passwordBaru123"
}
```

**Response Sukses:**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Response Gagal — Token expired (400):**

```json
{
  "success": false,
  "message": "Reset token has expired. Please request a new one."
}
```

**Response Gagal — Token tidak valid (400):**

```json
{
  "success": false,
  "message": "Invalid reset token."
}
```

**Logika Backend:**

1. Hash token dari request body dengan SHA-256
2. Cari di tabel `password_resets` berdasarkan hashed token
3. Jika tidak ditemukan → return error "Invalid reset token"
4. Jika `expires_at` < NOW() → return error "Token expired"
5. Cari user berdasarkan `email` dari token record
6. Hash `newPassword` dengan bcrypt
7. Update password user di tabel `users`
8. Set `password_changed_at` = NOW()
9. Hapus SEMUA token reset untuk email tersebut dari `password_resets`
10. Hapus SEMUA active sessions user dari tabel `sessions` (force logout semua device)
11. Return success

**Catatan Keamanan:**

- Token sekali pakai — dihapus setelah digunakan
- Semua session di-invalidate setelah reset (keamanan)
- Password minimal 8 karakter (validasi backend juga, bukan hanya frontend)

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
    "auth_provider": "microsoft",
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

Ganti password user sendiri. **Hanya untuk user dengan `auth_provider = 'local'`** (user eksternal). User Microsoft tidak boleh ganti password lewat endpoint ini karena password mereka dikelola oleh Microsoft.

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

**Response Gagal — Microsoft user (403):**

```json
{
  "success": false,
  "message": "Password change not allowed for Microsoft-authenticated accounts"
}
```

**Logika Backend:**

1. Cek `auth_provider` user — jika `'microsoft'` → return 403
2. Validasi `currentPassword` dengan bcrypt compare
3. Hash `newPassword` dengan bcrypt
4. Update password + set `password_changed_at` = NOW()
5. Return success

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
2. Di halaman **Active Session** (admin) — untuk menampilkan daftar session aktif

**Catatan:** Endpoint ini TIDAK di-polling. Force logout terdeteksi saat request berikutnya dari user mendapat 401 dari auth middleware (karena session sudah dihapus).

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
    "Finance": [{ "id": 2, "name": "Oodo", "code": "OODO", "...": "..." }],
    "Other": [{ "id": 3, "name": "Punch", "code": "PUNCH", "...": "..." }]
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

_Atau FormData jika icon adalah file upload._

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
    "departmentStats": [{ "department": "IT", "count": 5, "color": "#3b82f6" }],
    "activeSessionsByDept": [{ "department": "IT", "count": 3 }],
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
  auth_provider VARCHAR(20) DEFAULT 'local', -- 'local' | 'microsoft' (menentukan cara login)
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
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Backend update setiap request (untuk idle timeout)
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
-- TABEL PASSWORD_RESETS (Token Reset Password)
-- =============================================
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) NOT NULL,               -- SHA-256 hashed token
  expires_at DATETIME NOT NULL,              -- Waktu kadaluarsa (15 menit dari pembuatan)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_email (email)
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
3. Backend validasi → set httpOnly cookie (berisi JWT) + return user data
4. Frontend simpan ke localStorage:
   - userType, userEmail, user (JSON)
   - Token TIDAK disimpan di frontend (ada di cookie, dikelola browser)
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
   - Request berikutnya → auth middleware cek session → tidak ditemukan → 401
   - api.js tangkap 401 → dispatch event "session-expired" dengan reason "force_logout"
   - SessionExpiredOverlay tampilkan overlay "Session Terminated"
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

### 9.1 Kenapa Tidak Pakai Polling?

Versi sebelumnya menggunakan polling `GET /api/sessions/user/:userId` setiap 5 detik untuk mendeteksi force logout. Ini dihapus karena:

- **Boros resource:** 1 user = 12 request/menit, 100 user = 72.000 request/jam, dan 99% jawabannya "masih aktif"
- **Tidak menambah security:** Backend sudah enforce session check di setiap request melalui auth middleware
- **Force logout tetap terdeteksi:** Saat admin hapus session → request berikutnya dari user kena 401 → overlay muncul

Jika suatu hari butuh force logout yang benar-benar instan (detik itu juga), pertimbangkan WebSocket atau Server-Sent Events (SSE).

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
userType       → "admin" | "user" (string)
userEmail      → email user (string)
user           → JSON string: { id, name, role, department, position, avatar }
msalAccount    → JSON string dari Microsoft account (hanya untuk Microsoft login)
rememberedEmail → email yang di-remember (opsional)
sidebarCollapsed → "true" | "false" (state sidebar admin)
```

> **Catatan:** Token (JWT) TIDAK disimpan di localStorage. JWT ada di httpOnly cookie yang dikirim otomatis oleh browser dan tidak bisa diakses JavaScript.

### 9.6 Ringkasan Seluruh Endpoint

| #   | Method | Endpoint                                        | Auth | Deskripsi                |
| --- | ------ | ----------------------------------------------- | ---- | ------------------------ |
| 1   | POST   | `/api/users/login`                              | ❌   | Login email/password     |
| 2   | POST   | `/api/auth/microsoft`                           | ❌   | Login Microsoft OAuth    |
| 3   | POST   | `/api/auth/forgot-password`                     | ❌   | Request reset password   |
| 4   | POST   | `/api/auth/reset-password`                      | ❌   | Reset password via token |
| 5   | GET    | `/api/users`                                    | ✅   | Semua user aktif         |
| 6   | GET    | `/api/users/inactive`                           | ✅   | User non-aktif           |
| 7   | GET    | `/api/users/admins`                             | ✅   | User admin               |
| 8   | GET    | `/api/users/privilege`                          | ✅   | User dengan privilege    |
| 9   | GET    | `/api/users/:id`                                | ✅   | Detail user              |
| 10  | POST   | `/api/users`                                    | ✅   | Buat user baru           |
| 11  | PUT    | `/api/users/:id`                                | ✅   | Update user              |
| 12  | PUT    | `/api/users/:id/change-password`                | ✅   | Ganti password           |
| 13  | GET    | `/api/users/:id/privileges`                     | ✅   | Ambil privileges user    |
| 14  | PUT    | `/api/users/:id/privileges`                     | ✅   | Set privileges user      |
| 15  | POST   | `/api/sessions`                                 | ✅   | Buat session baru        |
| 16  | GET    | `/api/sessions`                                 | ✅   | Semua active sessions    |
| 17  | GET    | `/api/sessions/user/:userId`                    | ✅   | Sessions milik user      |
| 18  | PUT    | `/api/sessions/update-app`                      | ✅   | Update active app        |
| 19  | DELETE | `/api/sessions/:id`                             | ✅   | Hapus session            |
| 20  | DELETE | `/api/sessions/user/:userId`                    | ✅   | Hapus semua session user |
| 21  | GET    | `/api/applications`                             | ✅   | Semua aplikasi           |
| 22  | GET    | `/api/applications/categories`                  | ✅   | Aplikasi per kategori    |
| 23  | POST   | `/api/applications`                             | ✅   | Buat aplikasi            |
| 24  | PUT    | `/api/applications/:id`                         | ✅   | Update aplikasi          |
| 25  | DELETE | `/api/applications/:id`                         | ✅   | Hapus aplikasi           |
| 26  | GET    | `/api/departments`                              | ✅   | Semua departemen         |
| 27  | POST   | `/api/departments`                              | ✅   | Buat departemen          |
| 28  | PUT    | `/api/departments/:id`                          | ✅   | Update departemen        |
| 29  | DELETE | `/api/departments/:id`                          | ✅   | Hapus departemen         |
| 30  | GET    | `/api/departments/permissions`                  | ✅   | Matrix dept ↔ app        |
| 31  | PATCH  | `/api/departments/:deptId/permissions/:appCode` | ✅   | Toggle permission        |
| 32  | GET    | `/api/positions`                                | ✅   | Semua jabatan            |
| 33  | POST   | `/api/positions`                                | ✅   | Buat jabatan             |
| 34  | PUT    | `/api/positions/:id`                            | ✅   | Update jabatan           |
| 35  | DELETE | `/api/positions/:id`                            | ✅   | Hapus jabatan            |
| 36  | GET    | `/api/roles`                                    | ✅   | Semua role               |
| 37  | POST   | `/api/roles`                                    | ✅   | Buat role                |
| 38  | PUT    | `/api/roles/:id`                                | ✅   | Update role              |
| 39  | DELETE | `/api/roles/:id`                                | ✅   | Hapus role               |
| 40  | PATCH  | `/api/roles/:id/toggle`                         | ✅   | Toggle status role       |
| 41  | GET    | `/api/menus`                                    | ✅   | Semua menu               |
| 42  | POST   | `/api/menus`                                    | ✅   | Buat menu                |
| 43  | PUT    | `/api/menus/:id`                                | ✅   | Update menu              |
| 44  | DELETE | `/api/menus/:id`                                | ✅   | Hapus menu               |
| 45  | GET    | `/api/broadcasts`                               | ✅   | Semua broadcast          |
| 46  | GET    | `/api/broadcasts/active`                        | ✅   | Broadcast aktif          |
| 47  | GET    | `/api/broadcasts/history`                       | ✅   | Broadcast arsip          |
| 48  | POST   | `/api/broadcasts`                               | ✅   | Buat broadcast           |
| 49  | DELETE | `/api/broadcasts/:id`                           | ✅   | Hapus broadcast          |
| 50  | GET    | `/api/dashboard/stats`                          | ✅   | Statistik dashboard      |
| 51  | GET    | `/api/analytics/trends`                         | ✅   | Tren login harian        |
| 52  | GET    | `/api/login-history/user/:userId`               | ✅   | Riwayat login user       |
| 53  | GET    | `/api/device-info`                              | ✅   | Info perangkat saat ini  |

**Total: 53 endpoint**
