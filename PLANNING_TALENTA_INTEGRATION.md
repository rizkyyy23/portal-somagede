# Planning: Integrasi Talenta API & Microsoft Login

> Dokumen ini berisi persiapan dan penyesuaian yang harus dilakukan oleh **frontend developer** untuk integrasi Talenta API dan perbaikan alur Microsoft Login.

---

## Status Saat Ini

### Login Email/Password ✅ Sudah Benar

```
User input email + password
  → POST /api/users/login
  → Backend validasi + set httpOnly cookie (JWT) + return user data
  → Frontend simpan user data ke localStorage → navigate ke Dashboard
```

### Login Microsoft ⚠️ BELUM BENAR

```
User klik Microsoft Login
  → MSAL popup → dapat loginResponse
  → Langsung simpan msalAccount ke localStorage
  → Langsung navigate ke Dashboard (TANPA validasi backend!)
```

---

## BAGIAN 1: Perbaikan Alur Microsoft Login

### Alur yang Seharusnya

```
User klik Microsoft Login
  → MSAL popup → dapat loginResponse (berisi id_token, email, microsoft_id)
  → POST /api/auth/microsoft ke backend
     Body: { microsoft_id, email, id_token }
  → Backend validasi token + cek user di DB → set httpOnly cookie (JWT) + return user data
  → Frontend simpan user data ke localStorage (bukan token)
  → POST /api/sessions (buat active session)
  → Navigate ke Dashboard
```

### File yang Perlu Diubah

#### 1. `src/pages/Login.jsx` — onLoginSuccess callback

**SEBELUM (saat ini):**

```jsx
<MicrosoftLoginButton
  onLoginSuccess={(loginResponse) => {
    localStorage.setItem("msalAccount", JSON.stringify(loginResponse.account));
    navigate("/dashboard");
  }}
  disabled={isLoading}
/>
```

**SESUDAH (yang benar):**

```jsx
<MicrosoftLoginButton
  onLoginSuccess={async (loginResponse) => {
    setIsLoading(true);
    setError("");

    try {
      const account = loginResponse.account;

      // 1. Kirim data Microsoft ke backend untuk validasi
      const result = await api.post("/auth/microsoft", {
        microsoft_id: account.localAccountId,
        email: account.username,
        name: account.name,
        id_token: loginResponse.idToken,
      });

      if (!result.success) {
        setError(
          result.message || "Microsoft login failed. Account not registered.",
        );
        setIsLoading(false);
        return;
      }

      const userData = result.data;

      // 2. Tentukan user type
      const userRole = userData.role?.toLowerCase();
      const userType = userRole === "admin" ? "admin" : "user";

      // 3. Simpan user data ke localStorage (token tidak disimpan, pakai httpOnly cookie)
      localStorage.setItem("userType", userType);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("msalAccount", JSON.stringify(account));
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userData.id,
          name: userData.name,
          role:
            userData.role?.toUpperCase() ||
            (userType === "admin" ? "ADMIN" : "USER"),
          department: userData.department,
          position: userData.position,
          avatar: userData.avatar || null,
        }),
      );

      // 4. Buat active session
      try {
        await api.post("/sessions", {
          user_id: userData.id,
          user_name: userData.name,
          user_email: userData.email,
          department: userData.department,
          role: userData.role || (userType === "admin" ? "Admin" : "User"),
          app_name: "-",
        });
      } catch (sessionError) {
        console.error("Session creation failed:", sessionError);
      }

      // 5. Navigate ke dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Microsoft login error:", error);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }}
  disabled={isLoading}
/>
```

#### 2. Backend Endpoint yang Dibutuhkan (untuk dummy)

```
POST /api/auth/microsoft
```

**Request Body:**

```json
{
  "microsoft_id": "abc123-def456-...",
  "email": "user@somagede.com",
  "name": "John Doe",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response Sukses:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@somagede.com",
    "phone": "0812-3456-7890",
    "department": "Information Technology",
    "position": "Staff",
    "role": "User",
    "status": "active",
    "employee_id": "EMP001",
    "avatar": null
  }
}
```

