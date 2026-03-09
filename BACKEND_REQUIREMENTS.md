### Kebutuhan Request Frontend untuk Endpoint SSO (Launch Application)

- **Endpoint:** `GET /api/sso/:appName`
- **Deskripsi:**
  - Endpoint ini dipanggil frontend setiap kali user ingin membuka aplikasi dari portal.
  - Nama aplikasi dikirim sebagai path parameter (`:appName`).
  - Tidak ada data di body request.
  - Session user dikirim otomatis melalui cookie HttpOnly (misal: `token=xxxxxx`).

- **Contoh Request:**

  ```http
  GET /api/sso/SGI%2B HTTP/1.1
  Host: portal.domain.com
  Cookie: token=xxxxxx;
  ```

- **Yang perlu dilakukan backend:**
  1. Validasi session user dari cookie.
  2. Generate token SSO untuk aplikasi tujuan.
  3. Kembalikan response JSON:
     ```json
     {
       "url": "https://sgi+.domain.com/sso-login?token=xxxx"
     }
     ```
  4. Jika gagal, kembalikan error message yang jelas.

- **Catatan:**
  - Frontend akan melakukan redirect ke URL yang diberikan pada response.
  - Jika response tidak mengandung properti `url`, frontend akan menampilkan pesan error.

# Backend Requirements — Portal Somagede

> Dokumen ini berisi **kebutuhan backend** yang harus diimplementasikan agar frontend Portal Somagede berjalan dengan sempurna.
> Dokumen ini ditujukan untuk **tim backend** sebagai panduan pengembangan API.
>
> **Frontend Stack:** React 19 + Vite
> **Base URL API:** `/api` (disarankan menggunakan versioning: `/api/v1`)
> **Tanggal:** 8 Maret 2026

### API Versioning

Disarankan menggunakan versioning pada base URL agar lebih mudah migrasi di masa depan:

```
Base URL: /api/v1
```

Jika tim backend menggunakan versioning, frontend akan menyesuaikan. Koordinasikan base URL yang disepakati bersama.

---

## Daftar Isi

1. [Kontrak Frontend → Backend](#1-kontrak-frontend--backend)
2. [Konvensi Response API](#2-konvensi-response-api)
3. [Autentikasi & Session Management](#3-autentikasi--session-management)
4. [Daftar Endpoint API](#4-daftar-endpoint-api)
5. [Database Schema (Rekomendasi)](#5-database-schema-rekomendasi)
6. [File Upload](#6-file-upload)
7. [Kebutuhan Fungsional Backend](#7-kebutuhan-fungsional-backend)
8. [Catatan untuk Diskusi Tim](#8-catatan-untuk-diskusi-tim)

---

## 1. Kontrak Frontend → Backend

Bagian ini berisi hal-hal yang **harus dikoordinasikan** antara tim frontend dan backend.

### 1.1 API Base URL

Frontend mengirim semua request ke base path `/api`. Saat development, frontend berjalan di `http://localhost:5173`.

| Environment | URL                                                                  |
| ----------- | -------------------------------------------------------------------- |
| Development | `http://localhost:<PORT>/api` (Vite proxy meneruskan dari port 5173) |
| Production  | `https://<domain-backend>/api` (koordinasi dengan tim)               |

> Frontend menggunakan Vite proxy yang meneruskan `/api/*` dari `localhost:5173` ke backend. Saat ini proxy mengarah ke `localhost:3001` (dummy backend untuk testing), **port ini akan disesuaikan** dengan port backend yang sebenarnya nanti.

### 1.2 Konfigurasi yang Perlu Dikoordinasikan

| Config            | Nilai                                  | Keterangan                                                           |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `AZURE_CLIENT_ID` | `188be485-1d9c-4fca-b1a2-e3877a2a772a` | Harus sama persis — sudah terdaftar di Azure AD                      |
| `FRONTEND_URL`    | `http://localhost:5173` (dev)          | Digunakan backend untuk CORS origin dan link di email reset password |

> Konfigurasi internal backend (PORT, database, JWT secret, dsb) sepenuhnya ditentukan oleh tim backend sendiri. Frontend tidak memerlukan informasi tersebut.

### 1.3 Cookie Requirements

Backend **HARUS** mengirim cookie autentikasi dengan flag berikut:

```
Set-Cookie: token=<value>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800
```

| Flag            | Alasan (dari sisi frontend)                                               |
| --------------- | ------------------------------------------------------------------------- |
| `HttpOnly`      | Frontend tidak perlu akses cookie via JavaScript — browser kirim otomatis |
| `Secure`        | Wajib di production (HTTPS). Boleh dihilangkan saat development (HTTP)    |
| `SameSite=Lax`  | Mencegah cookie dikirim dari domain lain (CSRF protection)                |
| `Path=/`        | Cookie berlaku untuk semua path                                           |
| `Max-Age=28800` | 8 jam (absolute session timeout)                                          |

Frontend menggunakan `credentials: "include"` di setiap `fetch()` request — ini membuat browser otomatis mengirim cookie. Jika flag di atas tidak benar, **cookie tidak akan terkirim** dan seluruh autentikasi gagal.

### 1.4 CORS Requirements (Production)

| Setting         | Nilai                                                        |
| --------------- | ------------------------------------------------------------ |
| Allowed Origin  | `FRONTEND_URL` (domain frontend)                             |
| Allowed Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS                       |
| Allowed Headers | Content-Type                                                 |
| Credentials     | **WAJIB `true`** — agar browser mengirim cookie cross-origin |

> Tanpa `credentials: true` di CORS, browser tidak akan menyertakan cookie ke backend.

---

## 2. Konvensi Response API

### Semua response WAJIB mengikuti format ini:

**Sukses:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**

```json
{
  "success": false,
  "message": "Deskripsi error yang bisa ditampilkan ke user",
  "errorCode": "INVALID_PASSWORD"
}
```

> **Tentang `errorCode`:** Frontend saat ini hanya membaca field `message` untuk ditampilkan ke user. Namun sangat disarankan backend juga menyertakan `errorCode` (string constant) agar di masa depan frontend bisa melakukan penanganan error yang lebih spesifik. Contoh: `"INVALID_PASSWORD"`, `"EMAIL_NOT_FOUND"`, `"TOKEN_EXPIRED"`, `"SESSION_NOT_FOUND"`, dll.

### HTTP Status Codes

| Code | Penggunaan                                                 |
| ---- | ---------------------------------------------------------- |
| 200  | OK — GET, PUT, PATCH, DELETE berhasil                      |
| 201  | Created — POST berhasil membuat data baru                  |
| 400  | Bad Request — Validasi gagal, data tidak lengkap           |
| 401  | Unauthorized — Token expired / invalid / session tidak ada |
| 403  | Forbidden — User tidak punya akses                         |
| 404  | Not Found — Resource tidak ditemukan                       |
| 500  | Internal Server Error                                      |

> **PENTING:** Frontend menangkap semua response **401** dan otomatis menampilkan overlay "Session Expired". Jadi pastikan hanya return 401 jika memang session/token bermasalah.

---

## 3. Autentikasi & Session Management

### Tentang Arsitektur Hybrid (JWT + Session Table)

Frontend saat ini menggunakan arsitektur **hybrid**: JWT di httpOnly cookie + tabel `sessions` di database. Alasannya:

- **JWT** → untuk autentikasi cepat (verify signature tanpa query DB)
- **Tabel sessions** → untuk fitur **force logout** oleh admin, **tracking active sessions**, dan **idle timeout** berbasis `last_activity`

JWT murni (stateless) tidak cukup karena admin harus bisa force-logout user secara real-time — yang memerlukan pengecekan ke database.

> **Catatan untuk tim backend:** Jika tim backend lebih prefer menggunakan **session ID di cookie + Redis/DB** (tanpa JWT), itu juga bisa diterima — selama kontrak endpoint dan response format tetap diikuti. Frontend tidak pernah membaca isi token. Yang penting: cookie di-set saat login, dikirim otomatis setiap request, dan backend return 401 jika tidak valid.

### 3.1 Cookie & Token

Detail cookie requirements sudah dijelaskan di [bagian 1.3](#13-cookie-requirements). Ringkasnya: backend set httpOnly cookie saat login berhasil, frontend kirim otomatis via `credentials: "include"`.

### JWT Payload (jika menggunakan JWT)

Minimal isi JWT payload:

```json
{
  "id": "<user_id>",
  "email": "<user_email>",
  "role": "<user_role>",
  "iat": "<issued_at_timestamp>",
  "exp": "<expiry_timestamp>"
}
```

### 3.2 Auth Middleware

Jalankan di **SETIAP protected endpoint**. Logika:

```
1. Baca cookie "token" dari request
2. Jika tidak ada → return 401
3. Verify JWT (signature + expiry)
4. Jika invalid/expired → clear cookie + return 401
5. Query sessions WHERE user_id = jwt.id
6. Jika session tidak ditemukan → clear cookie + return 401 (force logout case)
7. Cek idle timeout: NOW() - last_activity > 30 menit?
   → YA: hapus session + clear cookie + return 401
   → TIDAK: update last_activity = NOW() + lanjutkan request
8. Attach user info ke request object (req.user = jwt payload)
```

### 3.3 Session Timeout (3 Lapis)

| Layer                | Mekanisme                         | Durasi     | Handle                  |
| -------------------- | --------------------------------- | ---------- | ----------------------- |
| **Idle Timeout**     | Cek `last_activity` tiap request  | 30 menit   | Backend middleware      |
| **Absolute Timeout** | JWT `exp` claim                   | 8 jam      | Backend JWT verify      |
| **Force Logout**     | Admin hapus session dari database | Kapan saja | Backend DELETE endpoint |

### 3.4 Endpoint Public (TANPA auth middleware)

```
POST /api/users/login
POST /api/auth/microsoft
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 3.5 Session Check saat App Start

Frontend menyimpan data user di `localStorage` untuk keperluan UI (nama, role, avatar). Masalahnya: `localStorage` tidak pernah expire — jadi jika cookie session sudah expired tapi localStorage masih ada, user bisa melihat UI seolah masih login.

**Solusi:** Frontend memanggil `GET /api/auth/me` saat aplikasi pertama kali dimuat:

```
App start → call GET /api/auth/me → if 200: render dashboard → if 401: clear localStorage + redirect login
```

Endpoint ini didefinisikan di [bagian 4.1](#41-auth--login--microsoft-oauth).

### 3.6 Saat Logout

Backend harus menghapus cookie:

```
Set-Cookie: token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
```

Dan hapus session dari tabel `sessions`.

---

## 4. Daftar Endpoint API

### Ringkasan Seluruh Endpoint (53 endpoint)

| #   | Method | Endpoint                                        | Auth | Deskripsi                               |
| --- | ------ | ----------------------------------------------- | ---- | --------------------------------------- |
| 1   | POST   | `/api/users/login`                              | ❌   | Login email/password                    |
| 2   | POST   | `/api/auth/microsoft`                           | ❌   | Login Microsoft OAuth                   |
| 3   | POST   | `/api/auth/forgot-password`                     | ❌   | Request reset password                  |
| 4   | POST   | `/api/auth/reset-password`                      | ❌   | Reset password via token                |
| 5   | GET    | `/api/auth/me`                                  | ✅   | Validasi session + ambil user aktif     |
| 6   | GET    | `/api/users`                                    | ✅   | Semua user aktif                        |
| 7   | GET    | `/api/users/inactive`                           | ✅   | User non-aktif                          |
| 8   | GET    | `/api/users/admins`                             | ✅   | User dengan role Admin                  |
| 9   | GET    | `/api/users/privilege`                          | ✅   | User dengan privilege                   |
| 10  | GET    | `/api/users/:id`                                | ✅   | Detail satu user                        |
| 11  | POST   | `/api/users`                                    | ✅   | Buat user baru (multipart/form-data)    |
| 12  | PUT    | `/api/users/:id`                                | ✅   | Update user                             |
| 13  | PUT    | `/api/users/:id/change-password`                | ✅   | Ganti password                          |
| 14  | GET    | `/api/users/:id/privileges`                     | ✅   | Ambil privileges user                   |
| 15  | PUT    | `/api/users/:id/privileges`                     | ✅   | Set privileges user                     |
| 16  | POST   | `/api/sessions`                                 | ✅   | Buat session baru                       |
| 17  | GET    | `/api/sessions`                                 | ✅   | Semua active sessions                   |
| 18  | GET    | `/api/sessions/me`                              | ✅   | Sessions milik user (dari JWT)          |
| 19  | PUT    | `/api/sessions/update-app`                      | ✅   | Update active app name                  |
| 20  | DELETE | `/api/sessions/:id`                             | ✅   | Hapus satu session                      |
| 21  | DELETE | `/api/sessions`                                 | ✅   | Hapus semua session user (dari JWT)     |
| 22  | GET    | `/api/applications`                             | ✅   | Semua aplikasi                          |
| 23  | GET    | `/api/applications/categories`                  | ✅   | Aplikasi per kategori                   |
| 24  | POST   | `/api/applications`                             | ✅   | Buat aplikasi (multipart/form-data)     |
| 25  | PUT    | `/api/applications/:id`                         | ✅   | Update aplikasi (multipart/form-data)   |
| 26  | DELETE | `/api/applications/:id`                         | ✅   | Hapus aplikasi                          |
| 27  | GET    | `/api/departments`                              | ✅   | Semua departemen                        |
| 28  | POST   | `/api/departments`                              | ✅   | Buat departemen (multipart/form-data)   |
| 29  | PUT    | `/api/departments/:id`                          | ✅   | Update departemen (multipart/form-data) |
| 30  | DELETE | `/api/departments/:id`                          | ✅   | Hapus departemen                        |
| 31  | GET    | `/api/departments/permissions`                  | ✅   | Matrix dept ↔ app                       |
| 32  | PATCH  | `/api/departments/:deptId/permissions/:appCode` | ✅   | Toggle permission                       |
| 33  | GET    | `/api/positions`                                | ✅   | Semua jabatan                           |
| 34  | POST   | `/api/positions`                                | ✅   | Buat jabatan                            |
| 35  | PUT    | `/api/positions/:id`                            | ✅   | Update jabatan                          |
| 36  | DELETE | `/api/positions/:id`                            | ✅   | Hapus jabatan                           |
| 37  | GET    | `/api/roles`                                    | ✅   | Semua role                              |
| 38  | POST   | `/api/roles`                                    | ✅   | Buat role                               |
| 39  | PUT    | `/api/roles/:id`                                | ✅   | Update role                             |
| 40  | DELETE | `/api/roles/:id`                                | ✅   | Hapus role                              |
| 41  | PATCH  | `/api/roles/:id/toggle`                         | ✅   | Toggle status role                      |
| 42  | GET    | `/api/menus`                                    | ✅   | Semua menu sidebar                      |
| 43  | POST   | `/api/menus`                                    | ✅   | Buat menu                               |
| 44  | PUT    | `/api/menus/:id`                                | ✅   | Update menu                             |
| 45  | DELETE | `/api/menus/:id`                                | ✅   | Hapus menu                              |
| 46  | GET    | `/api/broadcasts`                               | ✅   | Semua broadcast                         |
| 47  | GET    | `/api/broadcasts/active`                        | ✅   | Broadcast aktif                         |
| 48  | GET    | `/api/broadcasts/history`                       | ✅   | Broadcast arsip                         |
| 49  | POST   | `/api/broadcasts`                               | ✅   | Buat broadcast                          |
| 50  | DELETE | `/api/broadcasts/:id`                           | ✅   | Hapus broadcast (soft-delete)           |
| 51  | GET    | `/api/dashboard/stats`                          | ✅   | Statistik dashboard admin               |
| 52  | GET    | `/api/analytics/trends`                         | ✅   | Tren login harian                       |
| 53  | GET    | `/api/login-history/user/:userId`               | ✅   | Riwayat login user                      |

> **Catatan:** Endpoint `GET /api/device-info` **dihapus** — backend cukup mendeteksi info perangkat secara internal saat login/create session (lihat bagian 4.13).

---

### 4.1 Auth — Login & Microsoft OAuth

#### `POST /api/users/login`

Login dengan email dan password (untuk user eksternal yang tidak punya akun Microsoft).

**Request Body:**

```json
{
  "email": "user@somagede.com",
  "password": "password123"
}
```

**Logika Backend:**

1. Cari user berdasarkan `email`
2. Jika tidak ditemukan → return 401 `"Invalid email or password"`
3. Bandingkan password dengan hash yang tersimpan (gunakan algoritma hashing yang aman — bcrypt, argon2, scrypt, atau setara)
4. Jika tidak cocok → return 401 `"Invalid email or password"`
5. Generate token → set httpOnly cookie
6. Return user data

**Response Sukses (200) + Set-Cookie header:**

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

**Response Gagal (401):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

#### `POST /api/auth/microsoft`

Login dengan Microsoft 365 OAuth (untuk karyawan internal).

**Request Body:**

```json
{
  "microsoft_id": "abc123-local-account-id",
  "email": "user@somagede.com",
  "name": "John Doe",
  "id_token": "eyJ0eXAiOiJKV1Qi..."
}
```

**Logika Backend:**

1. Validasi `id_token` dengan Azure AD public keys (JWKS URL: `https://login.microsoftonline.com/common/discovery/v2.0/keys`)
2. Verify: signature, audience (= Azure Client ID, koordinasi dengan tim frontend), issuer, expiry
3. Cari user di database berdasarkan `email`
4. Jika tidak ditemukan → return 404 `"Microsoft login failed. Account not registered in the system."`
5. Update `auth_provider = 'microsoft'` dan `microsoft_id` jika belum
6. Generate JWT → set httpOnly cookie → return user data

**Response Sukses (200) + Set-Cookie header:**

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

**Response Gagal (404):**

```json
{
  "success": false,
  "message": "Microsoft login failed. Account not registered in the system."
}
```

---

#### `GET /api/auth/me`

Validasi session aktif dan return data user saat ini. **Dipanggil frontend saat aplikasi pertama kali dimuat** untuk memastikan session masih valid.

**Request:** Tidak ada body — backend membaca JWT dari cookie.

**Logika Backend:**

1. Baca cookie token → verify JWT
2. Cek session masih ada di database (belum di-force-logout)
3. Cek idle timeout (sama seperti auth middleware)
4. Jika semua valid → return user data
5. Jika invalid → clear cookie + return 401

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

**Response Gagal (401):**

```json
{
  "success": false,
  "message": "Session expired or invalid"
}
```

> **Frontend behavior:** Jika 401 → `localStorage.clear()` + redirect ke `/login`.

---

#### `POST /api/auth/forgot-password`

Request link reset password. **SELALU return success** (cegah email enumeration).

**Request Body:**

```json
{
  "email": "user@email.com"
}
```

**Logika Backend:**

1. Cari user berdasarkan `email`
2. Jika tidak ditemukan → **tetap return success** (jangan expose info)
3. Jika `auth_provider = 'microsoft'` → return success (tidak kirim email)
4. Jika `auth_provider = 'local'`:
   - Generate secure random token (minimal 32 byte)
   - Hash token sebelum simpan ke database (SHA-256 atau algoritma hash lain)
   - Set `expires_at` = NOW() + 15 menit
   - Hapus token lama untuk email yang sama
   - Kirim email dengan link: `<FRONTEND_URL>/reset-password?token=<plain_token>`
5. Rate limiting: max 3 request per email per jam

**Response (selalu sama):**

```json
{
  "success": true,
  "message": "If the email exists, we've sent reset instructions."
}
```

---

#### `POST /api/auth/reset-password`

Reset password menggunakan token dari email.

**Request Body:**

```json
{
  "token": "abc123xyz...",
  "newPassword": "passwordBaru123"
}
```

**Logika Backend:**

1. Hash `token` dari request body (dengan algoritma yang sama saat menyimpan)
2. Cari di `password_resets` berdasarkan `token_hash`
3. Jika tidak ditemukan → return 400 `"Invalid reset token."`
4. Jika `used_at` IS NOT NULL → return 400 `"Reset token has already been used."`
5. Jika `expires_at` < NOW() → return 400 `"Reset token has expired. Please request a new one."`
6. Cari user berdasarkan `email` dari token record
7. Hash `newPassword` secara aman → update password user
8. Set `password_changed_at` = NOW()
9. Set `used_at` = NOW() pada token record (tandai sudah dipakai)
10. Hapus SEMUA active sessions user (force logout semua device)
11. Validasi: password minimal 8 karakter

**Response Sukses:**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Response Gagal (400):**

```json
{
  "success": false,
  "message": "Reset token has expired. Please request a new one."
}
```

---

### 4.2 Users — Manajemen User

#### `GET /api/users`

Ambil semua user dengan `status = 'active'`.

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

**Catatan field:**

- `has_privilege`: boolean — apakah user punya hak akses app tambahan di luar departemen
- `extra_app_count`: jumlah app tambahan yang diberikan (dari tabel `user_privileges`)
- `limit_app_count`: batas maksimal app (opsional, bisa null)

---

#### `GET /api/users/inactive`

Sama seperti `GET /api/users` tapi filter `status = 'inactive'`.

---

#### `GET /api/users/admins`

Sama seperti `GET /api/users` tapi filter `role = 'Admin'`.

---

#### `GET /api/users/privilege`

Sama seperti `GET /api/users` tapi filter `has_privilege = true`.

> **Alternatif yang lebih RESTful:** Keempat endpoint di atas (`/users`, `/users/inactive`, `/users/admins`, `/users/privilege`) bisa digabung menjadi satu endpoint dengan query parameters:
>
> ```
> GET /api/users?status=active
> GET /api/users?status=inactive
> GET /api/users?role=admin
> GET /api/users?hasPrivilege=true
> ```
>
> Frontend bisa menyesuaikan jika backend memilih pendekatan ini. Koordinasikan saat development.

---

#### `GET /api/users/:id`

Detail satu user.

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

- `password_changed_at` digunakan frontend untuk cooldown ganti password (30 hari)
- `auth_provider` digunakan frontend untuk menentukan apakah tampilkan fitur ganti password

---

#### `POST /api/users`

Buat user baru (admin-only).

**Request:** `multipart/form-data`

| Field      | Type   | Required | Keterangan                             |
| ---------- | ------ | -------- | -------------------------------------- |
| name       | string | ✅       | Nama lengkap                           |
| email      | string | ✅       | Email unik                             |
| password   | string | ✅       | Password (backend harus hash securely) |
| department | string | ✅       | Nama departemen                        |
| position   | string | ✅       | Nama jabatan                           |
| role       | string | ✅       | "Admin" / "User" / "Staff" dll         |
| status     | string | ✅       | "active" / "inactive"                  |
| avatar     | File   | ❌       | Gambar avatar (PNG/JPG)                |

**Response (201):**

```json
{
  "success": true,
  "message": "User created successfully"
}
```

---

#### `PUT /api/users/:id`

Update user (admin-only). Frontend mengirim hanya field yang berubah.

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

---

#### `PUT /api/users/:id/change-password`

Ganti password user sendiri. **Hanya untuk `auth_provider = 'local'`**.

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Logika Backend:**

1. Cek `auth_provider` — jika `'microsoft'` → return 403
2. Validasi `currentPassword` terhadap hash yang tersimpan
3. Hash `newPassword` secara aman
4. Update password + set `password_changed_at` = NOW()

**Response Sukses:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response Gagal (401):**

```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Response Gagal (403) — Microsoft user:**

```json
{
  "success": false,
  "message": "Password change not allowed for Microsoft-authenticated accounts"
}
```

---

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

---

#### `PUT /api/users/:id/privileges`

Set ulang seluruh privilege user (replace all).

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
3. Update field `has_privilege` di tabel `users`

**Response:**

```json
{
  "success": true,
  "message": "Privileges updated successfully"
}
```

---

### 4.3 Sessions — Active Session & Tracking

> **Catatan arsitektur:** Frontend saat ini memanggil `POST /api/sessions` secara terpisah setelah login berhasil. Jika tim backend lebih prefer **membuat session secara internal di dalam endpoint login** (tanpa endpoint terpisah), itu bisa didiskusikan. Frontend bisa menyesuaikan. Yang penting: setelah login, session tercatat di database untuk keperluan tracking & force logout.

#### `POST /api/sessions`

Buat active session saat user login.

> **Security best practice:** Backend **HARUS** mengambil identitas user (id, name, email, department, role) dari JWT token (`req.user`), **bukan** dari request body. Ini mencegah user memalsukan identitas dengan mengirim `user_id` milik orang lain.

**Request Body:**

```json
{
  "app_name": "-"
}
```

**Flow:**

```
Login berhasil → JWT diset di cookie → Frontend call POST /sessions → Backend baca user dari JWT → Backend create session
```

**Backend HARUS auto-detect dari request headers:**

| Field                       | Sumber                                                   |
| --------------------------- | -------------------------------------------------------- |
| `ip_address`                | `req.ip` atau header `X-Forwarded-For`                   |
| `browser`                   | User-Agent parsing (Chrome, Firefox, Edge, Safari)       |
| `os`                        | User-Agent parsing (Windows, macOS, Linux, Android, iOS) |
| `os_version`                | Versi OS dari User-Agent                                 |
| `device_type`               | desktop / mobile / tablet                                |
| `city`, `region`, `country` | IP geolocation (ip-api.com / ipinfo.io / MaxMind)        |
| `login_at`                  | Timestamp saat ini                                       |
| `last_activity`             | Timestamp saat ini                                       |

**Response (201):**

```json
{
  "success": true,
  "message": "Session created"
}
```

---

#### `GET /api/sessions`

Ambil semua active sessions (admin-only).

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

#### `GET /api/sessions/me`

Ambil active sessions milik user yang sedang login. Digunakan di halaman Profile.

> **Security:** Backend mengambil user dari JWT token — tidak perlu `userId` di URL.

**Response:** Format sama seperti `GET /api/sessions` tapi filter `user_id` berdasarkan JWT.

---

#### `PUT /api/sessions/update-app`

Update nama aplikasi yang sedang aktif digunakan user.

> **Security:** Backend mengambil user dari JWT token, bukan dari request body.

**Request Body:**

```json
{
  "app_name": "SGI+"
}
```

**Logika:** Update `app_name` pada session terbaru milik user yang teridentifikasi dari JWT. `"-"` berarti user sedang di portal.

**Response:**

```json
{
  "success": true
}
```

---

#### `DELETE /api/sessions/:id`

Hapus satu session (force logout / user logout session tertentu).

**Response:**

```json
{
  "success": true
}
```

---

#### `DELETE /api/sessions`

Hapus semua session milik user yang sedang login (digunakan saat user logout).

> **Security:** Backend mengambil user dari JWT token — tidak perlu `userId` di URL. Ini lebih RESTful dan mencegah user menghapus session orang lain.

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

Ambil aplikasi dikelompokkan berdasarkan `category`.

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
    "Finance": [...],
    "Other": [...]
  }
}
```

---

#### `POST /api/applications`

Buat aplikasi baru (admin-only).

**Request:** `multipart/form-data`

| Field       | Type   | Required                   |
| ----------- | ------ | -------------------------- |
| name        | string | ✅                         |
| code        | string | ✅ (unique)                |
| description | string | ❌                         |
| url         | string | ✅                         |
| status      | string | ✅ ("active" / "inactive") |
| icon        | File   | ❌ (PNG/JPG)               |

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

**Request:** `multipart/form-data` — field sama seperti POST.

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

**Catatan:**

- `allowed_apps` bisa berupa JSON string atau array — berisi kode aplikasi yang boleh diakses departemen
- `icon_type`: `"emoji"` atau `"upload"`
- `icon`: emoji string (misal "💻") atau path file (misal "/uploads/icons/it.png")

---

#### `POST /api/departments`

Buat departemen baru (admin-only).

**Request:** `multipart/form-data` atau `application/json`

| Field       | Type        | Required                    |
| ----------- | ----------- | --------------------------- |
| name        | string      | ✅                          |
| code        | string      | ✅ (unique)                 |
| description | string      | ❌                          |
| icon        | string/File | ❌ (emoji atau file upload) |
| color       | string      | ❌ (hex color: "#3b82f6")   |

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
        { "application_code": "OODO", "enabled": false }
      ]
    }
  ]
}
```

- `id` = department ID
- `permissions` = array { application_code, enabled }

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

**Request Body:**

```json
{
  "name": "Software Engineer",
  "code": "SE",
  "description": "Develops and maintains software"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Position created successfully"
}
```

---

#### `PUT /api/positions/:id`

**Request Body:** Sama seperti POST.

---

#### `DELETE /api/positions/:id`

**Response:**

```json
{
  "success": true,
  "message": "Position deleted successfully"
}
```

---

### 4.7 Roles — Manajemen Role

#### `GET /api/roles`

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

---

#### `POST /api/roles`

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

**Request Body:** Sama seperti POST.

---

#### `DELETE /api/roles/:id`

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

### 4.8 Menus — Manajemen Menu Sidebar Admin

#### `GET /api/menus`

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

**Request Body:** Sama seperti POST.

---

#### `DELETE /api/menus/:id`

---

### 4.9 Broadcasts — Manajemen Pengumuman

#### `GET /api/broadcasts`

Ambil semua broadcast.

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

- `priority`: `"urgent"` | `"high"` | `"normal"`
- `target_audience`: `"all"` | `"admin"` | `"staff"`

---

#### `GET /api/broadcasts/active`

Broadcast yang masih aktif (belum expired). Frontend mengirim query param `?t=<timestamp>` untuk cache-busting — abaikan saja.

---

#### `GET /api/broadcasts/history`

Broadcast yang sudah expired atau di-soft-delete. Frontend mengirim `?t=<timestamp>`.

**Response tambahan field:**

```json
{
  "deleted_at": "2026-02-01T00:00:00Z"
}
```

---

#### `POST /api/broadcasts`

Buat broadcast baru (admin-only).

> **Security:** Backend mengambil `admin_id` dari JWT token, bukan dari request body.

**Request Body:**

```json
{
  "title": "System Maintenance",
  "message": "Portal akan maintenance...",
  "priority": "urgent",
  "target_audience": "all",
  "expires_at": "2026-03-10T23:59:59Z"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Broadcast created successfully"
}
```

---

#### `DELETE /api/broadcasts/:id`

Soft-delete broadcast.

> **Security:** Backend mengambil admin identity dari JWT token — tidak perlu query param `admin_id`.

**Logika:** Set `deleted_at` = NOW(), `deleted_by` = user dari JWT (jangan hard-delete, agar masih muncul di history).

**Response:**

```json
{
  "success": true,
  "message": "Broadcast deleted successfully"
}
```

---

### 4.10 Dashboard Stats — Statistik Admin

#### `GET /api/dashboard/stats`

Ambil seluruh statistik untuk Dashboard Admin dalam **satu request**.

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

| Field                  | Deskripsi                                      |
| ---------------------- | ---------------------------------------------- |
| `activeSessionCount`   | Jumlah session aktif saat ini                  |
| `totalApplications`    | Total aplikasi terdaftar                       |
| `totalDepartments`     | Total departemen                               |
| `totalUsers`           | Total user terdaftar                           |
| `recentSessions`       | 5-10 session terbaru (tabel "Recent Activity") |
| `departmentStats`      | Jumlah user per departemen (pie chart)         |
| `activeSessionsByDept` | Session aktif per departemen (bar chart)       |
| `topActiveApps`        | App paling banyak digunakan saat ini (chart)   |

---

### 4.11 Analytics — Tren Login

#### `GET /api/analytics/trends`

Tren login harian (7-30 hari terakhir, untuk line chart).

**Response:**

```json
{
  "success": true,
  "data": [
    { "day": "2026-02-26", "count": 45 },
    { "day": "2026-02-27", "count": 52 },
    { "day": "2026-03-04", "count": 32 }
  ]
}
```

---

### 4.12 Login History — Riwayat Login

#### `GET /api/login-history/user/:userId`

Riwayat login user (untuk "Recent Login Activity" di Profile).

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

**Catatan:** Backend harus membuat record di `login_history` setiap kali user berhasil login (di endpoint login dan microsoft login).

---

### ~~4.13 Device Info~~ (Dihapus)

> **Endpoint `GET /api/device-info` tidak diperlukan.**
>
> **Alasan arsitektur:** Saat request login masuk (`POST /login` atau `POST /sessions`), request tersebut sudah membawa semua informasi yang dibutuhkan:
>
> | Data           | Sumber                                            |
> | -------------- | ------------------------------------------------- |
> | IP Address     | `req.ip` atau header `X-Forwarded-For`            |
> | Browser        | Parse `User-Agent` header                         |
> | OS & Version   | Parse `User-Agent` header                         |
> | Device Type    | Parse `User-Agent` (desktop/mobile/tablet)        |
> | City / Country | IP geolocation (ip-api.com / ipinfo.io / MaxMind) |
>
> **Flow yang benar:**
>
> ```
> Login berhasil → Backend extract device info dari headers → Create login_history → Create session
> ```
>
> Backend menyimpan data device di tabel `sessions` dan `login_history`. Frontend cukup **membaca** data tersebut dari endpoint yang sudah ada:
>
> - `GET /api/sessions` — admin melihat semua active sessions + device info
> - `GET /api/sessions/me` — user melihat session sendiri
> - `GET /api/login-history/user/:userId` — riwayat login + device info
>
> Frontend **tidak perlu** mendeteksi atau mengirim device info ke backend.

---

## 5. Database Schema (Rekomendasi)

> **Catatan:** Schema di bawah ini adalah **rekomendasi** berdasarkan kebutuhan frontend. Tim backend bebas menyesuaikan nama kolom, tipe data, indexing, dan struktur tabel — selama response API tetap sesuai kontrak yang sudah didefinisikan di bagian 4. Schema ini ditujukan sebagai referensi agar backend memahami data apa saja yang diperlukan.

```sql
-- =============================================
-- TABEL USERS
-- =============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'User',
  status VARCHAR(20) DEFAULT 'active',
  department VARCHAR(100),
  position VARCHAR(100),
  avatar VARCHAR(255),
  phone VARCHAR(20),
  microsoft_id VARCHAR(255),
  auth_provider VARCHAR(20) DEFAULT 'local',
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
  app_name VARCHAR(100) DEFAULT '-',
  ip_address VARCHAR(45),
  browser VARCHAR(100),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(20),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100),
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABEL LOGIN_HISTORY
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
-- TABEL PASSWORD_RESETS
-- =============================================
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  INDEX idx_email (email)
);

-- =============================================
-- TABEL APPLICATIONS
-- =============================================
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  url VARCHAR(255),
  icon VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
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
  icon VARCHAR(255),
  icon_type VARCHAR(20),
  color VARCHAR(10),
  allowed_apps JSON,
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
  permissions JSON,
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
  icon VARCHAR(50),
  customIcon TEXT,
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
  priority VARCHAR(10) DEFAULT 'normal',
  target_audience VARCHAR(20) DEFAULT 'all',
  admin_id INT,
  expires_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 6. File Upload

Backend harus bisa menerima file upload via `multipart/form-data`.

### Konfigurasi

| Setting               | Nilai                                       |
| --------------------- | ------------------------------------------- |
| Max file size         | 5 MB (rekomendasi)                          |
| Format yang diizinkan | PNG, JPG, JPEG, SVG                         |
| Folder simpan avatar  | `/uploads/avatars/`                         |
| Folder simpan icon    | `/uploads/icons/`                           |
| Serve static          | Serve folder `/uploads` sebagai static file |

### Endpoint yang menerima file

| Endpoint                    | Field name | Kegunaan                           |
| --------------------------- | ---------- | ---------------------------------- |
| `POST /api/users`           | `avatar`   | Avatar user                        |
| `POST /api/applications`    | `icon`     | Icon aplikasi                      |
| `PUT /api/applications/:id` | `icon`     | Update icon aplikasi               |
| `POST /api/departments`     | `icon`     | Icon departemen (jika bukan emoji) |
| `PUT /api/departments/:id`  | `icon`     | Update icon departemen             |

### Return path

Setelah upload berhasil, simpan path relatif: `/uploads/avatars/filename.jpg` dan return path ini di response data.

---

---

## 7. Kebutuhan Fungsional Backend

Backend harus menyediakan kapabilitas berikut (library/implementasi bebas):

| Kebutuhan                  | Deskripsi                                                       |
| -------------------------- | --------------------------------------------------------------- |
| JWT                        | Generate & verify JSON Web Token                                |
| Password hashing           | Hash password secara aman (bcrypt, argon2, scrypt, atau setara) |
| Cookie handling            | Set & read httpOnly cookie                                      |
| File upload                | Handle `multipart/form-data` upload                             |
| User-Agent parsing         | Ekstrak browser, OS, device type dari header User-Agent         |
| IP Geolocation             | Dapatkan city/region/country dari IP address (opsional)         |
| Microsoft token validation | Validasi `id_token` dari Azure AD menggunakan JWKS              |
| CORS                       | Setup CORS untuk production                                     |
| Email sending              | Kirim email reset password                                      |
| Rate limiting              | Batasi request berlebihan (terutama endpoint forgot-password)   |
| Static file serving        | Serve folder `/uploads` sebagai file statis                     |

---

## 8. Catatan untuk Diskusi Tim

Beberapa hal yang sebaiknya didiskusikan antara tim frontend dan backend sebelum mulai development:

| Topik                     | Penjelasan                                                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Versioning**        | Apakah menggunakan `/api/v1` atau `/api`? Disarankan pakai versioning dari awal                                                                                                                      |
| **Session Architecture**  | Hybrid (JWT + session table) seperti di dokumen ini, atau session ID + Redis/DB? Frontend bisa menyesuaikan                                                                                          |
| **POST /sessions**        | Tetap endpoint terpisah, atau digabung ke dalam proses login internal?                                                                                                                               |
| **User Filter Endpoints** | Pakai endpoint terpisah (`/users/inactive`, `/users/admins`) atau query params (`/users?status=inactive`)?                                                                                           |
| **Pagination**            | Endpoint yang mengembalikan list data besar (`/users`, `/login-history`, `/sessions`, `/broadcasts`) sebaiknya support pagination. Disarankan format: `?page=1&limit=20`. Frontend akan menyesuaikan |
| **Error Codes**           | Apakah backend akan menyertakan `errorCode` di response error? Sangat direkomendasikan untuk debugging                                                                                               |
| **Base URL**              | Koordinasi base URL dan port backend yang final                                                                                                                                                      |
| **Azure Client ID**       | Koordinasi MSAL Client ID yang akan digunakan                                                                                                                                                        |

---

> **Catatan Akhir:** Dokumen ini dibuat berdasarkan analisis seluruh kode frontend Portal Somagede. Setiap endpoint, request body, dan response format sudah disesuaikan dengan apa yang frontend kirim dan harapkan. Tim backend **bebas menentukan** bahasa pemrograman, framework, database, dan konfigurasi server — selama kontrak API (endpoint, format request/response) diikuti sesuai dokumen ini. Bagian-bagian yang bersifat fleksibel sudah ditandai dengan catatan "Alternatif" atau "Rekomendasi". Jika ada pertanyaan, silakan koordinasi dengan tim frontend.