**Response Gagal (user belum terdaftar):**

```json
{
  "success": false,
  "message": "Account not registered. Please contact your administrator."
}
```

---

## BAGIAN 2: Data yang Dikirim Frontend ke Backend

### Semua POST/PUT yang dilakukan frontend:

| #   | Method | Endpoint                         | Body                                                                           | Keterangan                              |
| --- | ------ | -------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| 1   | POST   | `/api/users/login`               | `{ email, password }`                                                          | Login email/password                    |
| 2   | POST   | `/api/auth/microsoft`            | `{ microsoft_id, email, name, id_token }`                                      | Login Microsoft **(BARU)**              |
| 3   | POST   | `/api/sessions`                  | `{ user_id, user_name, user_email, department, role, app_name }`               | Buat active session saat login          |
| 4   | PUT    | `/api/sessions/update-app`       | `{ user_id, app_name }`                                                        | Update active app (saat buka/tutup app) |
| 5   | DELETE | `/api/sessions/:id`              | -                                                                              | Force logout session (admin)            |
| 6   | DELETE | `/api/sessions/user/:userId`     | -                                                                              | Hapus semua session user (saat logout)  |
| 7   | PUT    | `/api/users/:id/change-password` | `{ currentPassword, newPassword }`                                             | Ganti password                          |
| 8   | POST   | `/api/users`                     | FormData: `{ name, email, password, role, department, position, avatar, ... }` | Tambah user (admin)                     |
| 9   | POST   | `/api/departments`               | `{ name, code, description, icon, icon_type, color }`                          | Tambah department                       |
| 10  | PUT    | `/api/departments/:id`           | `{ name, code, description, icon, icon_type, color }`                          | Edit department                         |
| 11  | DELETE | `/api/departments/:id`           | -                                                                              | Hapus department                        |
| 12  | POST   | `/api/positions`                 | `{ name, code, description }`                                                  | Tambah position                         |
| 13  | PUT    | `/api/positions/:id`             | `{ name, code, description }`                                                  | Edit position                           |
| 14  | DELETE | `/api/positions/:id`             | -                                                                              | Hapus position                          |
| 15  | POST   | `/api/broadcasts`                | FormData: `{ title, message, priority, target_departments, attachment }`       | Kirim broadcast                         |

### Semua GET yang dilakukan frontend:

| #   | Endpoint                          | Dipakai di                     | Response Format                                                                                                                                                       |
| --- | --------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/users/:id`                  | Profile, Dashboard             | `{ success, data: { id, name, email, phone, department, position, role, status, employee_id, avatar, password_changed_at } }`                                         |
| 2   | `/api/users`                      | UserControl                    | `{ success, data: [{ id, name, email, department, position, role, status, avatar, ... }] }`                                                                           |
| 3   | `/api/users/:id/privileges`       | Dashboard, UserControl         | `{ success, data: [{ application_id }] }`                                                                                                                             |
| 4   | `/api/departments`                | Multiple pages                 | `{ success, data: [{ id, name, code, description, icon, icon_type, color }] }`                                                                                        |
| 5   | `/api/departments/permissions`    | ApplicationManagement          | `{ success, data: [{ id, permissions: [{ application_code, enabled }] }] }`                                                                                           |
| 6   | `/api/positions`                  | UserControl, MasterPositions   | `{ success, data: [{ id, name, code, description, userCount }] }`                                                                                                     |
| 7   | `/api/roles`                      | UserControl                    | `{ success, data: [...] }`                                                                                                                                            |
| 8   | `/api/sessions`                   | ActiveSession, DashboardAdmin  | `{ success, data: [{ id, user_id, user_name, user_email, user_avatar, department, role, app_name, ip_address, login_at, browser, os, device_type, city, country }] }` |
| 9   | `/api/sessions/user/:userId`      | Profile, SessionExpiredOverlay | `{ success, data: [...sessions] }`                                                                                                                                    |
| 10  | `/api/login-history/user/:userId` | Profile                        | `{ success, data: [...history] }`                                                                                                                                     |
| 11  | `/api/device-info`                | Profile                        | `{ success, data: { ip, city, region, country } }`                                                                                                                    |
| 12  | `/api/applications`               | UserControl                    | `{ success, data: [{ id, name, code, ... }] }`                                                                                                                        |
| 13  | `/api/applications/categories`    | Dashboard                      | `{ success, data: { "Category": [{ id, name, code, url, icon, ... }] } }`                                                                                             |
| 14  | `/api/broadcasts`                 | Dashboard                      | `{ success, data: [...] }`                                                                                                                                            |
| 15  | `/api/broadcasts/active`          | DashboardAdmin                 | `{ success, data: [...] }`                                                                                                                                            |
| 16  | `/api/dashboard/stats`            | DashboardAdmin                 | `{ success, data: { totalUsers, activeUsers, ... } }`                                                                                                                 |
| 17  | `/api/analytics/trends`           | DashboardAdmin                 | `{ success, data: [...] }`                                                                                                                                            |

---

## BAGIAN 3: localStorage Structure

| Key               | Tipe        | Value                                              | Diset di                     |
| ----------------- | ----------- | -------------------------------------------------- | ---------------------------- |
| `userType`        | string      | `"admin"` atau `"user"`                            | Login.jsx                    |
| `userEmail`       | string      | Email user                                         | Login.jsx                    |
| `user`            | JSON string | `{ id, name, role, department, position, avatar }` | Login.jsx                    |
| `rememberedEmail` | string      | Email (persist antar session)                      | Login.jsx (jika Remember Me) |
| `msalAccount`     | JSON string | MSAL account object                                | Login.jsx (Microsoft login)  |

> **Catatan:** Token (JWT) TIDAK ada di localStorage. JWT disimpan di httpOnly cookie, dikelola sepenuhnya oleh browser.

---

## BAGIAN 4: Mapping Data Talenta → Portal

Data user dari Talenta API (`GET /employee`) yang relevan untuk portal:

| Field Talenta                            | Field Portal                | Dipakai di                  |
| ---------------------------------------- | --------------------------- | --------------------------- |
| `user_id`                                | `talenta_user_id` (mapping) | Backend internal            |
| `employee_id`                            | `employee_id`               | Profile                     |
| `full_name` / `first_name` + `last_name` | `name`                      | Semua halaman               |
| `email`                                  | `email`                     | Login, Profile, Session     |
| `mobile_phone`                           | `phone`                     | Profile                     |
| `organization.name`                      | `department`                | Profile, Dashboard, Session |
| `job_position.name`                      | `position`                  | Profile                     |
| `employment_status`                      | `status`                    | Profile, UserControl        |
| `photo_url`                              | `avatar`                    | Profile, Dashboard          |

> **Catatan:** Backend yang handle mapping ini. Frontend tidak perlu tahu field Talenta — selama backend return format response yang sama seperti tabel di Bagian 2.

---

## BAGIAN 5: Checklist Eksekusi

### Frontend (Anda):

- [x] **Ubah `onLoginSuccess` di Login.jsx** — POST ke backend sebelum navigate ✅ DONE
- [x] **Refactor login logic** — `storeUserAndCreateSession()` shared function untuk email & Microsoft login ✅ DONE
- [x] **Update ProtectedRoute** — cek autentikasi dari localStorage user data (cookie dikirim otomatis oleh browser) ✅ DONE
- [ ] **Test Microsoft login flow** — pastikan POST `/api/auth/microsoft` dipanggil (butuh backend endpoint)
- [ ] **Test error handling** — jika user Microsoft belum terdaftar, tampilkan pesan error

### Backend (tim lain / dummy Anda):

- [ ] Buat endpoint `POST /api/auth/microsoft` — terima `{ microsoft_id, email, name, id_token }`, generate JWT, set httpOnly cookie, return user data
- [ ] Validasi `id_token` dari Microsoft (verify signature via JWKS)
- [ ] Cek apakah email terdaftar di database (data dari Talenta sync)
- [ ] Tambah kolom `microsoft_id` di tabel users (untuk link account)
- [ ] Tambah kolom `talenta_user_id` di tabel users
- [ ] Buat HMAC utility untuk Talenta API authentication
- [ ] Buat sync service: fetch data dari Talenta → update database
- [ ] Buat `.env` config untuk Talenta credentials

---

## BAGIAN 6: Kontrak API untuk Tim Backend

Berikan dokumen ini ke tim backend. Yang penting mereka tahu:

1. **Response format harus konsisten** — selalu `{ success: boolean, data: ..., message: string }`
2. **User data structure** — harus punya field: `id, name, email, phone, department, position, role, status, employee_id, avatar, token`
3. **Session data structure** — harus punya field: `id, user_id, user_name, user_email, user_avatar, department, role, app_name, ip_address, login_at, browser, os, device_type, city, country`
4. **Endpoint baru yang dibutuhkan** — `POST /api/auth/microsoft`
5. **Backend auto-detect** — IP, browser, OS, device_type, city, country saat `POST /api/sessions`

---

## BAGIAN 7: Data Talenta API yang Diperlukan

### Endpoint Talenta yang Dibutuhkan (hanya 3)

| #   | Endpoint                        | Scope Permission                    | Fungsi                      |
| --- | ------------------------------- | ----------------------------------- | --------------------------- |
| 1   | `GET /employee?limit=...`       | `talenta:employee:list`             | Ambil semua data karyawan   |
| 2   | `GET /company/:id/organization` | `talenta:company:organization:list` | Ambil daftar department     |
| 3   | `GET /company/:id/job-position` | `talenta:company:job-position:list` | Ambil daftar posisi/jabatan |

### Data Karyawan dari Talenta → Mapping ke Portal

| Data            | Field Talenta                                 | Field Portal      | Dipakai di                          |
| --------------- | --------------------------------------------- | ----------------- | ----------------------------------- |
| Nama lengkap    | `full_name` / `first_name` + `last_name`      | `name`            | Semua halaman                       |
| Email           | `email`                                       | `email`           | Login, Profile, Session             |
| Nomor HP        | `mobile_phone`                                | `phone`           | Profile                             |
| Department      | `organization.name`                           | `department`      | Profile, Dashboard, Session, Filter |
| Posisi/Jabatan  | `job_position.name`                           | `position`        | Profile, Dashboard                  |
| Employee ID     | `employee_id`                                 | `employee_id`     | Profile                             |
| Status karyawan | `employment_status` (active/resign/probation) | `status`          | Profile, UserControl                |
| Foto profil     | `photo` / `photo_url`                         | `avatar`          | Profile, Dashboard, Session         |
| User ID Talenta | `user_id`                                     | `talenta_user_id` | Backend internal (mapping)          |

### Data Department dari Talenta → Mapping ke Portal

| Data            | Field Talenta | Field Portal               |
| --------------- | ------------- | -------------------------- |
| Nama department | `name`        | `name`                     |
| Kode department | `code`        | `code`                     |
| ID Talenta      | `id`          | `talenta_org_id` (mapping) |

### Data Posisi dari Talenta → Mapping ke Portal

| Data        | Field Talenta | Field Portal                    |
| ----------- | ------------- | ------------------------------- |
| Nama posisi | `name`        | `name`                          |
| Kode posisi | `code`        | `code`                          |
| ID Talenta  | `id`          | `talenta_position_id` (mapping) |

### Scope Permission yang Harus Diminta ke Mekari

Saat request HMAC credentials, minta **3 scope** saja:

1. `talenta:employee:list`
2. `talenta:company:organization:list`
3. `talenta:company:job-position:list`

### Yang TIDAK Diperlukan dari Talenta

Portal tidak menggunakan fitur berikut, jadi **tidak perlu** minta scope-nya:

- ❌ Attendance / Live Attendance
- ❌ Time Off / Cuti
- ❌ Payroll / Gaji
- ❌ Reimbursement
- ❌ Shift / Overtime
- ❌ Loan
- ❌ Performance Review
- ❌ Recruitment
- ❌ Cost Center
- ❌ Report

---

_Dokumen ini dibuat: 4 Maret 2026_
_Terakhir diupdate: 4 Maret 2026_
