# 📖 Penjelasan Lengkap Kode Program - Portal Somagede

## Daftar Isi

**Bagian A — Konsep & Konfigurasi**

1. [Konsep Dasar React](#1-konsep-dasar-react)
2. [Konfigurasi Project](#2-konfigurasi-project)

**Bagian B — Halaman Utama (Pages)** 3. [Profile.jsx — Halaman Profil User](#3-profilejsx---halaman-profil-user) 4. [Dashboard.jsx — Halaman Dashboard User](#4-dashboardjsx---halaman-dashboard-user) 5. [Login.jsx — Halaman Login](#5-loginjsx---halaman-login) 6. [Settings.jsx — Halaman Pengaturan](#6-settingsjsx---halaman-pengaturan)

**Bagian C — Components (Komponen Pendukung)** 7. [App.jsx — Router Utama](#7-appjsx---router-utama) 8. [main.jsx — Entry Point Aplikasi](#8-mainjsx---entry-point-aplikasi) 9. [ProtectedRoute.jsx — Penjaga Halaman](#9-protectedroutejsx---penjaga-halaman) 10. [AdminLayout.jsx — Layout Admin](#10-adminlayoutjsx---layout-admin) 11. [Sidebar.jsx — Sidebar Admin](#11-sidebarjsx---sidebar-admin) 12. [Toast.jsx & ToastContext.jsx — Notifikasi](#12-toastjsx--toastcontextjsx---notifikasi) 13. [Navbar.jsx — Navbar Placeholder](#13-navbarjsx---navbar-placeholder)

**Bagian D — Halaman Admin** 14. [DashboardAdmin.jsx — Dashboard Admin](#14-dashboardadminjsx---dashboard-admin) 15. [ActiveSession.jsx — Sesi Aktif](#15-activesessionjsx---sesi-aktif) 16. [UserControl.jsx — Manajemen User](#16-usercontroljsx---manajemen-user) 17. [ApplicationManagement.jsx — Hak Akses Aplikasi](#17-applicationmanagementjsx---hak-akses-aplikasi) 18. [Broadcast.jsx — Broadcast Center](#18-broadcastjsx---broadcast-center)

**Bagian E — Halaman Master Data** 19. [MasterDepartments.jsx — Master Departemen](#19-masterdepartmentsjsx---master-departemen) 20. [MasterApplications.jsx — Master Aplikasi](#20-masterapplicationsjsx---master-aplikasi) 21. [MasterRoles.jsx — Master Roles](#21-masterrolesjsx---master-roles) 22. [MasterPositions.jsx — Master Posisi](#22-masterpositionsjsx---master-posisi)

**Bagian F — Backend** 23. [Arsitektur Backend](#23-arsitektur-backend) 24. [server.js — Entry Point Backend](#24-serverjs---entry-point-backend) 25. [config/database.js — Koneksi Database](#25-configdatabasejs---koneksi-database) 26. [Controllers — Business Logic](#26-controllers---business-logic) 27. [Routes — Routing API](#27-routes---routing-api) 28. [Utils — Utility Functions](#28-utils---utility-functions)

**Bagian G — Referensi** 29. [Daftar Semua API Endpoints](#29-daftar-semua-api-endpoints) 30. [Glosarium Istilah](#30-glosarium-istilah)

---

## 1. Konsep Dasar React

Sebelum masuk ke kode, pahami dulu konsep-konsep ini:

### 1.1 Apa itu JSX?

JSX adalah cara menulis HTML di dalam JavaScript. Contoh:

```jsx
// Ini JSX (HTML di dalam JavaScript)
return <div className="box">Hello World</div>;
```

**Perbedaan dengan HTML biasa:**

| HTML                 | JSX                        | Penjelasan                      |
| -------------------- | -------------------------- | ------------------------------- |
| `class="box"`        | `className="box"`          | `class` adalah kata kunci di JS |
| `onclick="..."`      | `onClick={...}`            | Event pakai camelCase           |
| `style="color: red"` | `style={{ color: 'red' }}` | Style pakai object JS           |
| `<img>`              | `<img />`                  | Semua tag harus ditutup         |

### 1.2 Apa itu Component?

Component = bagian UI yang bisa dipakai ulang. Mirip seperti "template" yang bisa diisi data berbeda.

```jsx
// Ini adalah sebuah component
export default function Profile() {
  return <div>Halaman Profile</div>;
}
```

### 1.3 Apa itu State? (`useState`)

State = **data yang bisa berubah** dan ketika berubah, tampilan (UI) otomatis ikut berubah.

```jsx
const [nama, setNama] = useState("Budi");
// nama     → nilai saat ini ("Budi")
// setNama  → fungsi untuk mengubah nilai
// "Budi"   → nilai awal

// Cara mengubah:
setNama("Andi"); // Sekarang nama = "Andi", dan tampilan otomatis update
```

**Analogi sederhana:** State itu seperti papan tulis. Ketika kamu hapus dan tulis ulang isinya, semua orang yang melihat papan tulis langsung melihat perubahan.

### 1.4 Apa itu Effect? (`useEffect`)

Effect = **kode yang dijalankan otomatis** pada waktu tertentu.

```jsx
// Dijalankan SEKALI saat halaman pertama kali dibuka
useEffect(() => {
  fetchUserData(); // ambil data user dari server
}, []); // [] artinya "hanya sekali"
```

**Analogi:** `useEffect(() => {...}, [])` itu seperti instruksi: "Saat baru masuk ruangan, lakukan ini."

### 1.5 Apa itu Props?

Props = **data yang dikirim dari component induk ke component anak**.

```jsx
// Induk mengirim data
<Navbar userName="Alex" />;

// Anak menerima data
function Navbar({ userName }) {
  return <div>Halo, {userName}</div>;
}
```

### 1.6 Apa itu `navigate`? (`useNavigate`)

`navigate` = fungsi untuk **berpindah halaman** tanpa reload.

```jsx
const navigate = useNavigate();
navigate("/login"); // pindah ke halaman login
navigate(-1); // kembali ke halaman sebelumnya (seperti tombol Back)
```

### 1.7 Apa itu `async/await`?

Digunakan untuk **menunggu proses yang butuh waktu** (seperti mengambil data dari server).

```jsx
const fetchData = async () => {
  // async = fungsi ini bisa "menunggu"
  const response = await fetch("/api"); // await = tunggu sampai dapat respons
  const data = await response.json(); // await = tunggu sampai data diproses
};
```

**Analogi:** Seperti memesan makanan di restoran. `await` = menunggu makanan datang sebelum mulai makan.

### 1.8 Apa itu Conditional Rendering?

Menampilkan sesuatu **hanya jika kondisi terpenuhi**.

```jsx
// Operator &&: tampilkan HANYA JIKA kondisi true
{
  isAdmin && <button>Admin Panel</button>;
}

// Ternary operator: jika A maka B, kalau tidak maka C
{
  loading ? <div>Loading...</div> : <div>Selesai!</div>;
}
```

### 1.9 Apa itu `?.` (Optional Chaining)?

Cara **aman mengakses data** yang mungkin tidak ada (null/undefined).

```jsx
// BAHAYA: jika user null, akan error
user.name;

// AMAN: jika user null, hasilnya undefined (tidak error)
user?.name;

// Bisa berantai:
user?.address?.city; // aman meskipun user atau address null
```

### 1.10 Apa itu `localStorage`?

Tempat penyimpanan data **di browser pengguna** yang tetap ada meskipun browser ditutup.

```jsx
// Menyimpan data
localStorage.setItem("user", JSON.stringify({ id: 1, name: "Alex" }));

// Membaca data
const user = JSON.parse(localStorage.getItem("user"));

// Menghapus data
localStorage.removeItem("user");
```

---

## 2. Konfigurasi Project

### 2.1 package.json — Daftar Dependencies

File ini mendefinisikan **semua package/library** yang digunakan project.

**Dependencies utama frontend:**

| Package            | Versi   | Fungsi                                         |
| ------------------ | ------- | ---------------------------------------------- |
| `react`            | 19.2.0  | Library utama untuk membuat UI                 |
| `react-dom`        | 19.2.0  | Untuk me-render React ke browser               |
| `react-router-dom` | 7.13.0  | Navigasi antar halaman (routing)               |
| `recharts`         | 3.1.0   | Library chart/grafik (BarChart, PieChart, dll) |
| `lucide-react`     | 0.513.0 | Library ikon modern                            |

**Dev dependencies:**

| Package                | Fungsi                                                   |
| ---------------------- | -------------------------------------------------------- |
| `vite` 7.2.4           | Build tool & dev server (pengganti webpack, lebih cepat) |
| `@vitejs/plugin-react` | Plugin Vite untuk mendukung React                        |
| `eslint`               | Linter — mendeteksi kesalahan kode                       |

### 2.2 vite.config.js — Konfigurasi Vite

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

**Apa itu Proxy?**

Proxy = **perantara** yang meneruskan request ke server lain.

```
Browser → localhost:5173/api/users → Vite Proxy → localhost:3001/api/users → Backend
                                     ↑
                              Frontend dev server
                              meneruskan ke Backend
```

**Kenapa perlu proxy?**

- Frontend berjalan di port **5173** (Vite)
- Backend berjalan di port **3001** (Express)
- Tanpa proxy, browser akan memblokir request karena **CORS** (Cross-Origin Resource Sharing)
- Dengan proxy, semua request `/api/*` otomatis diteruskan ke backend

### 2.3 index.html — File HTML Utama

File HTML satu-satunya di project ini. React "menyuntikkan" seluruh aplikasi ke dalam `<div id="root">`.

```html
<div id="root"></div>
← React akan mengisi div ini
<script type="module" src="/src/main.jsx"></script>
← Entry point JS
```

---

## 3. Profile.jsx — Halaman Profil User

### 3.1 Import (Baris 1-3)

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";
```

| Kode                             | Penjelasan                                   |
| -------------------------------- | -------------------------------------------- |
| `useState`                       | Untuk membuat state (data yang bisa berubah) |
| `useEffect`                      | Untuk menjalankan kode saat halaman dibuka   |
| `useNavigate`                    | Untuk pindah halaman                         |
| `import "../styles/profile.css"` | Mengimpor file CSS untuk styling             |

### 3.2 Konstanta API

```jsx
const API_URL = "/api";
```

Base URL untuk semua panggilan API ke backend. Misalnya `/api/users/1` akan menjadi request ke backend. Kenapa `/api` bukan `http://localhost:3001/api`? Karena Vite sudah dikonfigurasi untuk **proxy** — secara otomatis meneruskan request `/api/*` ke `localhost:3001`.

### 3.3 Deklarasi Component & State

```jsx
export default function Profile() {
  const navigate = useNavigate();
```

- `export default` = component ini bisa diimpor oleh file lain
- `function Profile()` = nama component-nya adalah Profile
- `navigate` = fungsi untuk pindah halaman

#### Semua State yang Digunakan:

```jsx
const [activeTab, setActiveTab] = useState("personal");
```

**Fungsi:** Menyimpan tab mana yang sedang aktif.

- Nilai: `"personal"` atau `"settings"`
- Saat user klik tab, dipanggil `setActiveTab("settings")` → UI berubah ke tab Settings

```jsx
const [loading, setLoading] = useState(true);
```

**Fungsi:** Menandai apakah data masih dimuat dari server.

- `true` = tampilkan "Loading..."
- `false` = tampilkan halaman profil

```jsx
const [userData, setUserData] = useState(null);
```

**Fungsi:** Menyimpan data user yang diambil dari database.

- Awalnya `null` (belum ada data)
- Setelah fetch berhasil, berisi object seperti: `{ id: 1, name: "Alex", email: "alex@...", department: "HR", ... }`

```jsx
const [showLoginModal, setShowLoginModal] = useState(false);
```

**Fungsi:** Mengontrol apakah modal "Recent Login Activity" terbuka atau tertutup.

- `false` = modal tersembunyi
- `true` = modal tampil

```jsx
const [showPasswordModal, setShowPasswordModal] = useState(false);
```

**Fungsi:** Mengontrol apakah modal "Update Password" terbuka atau tertutup.

```jsx
const [passwordForm, setPasswordForm] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
```

**Fungsi:** Menyimpan nilai dari semua input di form password.

- Object dengan 3 field: password saat ini, password baru, dan konfirmasi
- Setiap kali user mengetik, salah satu field di-update

```jsx
const [showPassFields, setShowPassFields] = useState({
  current: false,
  new: false,
  confirm: false,
});
```

**Fungsi:** Mengontrol apakah password ditampilkan sebagai teks atau disembunyikan (\*\*\*\*).

- `false` = tipe input "password" (tersembunyi)
- `true` = tipe input "text" (terlihat)
- Masing-masing field bisa di-toggle sendiri-sendiri

```jsx
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState("");
const [passwordLoading, setPasswordLoading] = useState(false);
const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
```

| State                 | Fungsi                                            |
| --------------------- | ------------------------------------------------- |
| `passwordError`       | Pesan error (merah) di modal password             |
| `passwordSuccess`     | Pesan sukses (hijau) di modal password            |
| `passwordLoading`     | Apakah sedang mengirim request ke server          |
| `showPasswordConfirm` | Apakah modal konfirmasi perubahan password tampil |

### 3.4 `useEffect` — Auto-Fetch saat Halaman Dibuka

```jsx
useEffect(() => {
  fetchUserData();
}, []);
```

**Cara kerja:**

1. Saat component `Profile` pertama kali dirender (halaman dibuka)
2. Jalankan fungsi `fetchUserData()`
3. `[]` (dependency array kosong) = hanya dijalankan **sekali**

### 3.5 `fetchUserData` — Mengambil Data User dari Server

```jsx
const fetchUserData = async () => {
  try {
    // 1. Ambil data user dari localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?.id;

    // 2. Jika tidak ada user ID, arahkan ke login
    if (!userId) {
      navigate("/login");
      return;
    }

    // 3. Panggil API untuk mendapatkan data lengkap user
    const response = await fetch(`${API_URL}/users/${userId}`);
    const data = await response.json();

    // 4. Jika berhasil, simpan data ke state
    if (data.success) {
      setUserData(data.data);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  } finally {
    // 5. Apapun hasilnya, matikan loading
    setLoading(false);
  }
};
```

**Alur langkah demi langkah:**

```
┌─────────────────────────────────────────┐
│ 1. Ambil user dari localStorage         │
│    └→ { id: 1, name: "Alex", ... }      │
├─────────────────────────────────────────┤
│ 2. Ada userId? (storedUser?.id)         │
│    ├→ TIDAK: redirect ke /login         │
│    └→ YA: lanjut ke langkah 3           │
├─────────────────────────────────────────┤
│ 3. fetch("/api/users/1")                │
│    └→ Server mengembalikan data user    │
├─────────────────────────────────────────┤
│ 4. data.success === true?               │
│    └→ YA: setUserData(data.data)        │
├─────────────────────────────────────────┤
│ 5. finally: setLoading(false)           │
│    └→ Tampilan berubah dari Loading     │
│       ke halaman profil                 │
└─────────────────────────────────────────┘
```

**Penjelasan try/catch/finally:**

- `try` = coba jalankan kode ini
- `catch` = jika ada error, tangani di sini (tampilkan di console)
- `finally` = jalankan ini apapun yang terjadi (berhasil atau gagal)

### 3.6 `getPasswordStrength` — Menghitung Kekuatan Password

```jsx
const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++; // +1 jika minimal 8 karakter
  if (password.length >= 12) score++; // +1 jika minimal 12 karakter
  if (/[A-Z]/.test(password)) score++; // +1 jika ada huruf kapital
  if (/[0-9]/.test(password)) score++; // +1 jika ada angka
  if (/[^A-Za-z0-9]/.test(password)) score++; // +1 jika ada karakter spesial

  if (score <= 1) return { level: 1, label: "WEAK PASSWORD", color: "#ef4444" };
  if (score <= 2) return { level: 2, label: "FAIR PASSWORD", color: "#f59e0b" };
  if (score <= 3) return { level: 3, label: "GOOD PASSWORD", color: "#3b82f6" };
  return { level: 4, label: "STRONG PASSWORD", color: "#22c55e" };
};
```

**Cara kerja RegEx (Regular Expression):**

| Regex            | Artinya                             | Contoh Match         |
| ---------------- | ----------------------------------- | -------------------- |
| `/[A-Z]/`        | Ada huruf kapital A sampai Z        | "Hello" ✓, "hello" ✗ |
| `/[0-9]/`        | Ada angka 0 sampai 9                | "abc123" ✓, "abc" ✗  |
| `/[^A-Za-z0-9]/` | Ada karakter selain huruf dan angka | "p@ss" ✓, "pass" ✗   |

`.test(password)` = mengecek apakah string `password` cocok dengan pola regex tersebut. Mengembalikan `true` atau `false`.

**Contoh:**

- Password: `"hello"` → score = 0 → WEAK (merah)
- Password: `"Hello123"` → score = 3 (8 chars + kapital + angka) → GOOD (biru)
- Password: `"MyP@ssword123"` → score = 5 → STRONG (hijau)

### 3.7 `handlePasswordChange` — Menghandle Input Password

```jsx
const handlePasswordChange = (field, value) => {
  setPasswordForm((prev) => ({ ...prev, [field]: value }));
  setPasswordError("");
  setPasswordSuccess("");
};
```

**Penjelasan detail:**

- `field` = nama field yang berubah ("currentPassword", "newPassword", atau "confirmPassword")
- `value` = nilai yang diketik user
- `prev` = state sebelumnya
- `...prev` = **spread operator** — salin semua property yang ada
- `[field]: value` = **computed property name** — ubah property yang namanya sesuai `field`

**Contoh alur:**

```
State awal: { currentPassword: "", newPassword: "", confirmPassword: "" }

User mengetik "abc" di field currentPassword:
handlePasswordChange("currentPassword", "abc")

Hasil: { currentPassword: "abc", newPassword: "", confirmPassword: "" }
        ↑ hanya ini yang berubah, sisanya tetap
```

Kenapa pakai `(prev) => ({ ...prev, [field]: value })` dan bukan langsung `setPasswordForm({ [field]: value })`? Karena kalau langsung, field lain yang tidak berubah akan hilang!

### 3.8 `togglePassField` — Toggle Tampilkan/Sembunyikan Password

```jsx
const togglePassField = (field) => {
  setShowPassFields((prev) => ({ ...prev, [field]: !prev[field] }));
};
```

`!prev[field]` = kebalikan dari nilai saat ini.

- Jika `false` → jadi `true` (password terlihat)
- Jika `true` → jadi `false` (password tersembunyi)

Ini mengontrol `type` pada input:

```jsx
<input type={showPassFields.current ? "text" : "password"} />
//           true → "text" (terlihat)    false → "password" (****)
```

### 3.9 `openPasswordModal` & `closePasswordModal` — Buka/Tutup Modal Password

```jsx
const openPasswordModal = () => {
  setPasswordForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  setShowPassFields({ current: false, new: false, confirm: false });
  setPasswordError("");
  setPasswordSuccess("");
  setShowPasswordModal(true);
};
```

**Fungsi:** Reset semua state form ke kondisi awal, lalu tampilkan modal.
Kenapa di-reset? Agar saat modal dibuka, field-field sebelumnya bersih (tidak ada sisa data dari pembukaan sebelumnya).

### 3.10 `handleSubmitPassword` — Validasi Form Password

```jsx
const handleSubmitPassword = async () => {
  const { currentPassword, newPassword, confirmPassword } = passwordForm;
  // ↑ Destructuring: ambil ketiga nilai dari passwordForm
```

**Validasi yang dilakukan (berurutan):**

```
1. currentPassword kosong?     → Error: "Please enter your current password"
2. newPassword kosong?         → Error: "Please enter a new password"
3. newPassword < 8 karakter?   → Error: "...must be at least 8 characters"
4. newPassword ≠ confirmPassword? → Error: "...do not match"
5. currentPassword = newPassword?  → Error: "...must be different..."
```

Jika semua validasi lolos → tampilkan modal konfirmasi:

```jsx
setShowPasswordConfirm(true);
```

**Kenapa tidak langsung simpan?** Karena perubahan password hanya bisa dilakukan 1x per bulan. Jadi user perlu mengkonfirmasi terlebih dahulu.

### 3.11 `confirmPasswordChange` — Kirim Password Baru ke Server

```jsx
const confirmPasswordChange = async () => {
  setShowPasswordConfirm(false); // Tutup modal konfirmasi
  setPasswordLoading(true); // Tampilkan loading
  setPasswordError(""); // Reset error

  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const response = await fetch(
      `${API_URL}/users/${storedUser?.id}/change-password`,
      {
        method: "PUT", // HTTP method PUT (update)
        headers: { "Content-Type": "application/json" }, // Kirim sebagai JSON
        body: JSON.stringify({
          // Data yang dikirim
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      },
    );

    const data = await response.json();

    if (data.success) {
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      await fetchUserData(); // Ambil ulang data user (termasuk password_changed_at)
      setTimeout(() => closePasswordModal(), 2500); // Tutup modal setelah 2.5 detik
    } else {
      setPasswordError(data.message || "Failed to change password");
    }
  } catch (error) {
    setPasswordError("An error occurred. Please try again.");
  } finally {
    setPasswordLoading(false);
  }
};
```

**Alur komunikasi Frontend ↔ Backend:**

```
┌──────────────────────┐         ┌──────────────────────┐
│     FRONTEND         │         │      BACKEND         │
│     (Profile.jsx)    │         │   (userController.js) │
├──────────────────────┤         ├──────────────────────┤
│ fetch PUT /api/users │ ──────→ │ changePassword()     │
│ /1/change-password   │         │                      │
│ {                    │         │ 1. Cek user di DB    │
│   currentPassword,   │         │ 2. Verifikasi bcrypt │
│   newPassword        │         │ 3. Cek 30 hari      │
│ }                    │         │ 4. Hash password baru│
│                      │         │ 5. Update di DB      │
│                      │ ←────── │ { success: true }    │
└──────────────────────┘         └──────────────────────┘
```

### 3.12 `getInitials` — Mendapatkan Inisial Nama

```jsx
const getInitials = (name) => {
  if (!name) return "U"; // Jika nama kosong, kembalikan "U"
  return name
    .split(" ") // "Alex Thompson" → ["Alex", "Thompson"]
    .map((n) => n[0]) // ["Alex", "Thompson"] → ["A", "T"]
    .join("") // ["A", "T"] → "AT"
    .substring(0, 2) // Ambil 2 karakter pertama → "AT"
    .toUpperCase(); // Pastikan huruf kapital → "AT"
};
```

Digunakan untuk avatar placeholder (lingkaran dengan huruf) ketika user belum punya foto profil.

### 3.13 `getPasswordChangeInfo` — Hitung Cooldown Password

```jsx
const getPasswordChangeInfo = () => {
  // Jika belum pernah ganti password
  if (!userData?.password_changed_at) {
    return {
      canChange: true, // Boleh ganti
      daysAgo: null,
      remainingDays: 0,
      label: "Never changed. We recommend setting a strong password.",
    };
  }

  // Hitung selisih hari
  const lastChanged = new Date(userData.password_changed_at);
  const now = new Date();
  const diffDays = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
  //                                                  ms     s    m    h
  // 1000ms × 60s × 60m × 24h = 86.400.000 ms (1 hari dalam milidetik)

  const remainingDays = Math.max(0, 30 - diffDays);
  const canChange = diffDays >= 30; // Bisa ganti jika sudah ≥ 30 hari

  // Tentukan label berdasarkan jumlah hari
  let label;
  if (diffDays === 0) label = "Changed today.";
  else if (diffDays === 1) label = "Changed yesterday.";
  else if (diffDays < 30) label = `Changed ${diffDays} days ago.`;
  // ...
};
```

**Alur logika:**

```
password_changed_at = 2026-01-20
sekarang            = 2026-02-20
selisih             = 31 hari

31 >= 30? → YA → canChange = true → Tombol "Update Password" aktif
```

### 3.14 `getFirstName` & `getLastName` — Memisahkan Nama

```jsx
const getFirstName = (fullName) => {
  if (!fullName) return "";
  return fullName.split(" ")[0]; // "Alex Thompson" → "Alex"
};

const getLastName = (fullName) => {
  if (!fullName) return "";
  const parts = fullName.split(" ");
  return parts.slice(1).join(" "); // "Alex Thompson Jr" → "Thompson Jr"
};
```

- `split(" ")` = pecah string berdasarkan spasi
- `[0]` = ambil elemen pertama
- `slice(1)` = ambil semua elemen mulai index 1 (buang elemen pertama)
- `join(" ")` = gabungkan kembali dengan spasi

### 3.15 Conditional Loading Screen

```jsx
if (loading) {
  return (
    <div className="profile-loading">
      <div>Loading...</div>
    </div>
  );
}
```

**Cara kerja:** Jika `loading` masih `true`, function `Profile()` mengembalikan tampilan loading dan **berhenti di sini** (kode di bawahnya tidak dijalankan). Ini disebut **early return**.

### 3.16 Struktur JSX Utama

```
profile-page
├── header (profile-header)
│   ├── back-btn + page-title
│   └── company-logo
├── main (profile-main)
│   ├── profile-card-top (avatar + nama + badge)
│   ├── profile-tabs (Personal Info | Settings)
│   └── tab-content
│       ├── [personal] → info-section + quick-tip
│       └── [settings] → security + login activity + IT support
├── footer
├── [Modal] Login Activity
├── [Modal] Update Password
└── [Modal] Password Change Confirmation
```

### 3.17 Rendering Kondisional Tab

```jsx
{
  activeTab === "personal" && (
    <div className="tab-content personal-tab-content">
      {/* ... konten Personal Info ... */}
    </div>
  );
}

{
  activeTab === "settings" && (
    <div className="tab-content settings-tab-content">
      {/* ... konten Settings ... */}
    </div>
  );
}
```

**Cara kerja `&&`:**

- Jika `activeTab === "personal"` bernilai **true** → tampilkan `<div>` di sebelah kanannya
- Jika **false** → tidak tampilkan apa-apa
- Hanya SATU tab yang tampil pada satu waktu

### 3.18 Dynamic CSS Classes

```jsx
<button className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}>
```

**Penjelasan:**

- Template literal (`` ` ` ``) memungkinkan menggabungkan string dan ekspresi JS
- `${...}` = sisipkan hasil ekspresi JS
- Ternary: `kondisi ? "jika true" : "jika false"`
- Jika `activeTab === "personal"`:
  - Hasil: `className="tab-btn active"` → CSS `.tab-btn.active` diterapkan (warna biru, garis bawah)
- Jika tidak:
  - Hasil: `className="tab-btn "` → hanya CSS `.tab-btn` biasa (abu-abu)

### 3.19 Nullish Coalescing / OR Operator untuk Default Value

```jsx
{
  userData?.email || "Not provided";
}
```

- Jika `userData.email` ada dan bukan empty → tampilkan email
- Jika `null`, `undefined`, atau `""` → tampilkan "Not provided"

### 3.20 Modal Pattern — Overlay + StopPropagation

```jsx
{
  showPasswordModal && (
    <div className="modal-overlay" onClick={closePasswordModal}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        {/* isi modal */}
      </div>
    </div>
  );
}
```

**Cara kerja:**

1. **Overlay** (`modal-overlay`): background gelap semi-transparan yang menutupi seluruh layar
2. `onClick={closePasswordModal}` pada overlay: klik di luar modal → tutup modal
3. `onClick={(e) => e.stopPropagation()}` pada modal: **menghentikan event klik** agar tidak "naik" ke overlay
   - Tanpa ini, klik di dalam modal juga akan menutup modal (karena event "naik" ke parent/overlay)

**Visualisasi event bubbling:**

```
Klik di dalam modal:
  modal (stopPropagation) ← event BERHENTI di sini
  overlay (closeModal)    ← TIDAK tercapai ✓

Klik di overlay:
  overlay (closeModal)    ← event tercapai → modal ditutup ✓
```

### 3.21 Password Strength Bar — Dynamic Rendering

```jsx
{
  [1, 2, 3, 4].map((i) => (
    <div
      key={i}
      className={`strength-bar ${i <= strength.level ? "active" : ""}`}
      style={{
        backgroundColor: i <= strength.level ? strength.color : "#e2e8f0",
      }}
    />
  ));
}
```

**Penjelasan:**

- `[1, 2, 3, 4].map(...)` = buat 4 bar
- Setiap bar dicek: apakah index bar ≤ level kekuatan password?
  - YA → warnai dengan warna strength (merah/kuning/biru/hijau)
  - TIDAK → warna abu-abu (`#e2e8f0`)

**Contoh: password level 2 (FAIR)**

```
Bar 1: 1 ≤ 2? YA → kuning ████
Bar 2: 2 ≤ 2? YA → kuning ████
Bar 3: 3 ≤ 2? TIDAK → abu-abu ░░░░
Bar 4: 4 ≤ 2? TIDAK → abu-abu ░░░░
```

### 3.22 Password Requirements Checklist — Dynamic Icon

```jsx
<div className={`req-item ${passwordForm.newPassword.length >= 8 ? "met" : ""}`}>
  <svg ...>
    {passwordForm.newPassword.length >= 8 ? (
      <polyline points="20 6 9 17 4 12" />   {/* ✓ Centang */}
    ) : (
      <circle cx="12" cy="12" r="5" />        {/* ○ Lingkaran */}
    )}
  </svg>
  <span>At least 8 characters</span>
</div>
```

**Cara kerja:**

- Jika syarat terpenuhi (`length >= 8`):
  - Class `met` ditambahkan (CSS: warna hijau)
  - Icon berubah dari lingkaran ke centang
- Jika belum:
  - Tanpa class `met` (CSS: warna abu-abu)
  - Icon tetap lingkaran

---

## 4. Dashboard.jsx Halaman Dashboard User

### 4.1 State yang Digunakan

```jsx
const [profileOpen, setProfileOpen] = useState(false);
```

Mengontrol dropdown profil di kanan atas (klik nama user → muncul menu).

```jsx
const [showAdminNavModal, setShowAdminNavModal] = useState(false);
```

Mengontrol modal navigasi Admin Panel.

```jsx
const [isLoggingOut, setIsLoggingOut] = useState(false);
```

Ketika `true`, menampilkan overlay loading "Logging out..." dengan spinner.

```jsx
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
```

Mengontrol modal konfirmasi logout ("Apakah Anda yakin ingin keluar?").

```jsx
const [openSections, setOpenSections] = useState({});
```

Menyimpan section aplikasi mana yang terbuka. Contoh: `{ it: true, finance: false }`.

```jsx
const [user, setUser] = useState(null);
const [categorizedApps, setCategorizedApps] = useState({});
const [allowedAppIds, setAllowedAppIds] = useState([]);
const [broadcasts, setBroadcasts] = useState([]);
const [loading, setLoading] = useState(true);
```

| State             | Isi                                 | Contoh                                          |
| ----------------- | ----------------------------------- | ----------------------------------------------- |
| `user`            | Data user yang login                | `{ id: 1, name: "Alex", role: "staff" }`        |
| `categorizedApps` | Aplikasi dikelompokkan per kategori | `{ IT: [{...}, {...}], Finance: [{...}] }`      |
| `allowedAppIds`   | ID aplikasi yang boleh diakses user | `[1, 3, 5, 8]`                                  |
| `broadcasts`      | Pengumuman/broadcast yang aktif     | `[{ id: 1, title: "...", priority: "urgent" }]` |
| `loading`         | Status loading awal                 | `true/false`                                    |

### 4.2 `useEffect` — Close Dropdown on Outside Click

```jsx
useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest(".profile-btn")) {
      setProfileOpen(false);
    }
    if (!event.target.closest(".section-dropdown-wrap")) {
      setOpenSections({});
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

**Cara kerja:**

1. Pasang **event listener** di seluruh dokumen untuk mendeteksi klik
2. `event.target.closest(".profile-btn")` = cek apakah yang di-klik berada **di dalam** elemen `.profile-btn`
3. Jika klik di **luar** profile-btn → tutup dropdown (`setProfileOpen(false)`)
4. `return () => ...` = **cleanup function** — hapus event listener ketika component di-unmount (dihapus dari layar). Ini untuk mencegah **memory leak**.

**Analogi:** Seperti memasang CCTV yang mendeteksi klik. Saat halaman ditutup, CCTV dimatikan (cleanup).

### 4.3 `fetchDashboardData` — Mengambil Semua Data Dashboard

```jsx
const fetchDashboardData = async () => {
  // 1. Ambil data user
  // 2. Ambil privileges (hak akses)
  // 3. Ambil daftar aplikasi per kategori
  // 4. Ambil broadcast aktif
};
```

**Alur API calls:**

```
fetchDashboardData()
  │
  ├─→ GET /api/users/1           → setUser(data)
  ├─→ GET /api/users/1/privileges → setAllowedAppIds([1,3,5])
  ├─→ GET /api/applications/categories → setCategorizedApps({...})
  └─→ GET /api/broadcasts        → filter & sort → setBroadcasts([...])
```

**Filter Broadcast:**

```jsx
.filter((b) => {
  // 1. Jika sudah expired → buang
  if (b.expires_at && new Date(b.expires_at) < now) return false;

  // 2. Jika target "all" → semua bisa lihat
  if (b.target_audience === "all") return true;

  // 3. Jika target "admin" → hanya admin
  // 4. Jika target "staff" → hanya staff
})
```

**Sort Broadcast:**

```jsx
.sort((a, b) => {
  const priorityOrder = { urgent: 3, high: 2, normal: 1 };
  // Urutkan: urgent (3) dulu, lalu high (2), lalu normal (1)
  // Jika priority sama, urutkan berdasarkan tanggal terbaru
})
```

### 4.4 `handleLogout` — Proses Logout

```jsx
const handleLogout = async () => {
  setIsLoggingOut(true); // Tampilkan overlay loading
  await new Promise((resolve) => setTimeout(resolve, 800)); // Tunggu 0.8 detik
  localStorage.removeItem("userType"); // Hapus data dari browser
  localStorage.removeItem("userEmail");
  localStorage.removeItem("user");
  navigate("/login"); // Arahkan ke halaman login
};
```

`await new Promise((resolve) => setTimeout(resolve, 800))` — ini adalah cara membuat **delay/jeda** di JavaScript. Menunggu 800ms agar ada animasi loading sebelum benar-benar logout.

### 4.5 `isAdmin` — Cek Apakah User Adalah Admin

```jsx
const isAdmin =
  user?.role?.toLowerCase() === "admin" ||
  localStorage.getItem("userType")?.toLowerCase() === "admin";
```

Mengecek dari 2 sumber:

1. Data `user` dari API
2. Data `userType` dari localStorage

Menggunakan `toLowerCase()` agar case-insensitive ("Admin", "ADMIN", "admin" semua dianggap admin).

### 4.6 `isAppAllowed` — Cek Hak Akses Aplikasi

```jsx
const isAppAllowed = (appId) => {
  if (isAdmin) return true; // Admin bisa akses semua
  return allowedAppIds.includes(appId); // Staff cek dari daftar privilege
};
```

### 4.7 `toggleSectionDrop` & `scrollToCard` — Navigasi Aplikasi

```jsx
const toggleSectionDrop = (category) => {
  setOpenSections((prev) => ({
    ...prev,
    [category]: !prev[category],
  }));
};
```

Toggle buka/tutup dropdown kategori di sidebar. Contoh: klik "IT" → `{ it: true }`, klik lagi → `{ it: false }`.

```jsx
const scrollToCard = (appId) => {
  const element = document.getElementById(`card-${appId}`);
  if (element) {
    setOpenSections({}); // Tutup semua dropdown
    element.scrollIntoView({ behavior: "smooth", block: "center" }); // Scroll halus
    element.style.boxShadow = "0 0 0 3px var(--blue)"; // Efek highlight
    setTimeout(() => {
      element.style.boxShadow = "";
    }, 800); // Hilangkan setelah 0.8 detik
  }
};
```

### 4.8 Broadcast Collapse Toggle

```jsx
const [collapsedIds, setCollapsedIds] = useState([]);

const toggleBroadcast = (id) => {
  setCollapsedIds(
    (prev) =>
      prev.includes(id)
        ? prev.filter((mid) => mid !== id) // Jika sudah collapsed → buka (hapus dari array)
        : [...prev, id], // Jika belum → tutup (tambah ke array)
  );
};
```

**Contoh:**

```
collapsedIds = []          → Semua broadcast terbuka
klik broadcast id=3        → collapsedIds = [3] → broadcast 3 tertutup
klik broadcast id=5        → collapsedIds = [3, 5] → broadcast 3 & 5 tertutup
klik broadcast id=3 lagi   → collapsedIds = [5] → broadcast 3 terbuka lagi
```

### 4.9 Logout Confirmation Modal

```jsx
<div className="dropdown-item logout" onClick={() => {
  setShowLogoutConfirm(true);  // Tampilkan modal konfirmasi
  setProfileOpen(false);        // Tutup dropdown profil
}}>
```

Saat klik Logout:

1. **BUKAN** langsung logout
2. Tampilkan modal konfirmasi dulu
3. User pilih "Batal" → tutup modal
4. User pilih "Ya, Logout" → jalankan `handleLogout()`

---

## 5. Login.jsx — Halaman Login

**Lokasi:** `src/pages/Login.jsx` (284 baris)

### 5.1 Fungsi Utama

Halaman login untuk semua user (admin & staff). Menampilkan form email + password, mengirim ke backend untuk verifikasi.

### 5.2 State

| State          | Tipe                              | Fungsi                                |
| -------------- | --------------------------------- | ------------------------------------- |
| `formData`     | `{ email, password, rememberMe }` | Menyimpan input form                  |
| `showPassword` | `boolean`                         | Toggle tampilkan/sembunyikan password |
| `error`        | `string`                          | Pesan error (merah)                   |
| `isLoading`    | `boolean`                         | Loading overlay saat proses login     |

### 5.3 Alur Login (`handleSubmit`)

```
User klik "Login"
     │
     ▼
1. Ambil email & password dari form
2. Cek apakah email domain @admin.somagede.com → isAdmin
3. POST /api/users/login  { email, password }
     │
     ├── Gagal → Tampilkan error
     │
     └── Berhasil →
         a. Simpan userType, userEmail, user ke localStorage
         b. POST /api/sessions (catat sesi aktif)
         c. navigate("/dashboard")
```

### 5.4 Fitur Tambahan

- **Microsoft Login Button**: Sudah ada tombolnya, tapi belum diimplementasikan (TODO)
- **Remember Me**: Checkbox tersedia, tapi belum ada logika penyimpanan
- **Loading Overlay**: Spinner full-page saat proses login
- **Eye Icon**: Toggle visibility password dengan ikon mata

### 5.5 Penyimpanan di localStorage

Setelah login berhasil, data disimpan:

```javascript
localStorage.setItem("userType", "admin" atau "user");
localStorage.setItem("userEmail", "alex@somagede.com");
localStorage.setItem("user", JSON.stringify({ id, name, role, department, position }));
```

Data ini dibaca oleh ProtectedRoute.jsx dan halaman-halaman lain.

---

## 6. Settings.jsx — Halaman Pengaturan

**Lokasi:** `src/pages/Settings.jsx` (138 baris)

### 6.1 Fungsi

Halaman pengaturan user dengan toggle untuk notifikasi, 2FA, dark mode, dan pilihan bahasa.

### 6.2 State

```jsx
const [settings, setSettings] = useState({
  emailNotifications: true, // Notifikasi email
  twoFactorAuth: false, // Autentikasi 2 faktor
  darkMode: false, // Mode gelap
  language: "en", // Bahasa (en/id/zh)
});
```

### 6.3 Catatan

Halaman ini masih **basic/placeholder** — `handleSaveSettings()` hanya menampilkan toast "Settings saved!" tanpa menyimpan ke database. Fitur-fitur belum terhubung ke backend.

---

## 7. App.jsx — Router Utama

**Lokasi:** `src/App.jsx` (73 baris)

### 7.1 Fungsi

File ini adalah **pusat routing** — menentukan halaman mana yang ditampilkan berdasarkan URL.

### 7.2 Struktur Route

```jsx
<BrowserRouter>
  <Routes>
    {/* Halaman publik (siapa saja bisa akses) */}
    <Route path="/login" element={<Login />} />

    {/* Halaman terproteksi (harus login) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
    </Route>

    {/* Halaman admin (harus login + role admin) */}
    <Route element={<ProtectedRoute adminOnly />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/users" element={<UserControl />} />
        <Route path="/admin/active-session" element={<ActiveSession />} />
        {/* ... route admin lainnya ... */}
      </Route>
    </Route>

    {/* URL yang tidak dikenal → redirect ke login */}
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
</BrowserRouter>
```

### 7.3 Cara Kerja Nested Routes

```
URL: /admin/users
  │
  ├── ProtectedRoute (cek: sudah login? role admin?)
  │     └── Lolos → lanjut ke children
  │
  ├── AdminLayout (tampilkan Sidebar + header)
  │     └── <Outlet /> → render children
  │
  └── UserControl (konten halaman)
```

`<Outlet />` adalah tempat dimana child route akan di-render. Seperti "lubang" yang diisi oleh child component.

---

## 8. main.jsx — Entry Point Aplikasi

**Lokasi:** `src/main.jsx` (48 baris)

### 8.1 Fungsi

File pertama yang dijalankan browser. Me-render `<App />` ke dalam DOM.

```jsx
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
```

**Penjelasan:**

- `document.getElementById("root")` → cari `<div id="root">` di index.html
- `createRoot(...).render(...)` → sisipkan aplikasi React ke dalam div itu
- `<StrictMode>` → mode pengembangan yang mendeteksi masalah (double render check)
- `<ToastProvider>` → membungkus seluruh aplikasi agar toast bisa dipakai di mana saja

### 8.2 Event Listeners Pencegahan

```javascript
// Mencegah scroll horizontal (navigasi browser via trackpad)
window.addEventListener(
  "wheel",
  (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
  },
  { passive: false },
);

// Mencegah drag & drop (halaman pindah saat drag)
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// Mencegah gesture swipe pada touch (navigasi back/forward)
window.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
```

Semua ini mencegah user secara tidak sengaja meninggalkan halaman saat menggunakan trackpad atau layar sentuh.

---

## 9. ProtectedRoute.jsx — Penjaga Halaman

**Lokasi:** `src/components/ProtectedRoute.jsx` (19 baris)

### 9.1 Fungsi

Komponen "penjaga gerbang" yang mengecek apakah user boleh mengakses halaman tertentu.

```jsx
export default function ProtectedRoute({ adminOnly = false }) {
  const userType = localStorage.getItem("userType");
  const userEmail = localStorage.getItem("userEmail");

  // Belum login → ke halaman login
  if (!userType || !userEmail) {
    return <Navigate to="/login" replace />;
  }

  // Halaman admin-only tapi bukan admin → ke dashboard
  if (adminOnly && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Lolos → render halaman yang diminta
  return <Outlet />;
}
```

### 9.2 Cara Kerja

```
User mencoba akses /admin/users
     │
     ├── localStorage kosong? → Redirect ke /login
     ├── userType ≠ "admin"?  → Redirect ke /dashboard
     └── Semua lolos           → Tampilkan halaman UserControl
```

`<Navigate to="/login" replace />` → redirect tanpa menyimpan history (user tidak bisa tekan "Back").

---

## 10. AdminLayout.jsx — Layout Admin

**Lokasi:** `src/components/AdminLayout.jsx` (156 baris)

### 10.1 Fungsi

Membungkus semua halaman admin dengan **Sidebar** di kiri dan **header** di atas.

### 10.2 State

| State              | Fungsi                                |
| ------------------ | ------------------------------------- |
| `showBackModal`    | Modal konfirmasi "Back to Dashboard?" |
| `isNavigating`     | Loading overlay saat transisi         |
| `sidebarCollapsed` | Sidebar diciutkan atau diperluas      |

### 10.3 Dynamic Page Title

```jsx
const getPageTitle = () => {
  if (location.pathname === "/admin") return "Dashboard Overview";
  if (location.pathname === "/admin/users") return "User Management";
  // ... dst
};
```

Header menampilkan judul halaman yang **berubah otomatis** berdasarkan URL saat ini.

### 10.4 Struktur Layout

```
┌────────────────────────────────────────────┐
│ AdminLayout                                │
├──────────┬─────────────────────────────────┤
│          │  Header (judul + "Back to       │
│ Sidebar  │  Dashboard" button)             │
│          ├─────────────────────────────────┤
│          │                                 │
│          │  <Outlet /> ← halaman admin     │
│          │  yang aktif di-render di sini   │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

---

## 11. Sidebar.jsx — Sidebar Admin

**Lokasi:** `src/components/Sidebar.jsx` (393 baris)

### 11.1 Fungsi

Sidebar navigasi untuk panel admin. Fitur: collapse/expand, menu items, submenu, logout.

### 11.2 State

| State             | Fungsi                                                      |
| ----------------- | ----------------------------------------------------------- |
| `collapsed`       | Sidebar diciutkan (hanya ikon) atau diperluas (ikon + teks) |
| `showLogoutModal` | Modal konfirmasi logout                                     |
| `isLoggingOut`    | Loading overlay saat logout                                 |
| `openSubmenu`     | Submenu mana yang sedang terbuka                            |

### 11.3 Menu Items

```javascript
const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard />,
    path: "/admin",
  },
  { id: "users", label: "User Control", icon: <Users />, path: "/admin/users" },
  {
    id: "session",
    label: "Active Session",
    icon: <Monitor />,
    path: "/admin/active-session",
  },
  {
    id: "apps",
    label: "App Management",
    icon: <AppWindow />,
    path: "/admin/application-management",
  },
  {
    id: "broadcast",
    label: "Broadcast",
    icon: <Megaphone />,
    path: "/admin/broadcast",
  },
  {
    id: "mastercard",
    label: "Master Data",
    icon: <Database />,
    submenu: [
      { label: "Departments", path: "/admin/master/departments" },
      { label: "Applications", path: "/admin/master/applications" },
      { label: "Roles", path: "/admin/master/roles" },
      { label: "Positions", path: "/admin/master/positions" },
    ],
  },
];
```

### 11.4 Collapse State Persistence

```jsx
// Baca dari localStorage saat pertama kali
const [collapsed, setCollapsed] = useState(
  () => localStorage.getItem("sidebarCollapsed") === "true",
);

// Simpan ke localStorage setiap kali berubah
const toggleCollapse = () => {
  setCollapsed((prev) => {
    localStorage.setItem("sidebarCollapsed", !prev);
    return !prev;
  });
};
```

Status collapsed **disimpan** di localStorage sehingga tetap ingat meski halaman di-refresh.

### 11.5 Logout dengan Konfirmasi + Loading

Alur:

1. Klik "Logout" → tampilkan modal konfirmasi
2. Klik "Yes, Logout" →
   - `setIsLoggingOut(true)` (loading overlay full-page)
   - Tunggu 800ms (animasi)
   - Hapus localStorage
   - `navigate("/login")`

---

## 12. Toast.jsx & ToastContext.jsx — Notifikasi

### 12.1 ToastContext.jsx (52 baris)

**Lokasi:** `src/contexts/ToastContext.jsx`

Menggunakan **React Context** — cara berbagi data antar component tanpa props.

```jsx
// 1. Buat Context
const ToastContext = createContext();

// 2. Provider membungkus seluruh app
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => removeToast(id), duration);  // Auto-hilang
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}  {/* ← seluruh app */}
      <div className="toast-container">
        {toasts.map(toast => <Toast key={toast.id} ... />)}
      </div>
    </ToastContext.Provider>
  );
};

// 3. Hook untuk dipakai di component manapun
export const useToast = () => useContext(ToastContext);
```

**Cara pakai di component lain:**

```jsx
const { showToast } = useToast();
showToast("Berhasil disimpan!", "success"); // Notifikasi hijau
showToast("Terjadi error!", "error"); // Notifikasi merah
showToast("Perhatian!", "warning"); // Notifikasi kuning
```

### 12.2 Toast.jsx (245 baris)

**Lokasi:** `src/components/Toast.jsx`

Komponen notifikasi individual (kotak pesan yang muncul di pojok layar).

**Fitur:**

- 4 tipe: `success` (hijau), `error` (merah), `warning` (kuning), `info` (biru)
- Animasi masuk: slide dari kanan + fade in
- Animasi keluar: slide ke kanan + fade out
- Tombol close (X)
- Ikon berbeda per tipe (centang, silang, segitiga, info)
- Semua style menggunakan **inline styles** (bukan CSS file)

---

## 13. Navbar.jsx — Navbar Placeholder

**Lokasi:** `src/components/Navbar.jsx` (7 baris)

```jsx
export default function Navbar() {
  return <div>Navbar</div>;
}
```

Komponen placeholder yang belum diimplementasikan. Hanya menampilkan teks "Navbar".

---

## 14. DashboardAdmin.jsx — Dashboard Admin

**Lokasi:** `src/pages/admin/DashboardAdmin.jsx` (875 baris)

### 14.1 Fungsi

Halaman utama admin panel. Menampilkan statistik, grafik, sesi aktif, dan broadcast.

### 14.2 State (13 variabel)

| State                 | Fungsi                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| `stats`               | 4 kartu statistik utama (Active Users, Applications, Departments, Total Users) |
| `activeSessions`      | Daftar sesi aktif terbaru                                                      |
| `totalSessions`       | Jumlah total sesi                                                              |
| `departmentStats`     | Distribusi user per departemen                                                 |
| `activeBroadcasts`    | 3 broadcast yang aktif                                                         |
| `loginTrends`         | Data tren login 7 hari terakhir                                                |
| `appUsage`            | Top aplikasi berdasarkan user aktif                                            |
| `logoutCandidate`     | Sesi yang akan di-force logout                                                 |
| `showDeptModal`       | Modal distribusi departemen                                                    |
| `showFullActiveModal` | Modal user aktif per departemen                                                |
| `activeDeptStats`     | Sesi aktif per departemen                                                      |
| `departments`         | Daftar departemen (untuk warna)                                                |

### 14.3 API yang Dipanggil

```
Saat halaman dibuka (useEffect):
  ├── GET /api/departments        → warna departemen
  ├── GET /api/analytics/trends   → tren login 7 hari
  ├── GET /api/broadcasts/active  → broadcast aktif
  └── GET /api/dashboard/stats    → semua statistik dashboard
```

### 14.4 Widget/Section

1. **Overview Cards** — 4 kartu: Active Users, Active Apps, Total Departments, Total Users
2. **Active Broadcasts** — 3 broadcast terbaru dengan priority badge
3. **Login Activity Chart** — AreaChart (recharts) tren login 7 hari
4. **Top Applications** — Ranking aplikasi paling aktif
5. **Active Users by Dept** — Bar chart per departemen
6. **Employee Distribution** — Donut PieChart distribusi user
7. **Active Session Table** — Tabel sesi dengan tombol Force Logout

### 14.5 Force Logout

Admin bisa memaksa user logout dari sesi aktif:

```
Admin klik "Force Logout" → Modal konfirmasi → DELETE /api/sessions/:id → Refresh data
```

---

## 15. ActiveSession.jsx — Sesi Aktif

**Lokasi:** `src/pages/admin/ActiveSession.jsx` (400 baris)

### 15.1 Fungsi

Halaman untuk melihat **semua sesi login aktif** secara detail dengan pencarian dan filter.

### 15.2 State

| State              | Fungsi                               |
| ------------------ | ------------------------------------ |
| `sessions`         | Semua sesi aktif dari API            |
| `searchQuery`      | Filter pencarian (nama/email)        |
| `deptFilter`       | Filter dropdown departemen           |
| `currentPage`      | Halaman paginasi saat ini            |
| `showConfirmModal` | Modal konfirmasi force logout        |
| `selectedSession`  | Sesi yang dipilih untuk force logout |
| `departments`      | Daftar departemen (untuk filter)     |

### 15.3 Fitur

- **Pencarian**: Filter sesi berdasarkan nama atau email user
- **Filter Departemen**: Dropdown untuk memfilter berdasarkan departemen
- **Paginasi**: 7 sesi per halaman
- **Force Logout**: Hapus sesi tertentu (DELETE /api/sessions/:id)
- **Kolom Tabel**: User, Role, Department, Active App, IP Address, Start Time, Duration, Security

---

## 16. UserControl.jsx — Manajemen User

**Lokasi:** `src/pages/admin/UserControl.jsx` (2391 baris)

### 16.1 Fungsi

Halaman paling besar di project. Mengelola semua user: tambah, edit, aktifkan, berikan privilege, ubah role.

### 16.2 State (22+ variabel)

| State                  | Fungsi                                                   |
| ---------------------- | -------------------------------------------------------- |
| `users`                | Semua user                                               |
| `activeUsers`          | User aktif                                               |
| `inactiveUsers`        | User tidak aktif                                         |
| `privilegeUsers`       | User dengan hak khusus                                   |
| `adminUsers`           | User admin                                               |
| `departments`          | Daftar departemen                                        |
| `positions`            | Daftar posisi                                            |
| `roles`                | Daftar role                                              |
| `applications`         | Daftar aplikasi                                          |
| `activeTab`            | Tab aktif: all/active/inactive/privilege/admin           |
| `searchQuery`          | Filter pencarian                                         |
| `deptFilter`           | Filter departemen                                        |
| `showAddModal`         | Modal tambah user                                        |
| `showEditModal`        | Modal edit user                                          |
| `showPrivilegeModal`   | Modal kelola privilege                                   |
| `showRoleConfirmModal` | Modal konfirmasi ubah role                               |
| `showConfirmModal`     | Modal konfirmasi generik                                 |
| `selectedUser`         | User yang dipilih untuk edit                             |
| `formData`             | Data form (name, email, position, department, role, dll) |
| `selectedApps`         | Aplikasi yang dipilih untuk privilege                    |

### 16.3 Tab

| Tab             | Isi                             | Badge       |
| --------------- | ------------------------------- | ----------- |
| All Users       | Semua user aktif & inaktif      | Total count |
| Active Users    | User dengan status aktif        | Count       |
| Inactive Users  | User tidak aktif                | Count       |
| Privilege Users | User dengan `has_privilege = 1` | Count       |
| Admin           | User dengan role Admin          | Count       |

### 16.4 API yang Dipanggil

```
Saat halaman dibuka:
  ├── GET /api/departments
  ├── GET /api/positions
  ├── GET /api/roles
  ├── GET /api/applications
  └── fetchAllUsers():
      ├── GET /api/users
      ├── GET /api/users/inactive
      ├── GET /api/users/admins
      └── GET /api/users/privilege

Saat edit/save:
  ├── PUT /api/users/:id           (update user)
  ├── PUT /api/users/:id/privileges (update privilege)
  └── GET /api/users/:id/privileges (get user privileges)
```

### 16.5 Modal-Modal

1. **Add User Modal**: Form nama, email, password, foto, departemen, posisi, role
2. **Edit User Modal (Inactive)**: Kartu sederhana + tombol "Activate Account"
3. **Edit User Modal (Active)**: Header profil, toggle status, info pekerjaan, daftar apps, toggle privilege
4. **Privilege Modal**: Daftar checkbox semua aplikasi + Save Permissions
5. **Role Confirm Modal**: Konfirmasi sebelum ubah role
6. **Generic Confirm Modal**: Konfirmasi generik dengan judul/pesan dinamis

---

## 17. ApplicationManagement.jsx — Hak Akses Aplikasi

**Lokasi:** `src/pages/admin/ApplicationManagement.jsx` (294 baris)

### 17.1 Fungsi

Mengatur **aplikasi mana yang bisa diakses** oleh setiap departemen. Menggunakan tampilan **accordion** per departemen.

### 17.2 State

| State          | Fungsi                                     |
| -------------- | ------------------------------------------ |
| `expandedDept` | Departemen mana yang accordion-nya terbuka |
| `permissions`  | Map `{deptId: {appCode: true/false}}`      |
| `departments`  | Daftar departemen                          |
| `applications` | Daftar aplikasi                            |

### 17.3 Cara Kerja Toggle Permission

```
Admin klik toggle untuk app "SAP" di dept "Finance"
     │
     ▼
1. togglePermission(deptId, appCode)
2. Optimistic update: langsung ubah state (sebelum server respons)
3. PATCH /api/departments/:deptId/permissions/:appId
4. Jika gagal → revert state ke sembarang
```

**Optimistic Update** = UI langsung berubah sebelum menunggu respons server. Kalau gagal, dikembalikan ke sebelumnya. Membuat app terasa lebih cepat.

---

## 18. Broadcast.jsx — Broadcast Center

**Lokasi:** `src/pages/admin/Broadcast.jsx` (443 baris)

### 18.1 Fungsi

Membuat dan mengelola broadcast (pengumuman) untuk seluruh user.

### 18.2 State

| State             | Fungsi                                                      |
| ----------------- | ----------------------------------------------------------- |
| `broadcasts`      | Daftar broadcast                                            |
| `formData`        | Form: title, message, priority, target_audience, expires_at |
| `activeTab`       | Tab: "active" atau "history"                                |
| `deleteCandidate` | ID broadcast yang akan dihapus                              |

### 18.3 Layout

```
┌──────────────────┬───────────────────────┐
│  Compose Panel   │   History Panel       │
│                  │                       │
│  Title input     │  [Active] [History]   │
│  Priority:       │                       │
│   Normal/High/   │  Broadcast 1          │
│   Urgent buttons │  Broadcast 2          │
│  Message textarea│  Broadcast 3          │
│  Target audience │                       │
│  Expiration date │                       │
│  [Send Broadcast]│                       │
└──────────────────┴───────────────────────┘
```

### 18.4 Priority

| Priority | Warna  | Ikon          |
| -------- | ------ | ------------- |
| Normal   | Biru   | Megaphone     |
| High     | Orange | AlertTriangle |
| Urgent   | Merah  | AlertTriangle |

---

## 19. MasterDepartments.jsx — Master Departemen

**Lokasi:** `src/pages/admin/mastercard/MasterDepartments.jsx` (941 baris)

### 19.1 Fungsi

CRUD (Create, Read, Update, Delete) untuk departemen.

### 19.2 Fitur

- **Tabel** dengan kolom: ID, Icon, Nama, Warna, Kode, Deskripsi, Actions
- **Icon**: Bisa pilih dari picker grid (Font Awesome icons) atau upload gambar
- **Color**: Native color picker + input hex
- **Pencarian**: Filter berdasarkan nama/kode

### 19.3 API

| Method | Endpoint               | Aksi                   |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/departments`     | Ambil semua departemen |
| POST   | `/api/departments`     | Tambah departemen baru |
| PUT    | `/api/departments/:id` | Update departemen      |
| DELETE | `/api/departments/:id` | Hapus departemen       |

### 19.4 Konstanta

- `DEPARTMENT_COLORS` — 22 warna hex untuk departemen
- `ICON_MAP` — Mapping nama icon Lucide ke class Font Awesome
- `DEPARTMENT_ICONS` — 18 icon yang bisa dipilih dari picker

---

## 20. MasterApplications.jsx — Master Aplikasi

**Lokasi:** `src/pages/admin/mastercard/MasterApplications.jsx` (715 baris)

### 20.1 Fungsi

CRUD untuk aplikasi yang tersedia di portal.

### 20.2 Fitur

- **Layout kartu** (bukan tabel) — setiap app ditampilkan sebagai row card
- **Logo**: Upload gambar atau placeholder huruf pertama
- **Status toggle**: Aktifkan/nonaktifkan aplikasi (dengan modal konfirmasi)
- **Kolom**: Logo, Nama, Badge inactive, Deskripsi, Actions (toggle/edit/delete)

### 20.3 API

| Method | Endpoint                | Aksi                                       |
| ------ | ----------------------- | ------------------------------------------ |
| GET    | `/api/applications`     | Ambil semua aplikasi                       |
| POST   | `/api/applications`     | Tambah (dengan FormData untuk upload icon) |
| PUT    | `/api/applications/:id` | Update (dengan FormData)                   |
| DELETE | `/api/applications/:id` | Hapus aplikasi                             |

---

## 21. MasterRoles.jsx — Master Roles

**Lokasi:** `src/pages/admin/mastercard/MasterRoles.jsx` (611 baris)

### 21.1 Fungsi

CRUD untuk roles (peran) user. Setiap role memiliki permissions yang bisa dikonfigurasi.

### 21.2 Permissions yang Tersedia

| Permission           | Nama Tampilan       |
| -------------------- | ------------------- |
| `manage_users`       | Manage Users        |
| `manage_apps`        | Manage Applications |
| `manage_departments` | Manage Departments  |
| `view_sessions`      | View Sessions       |
| `broadcast`          | Broadcast           |
| `view_apps`          | View Applications   |
| `use_apps`           | Use Applications    |

### 21.3 Proteksi

- Role dengan kode `ADMIN` dan `USER` adalah **system roles** — tidak bisa dihapus
- Toggle status dan edit tetap bisa untuk system roles
- Jika role masih dipakai oleh user, ada peringatan saat hapus

### 21.4 API

| Method | Endpoint                | Aksi                           |
| ------ | ----------------------- | ------------------------------ |
| GET    | `/api/roles`            | Ambil semua roles + user count |
| POST   | `/api/roles`            | Tambah role baru               |
| PUT    | `/api/roles/:id`        | Update role                    |
| DELETE | `/api/roles/:id`        | Hapus role                     |
| PATCH  | `/api/roles/:id/toggle` | Toggle aktif/nonaktif          |

---

## 22. MasterPositions.jsx — Master Posisi

**Lokasi:** `src/pages/admin/mastercard/MasterPositions.jsx` (528 baris)

### 22.1 Fungsi

CRUD untuk posisi/jabatan karyawan.

### 22.2 Fitur

- **Tabel**: ID, Nama, Kode (badge biru), Deskripsi, Users (jumlah yang pakai), Status, Actions
- **Kode otomatis uppercase**: Input kode otomatis diubah ke huruf besar
- **Status toggle**: Klik tombol Active/Inactive langsung toggle via PATCH
- **Proteksi hapus**: Tidak bisa hapus posisi yang masih dipakai oleh user

### 22.3 API

| Method | Endpoint                    | Aksi                            |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/positions`            | Ambil semua posisi + user count |
| POST   | `/api/positions`            | Tambah posisi baru              |
| PUT    | `/api/positions/:id`        | Update posisi                   |
| DELETE | `/api/positions/:id`        | Hapus posisi                    |
| PATCH  | `/api/positions/:id/toggle` | Toggle status aktif/nonaktif    |

---

## 23. Arsitektur Backend

### 23.1 Struktur Folder

```
backend/
├── server.js              ← Entry point Express server
├── config/
│   └── database.js        ← Koneksi MySQL pool
├── controllers/           ← Business logic (9 file)
│   ├── userController.js         (1122 baris)
│   ├── departmentController.js   (128 baris)
│   ├── sessionController.js      (117 baris)
│   ├── applicationController.js  (228 baris)
│   ├── broadcastController.js    (88 baris)
│   ├── analyticsController.js    (100 baris)
│   ├── roleController.js         (106 baris)
│   ├── positionController.js     (139 baris)
│   └── apiConfigController.js    (89 baris)
├── routes/                ← Routing (9 file)
│   ├── userRoutes.js       (14 routes)
│   ├── departmentRoutes.js (5 routes)
│   ├── sessionRoutes.js    (4 routes)
│   ├── applicationRoutes.js(7 routes)
│   ├── broadcastRoutes.js  (4 routes)
│   ├── analyticsRoutes.js  (4 routes)
│   ├── roleRoutes.js       (5 routes)
│   ├── positionRoutes.js   (5 routes)
│   └── apiConfigRoutes.js  (5 routes)
├── utils/
│   ├── logger.js          ← Audit & activity logging
│   └── upload.js          ← Multer file upload config
└── package.json
```

### 23.2 Alur Request

```
Browser mengirim request
      │
      ▼
┌─── server.js ────────────────────────────┐
│  1. Middleware: CORS, JSON parser         │
│  2. Static files: /uploads               │
│  3. Route matching: /api/users → userRoutes │
└──────────────────────────────────────────┘
      │
      ▼
┌─── routes/userRoutes.js ─────────────────┐
│  GET /users → getAllUsers                 │
│  POST /users/login → loginUser           │
│  PUT /users/:id/change-password → changePassword │
└──────────────────────────────────────────┘
      │
      ▼
┌─── controllers/userController.js ────────┐
│  1. Validasi input                       │
│  2. Query database (SQL)                 │
│  3. Proses data                          │
│  4. Kirim response JSON                  │
└──────────────────────────────────────────┘
      │
      ▼
┌─── config/database.js ──────────────────┐
│  MySQL Connection Pool                   │
│  Host: localhost, DB: portal_somagede    │
└──────────────────────────────────────────┘
```

### 23.3 Dependencies Backend

| Package    | Versi  | Fungsi                                 |
| ---------- | ------ | -------------------------------------- |
| `express`  | 4.18.2 | Web framework (menangani HTTP request) |
| `mysql2`   | 3.6.5  | Koneksi ke database MySQL              |
| `bcryptjs` | 3.0.3  | Hashing password (satu arah, aman)     |
| `cors`     | 2.8.5  | Cross-Origin Resource Sharing          |
| `dotenv`   | 16.3.1 | Membaca file `.env` untuk konfigurasi  |
| `multer`   | 2.0.2  | Upload file (avatar, icon)             |

---

## 24. server.js — Entry Point Backend

**Lokasi:** `backend/server.js` (75 baris)

### 24.1 Middleware

```javascript
app.use(cors()); // Izinkan request dari domain lain
app.use(express.json()); // Parse body JSON
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use("/uploads", express.static("public/uploads")); // Serve file statis
```

### 24.2 Route Mounting

```javascript
app.use("/api", userRoutes); // /api/users/*
app.use("/api", departmentRoutes); // /api/departments/*
app.use("/api", sessionRoutes); // /api/sessions/*
app.use("/api", broadcastRoutes); // /api/broadcasts/*
app.use("/api", analyticsRoutes); // /api/analytics/*
app.use("/api", applicationRoutes); // /api/applications/*
app.use("/api", roleRoutes); // /api/roles/*
app.use("/api", positionRoutes); // /api/positions/*
app.use("/api/api-configs", apiConfigRoutes); // /api/api-configs/*
```

Semua route dimount di bawah prefix `/api`. Jadi `GET /users` di userRoutes menjadi `GET /api/users`.

### 24.3 Health Check & Error Handling

```javascript
// Health check — untuk cek apakah server hidup
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// 404 — route tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// 500 — error server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});
```

---

## 25. config/database.js — Koneksi Database

**Lokasi:** `backend/config/database.js` (37 baris)

### 25.1 Connection Pool

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "portal_somagede",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Maksimal 10 koneksi bersamaan
  queueLimit: 0, // Unlimited antrian
});
```

**Apa itu Connection Pool?**

Pool = kumpulan koneksi database yang **sudah dibuat sebelumnya** dan bisa dipakai ulang.

```
Tanpa pool:
  Request 1 → buat koneksi → query → tutup koneksi
  Request 2 → buat koneksi → query → tutup koneksi  (lambat!)

Dengan pool:
  ┌──────────────────────────┐
  │ Pool (10 koneksi siap)   │
  │  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○    │
  └──────────────────────────┘
  Request 1 → ambil koneksi dari pool → query → kembalikan    (cepat!)
  Request 2 → ambil koneksi dari pool → query → kembalikan
```

### 25.2 Konfigurasi via .env

Membaca dari file `backend/.env` (tidak di-commit ke Git):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mypassword
DB_NAME=portal_somagede
DB_PORT=3306
```

---

## 26. Controllers — Business Logic

### 26.1 userController.js (1122 baris)

File controller terbesar. Menangani semua operasi user.

**Fungsi yang diekspor:**

| Fungsi                 | Method/Route                   | Penjelasan                               |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| `getAllUsers`          | GET /users                     | Ambil semua user + privilege data        |
| `getActiveUsers`       | GET /users/active              | User aktif saja                          |
| `getInactiveUsers`     | GET /users/inactive            | User tidak aktif saja                    |
| `getAdminUsers`        | GET /users/admins              | User admin saja                          |
| `getPrivilegeUsers`    | GET /users/privilege           | User dengan hak khusus                   |
| `getUserById`          | GET /users/:id                 | Data user spesifik                       |
| `createUser`           | POST /users                    | Buat user baru + hash password           |
| `updateUser`           | PUT /users/:id                 | Update data user                         |
| `deleteUser`           | DELETE /users/:id              | Hapus user                               |
| `getUserPrivileges`    | GET /users/:id/privileges      | Ambil hak akses user                     |
| `updateUserPrivileges` | PUT /users/:id/privileges      | Update hak akses                         |
| `loginUser`            | POST /users/login              | Autentikasi login                        |
| `changePassword`       | PUT /users/:id/change-password | Ganti password (+ 30-hari cooldown)      |
| `syncAllUsers`         | GET /users/sync-metrics        | Sinkronisasi metrik privilege semua user |

**Helper internal (tidak di-route):**

- `syncUserAccessibleApps(userId)` — menghitung ulang jumlah app yang bisa diakses user berdasarkan departemen + extras

### 26.2 departmentController.js (128 baris)

| Fungsi                        | Penjelasan                                    |
| ----------------------------- | --------------------------------------------- |
| `getAllDepartments`           | Ambil semua departemen (urut nama)            |
| `getAllDepartmentPermissions` | Ambil semua departemen + parse `allowed_apps` |
| `getDepartmentPermissions`    | Ambil permission 1 departemen                 |
| `updateDepartmentPermissions` | Update `allowed_apps` untuk 1 departemen      |
| `toggleDepartmentPermission`  | Toggle 1 aplikasi dalam permission departemen |

**Catatan tentang `allowed_apps`:**
Kolom ini bisa berisi JSON array (`["SAP","ERP"]`) atau CSV string (`"SAP,ERP"`). Controller meng-handle kedua format.

### 26.3 sessionController.js (117 baris)

| Fungsi              | Penjelasan                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| `getAllSessions`    | Ambil semua sesi aktif                                                      |
| `createSession`     | Catat sesi login baru                                                       |
| `deleteSession`     | Hapus sesi (force logout)                                                   |
| `getDashboardStats` | Aggregate statistik: user aktif, total user, apps, dept, sessions, top apps |

`getDashboardStats` menjalankan **8 query** dalam satu endpoint untuk mengumpulkan semua data dashboard.

### 26.4 applicationController.js (228 baris)

| Fungsi                      | Penjelasan                                                              |
| --------------------------- | ----------------------------------------------------------------------- |
| `getApplications`           | Ambil semua aplikasi                                                    |
| `getApplicationsByCategory` | Ambil aplikasi dikelompokkan per kategori (Finance, HR, Warehouse, dll) |
| `getApplicationById`        | Ambil 1 aplikasi by ID                                                  |
| `getApplicationByCode`      | Ambil 1 aplikasi by kode (uppercase)                                    |
| `createApplication`         | Buat aplikasi baru (support upload ikon via multer)                     |
| `updateApplication`         | Update aplikasi (dynamic fields)                                        |
| `deleteApplication`         | Hapus aplikasi                                                          |

### 26.5 broadcastController.js (88 baris)

| Fungsi                | Penjelasan                         |
| --------------------- | ---------------------------------- |
| `getAllBroadcasts`    | Ambil semua broadcast (admin view) |
| `getActiveBroadcasts` | Ambil broadcast yang belum expired |
| `createBroadcast`     | Buat broadcast baru + log audit    |
| `deleteBroadcast`     | Hapus broadcast + log audit        |

### 26.6 analyticsController.js (100 baris)

| Fungsi                | Penjelasan                                                |
| --------------------- | --------------------------------------------------------- |
| `getAuditLogs`        | Ambil 200 audit log terbaru + nama admin                  |
| `getDeptDistribution` | Distribusi user per departemen                            |
| `getLoginTrends`      | Tren login minggu ini (Senin-Minggu, nama hari Indonesia) |
| `getAppUsage`         | Top 5 aplikasi yang paling sering diakses                 |

### 26.7 roleController.js (106 baris)

| Fungsi             | Penjelasan                                                |
| ------------------ | --------------------------------------------------------- |
| `getAllRoles`      | Ambil semua roles + jumlah user per role                  |
| `createRole`       | Buat role baru (permissions disimpan sebagai JSON string) |
| `updateRole`       | Update role                                               |
| `deleteRole`       | Hapus role (blokir system roles ADMIN/USER)               |
| `toggleRoleStatus` | Toggle `is_active`                                        |

### 26.8 positionController.js (139 baris)

| Fungsi                 | Penjelasan                                        |
| ---------------------- | ------------------------------------------------- |
| `getAllPositions`      | Ambil semua posisi + jumlah user aktif per posisi |
| `createPosition`       | Buat posisi baru (kode uppercase)                 |
| `updatePosition`       | Update posisi                                     |
| `deletePosition`       | Hapus posisi (blokir jika masih dipakai)          |
| `togglePositionStatus` | Toggle active/inactive                            |

### 26.9 apiConfigController.js (89 baris)

| Fungsi           | Penjelasan                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| `getAllConfigs`  | Ambil semua konfigurasi API                                                 |
| `createConfig`   | Buat konfigurasi API baru                                                   |
| `updateConfig`   | Update konfigurasi                                                          |
| `deleteConfig`   | Hapus konfigurasi                                                           |
| `testConnection` | **Simulasi** test koneksi (belum benar-benar request, return hardcoded 200) |

---

## 27. Routes — Routing API

### 27.1 Apa itu Route?

Route = **pemetaan URL ke fungsi controller**. Menentukan "request ini ditangani oleh function mana".

```javascript
// userRoutes.js
router.get("/users", getAllUsers); // GET /api/users → getAllUsers()
router.post("/users/login", loginUser); // POST /api/users/login → loginUser()
router.put("/users/:id", updateUser); // PUT /api/users/5 → updateUser(req.params.id = 5)
router.delete("/users/:id", deleteUser); // DELETE /api/users/5 → deleteUser()
```

### 27.2 Middleware pada Route

Beberapa route menggunakan **multer** middleware untuk upload file:

```javascript
// Upload avatar saat create/edit user
router.post("/users", upload.single("avatar"), createUser);
router.put("/users/:id", upload.single("avatar"), updateUser);

// Upload icon saat create/edit aplikasi
router.post("/applications", upload.single("icon"), createApplication);
router.put("/applications/:id", upload.single("icon"), updateApplication);
```

`upload.single("avatar")` artinya: terima 1 file dengan field name "avatar", simpan ke `public/uploads/icons/`.

### 27.3 Parameter Route (`:id`)

`:id` dalam path adalah **parameter dinamis**:

```
PUT /api/users/42/change-password
                ↓
req.params.id = "42"
```

### 27.4 Urutan Route Penting!

```javascript
// ✅ BENAR — spesifik dulu, umum belakangan
router.put("/users/:id/change-password", changePassword);
router.put("/users/:id", updateUser);

// ❌ SALAH — umum dulu menangkap semua
router.put("/users/:id", updateUser); // Ini akan menangkap /users/5/change-password juga!
router.put("/users/:id/change-password", changePassword); // Tidak pernah tercapai
```

### 27.5 Ringkasan Semua Route (53 total)

**User Routes (14):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /users | getAllUsers |
| GET | /users/active | getActiveUsers |
| GET | /users/sync-metrics | syncAllUsers |
| GET | /users/inactive | getInactiveUsers |
| GET | /users/admins | getAdminUsers |
| GET | /users/privilege | getPrivilegeUsers |
| GET | /users/:id | getUserById |
| POST | /users | createUser (+ upload) |
| POST | /users/login | loginUser |
| PUT | /users/:id/change-password | changePassword |
| PUT | /users/:id | updateUser (+ upload) |
| DELETE | /users/:id | deleteUser |
| GET | /users/:id/privileges | getUserPrivileges |
| PUT | /users/:id/privileges | updateUserPrivileges |

**Department Routes (5):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /departments | getAllDepartments |
| GET | /departments/permissions | getAllDepartmentPermissions |
| GET | /departments/:id/permissions | getDepartmentPermissions |
| PUT | /departments/:id/permissions | updateDepartmentPermissions |
| PATCH | /departments/:id/permissions/:appId | toggleDepartmentPermission |

**Session Routes (4):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /sessions | getAllSessions |
| POST | /sessions | createSession |
| DELETE | /sessions/:id | deleteSession |
| GET | /dashboard/stats | getDashboardStats |

**Application Routes (7):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /applications | getApplications |
| GET | /applications/categories | getApplicationsByCategory |
| GET | /applications/code/:code | getApplicationByCode |
| GET | /applications/:id | getApplicationById |
| POST | /applications | createApplication (+ upload) |
| PUT | /applications/:id | updateApplication (+ upload) |
| DELETE | /applications/:id | deleteApplication |

**Broadcast Routes (4):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /broadcasts | getAllBroadcasts |
| GET | /broadcasts/active | getActiveBroadcasts |
| POST | /broadcasts | createBroadcast |
| DELETE | /broadcasts/:id | deleteBroadcast |

**Analytics Routes (4):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /analytics/logs | getAuditLogs |
| GET | /analytics/distribution | getDeptDistribution |
| GET | /analytics/trends | getLoginTrends |
| GET | /analytics/usage | getAppUsage |

**Role Routes (5):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /roles | getAllRoles |
| POST | /roles | createRole |
| PUT | /roles/:id | updateRole |
| DELETE | /roles/:id | deleteRole |
| PATCH | /roles/:id/toggle | toggleRoleStatus |

**Position Routes (5):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /positions | getAllPositions |
| POST | /positions | createPosition |
| PUT | /positions/:id | updatePosition |
| DELETE | /positions/:id | deletePosition |
| PATCH | /positions/:id/toggle | togglePositionStatus |

**API Config Routes (5):**
| Method | Path | Handler |
|--------|------|---------|
| GET | /api-configs | getAllConfigs |
| POST | /api-configs | createConfig |
| PUT | /api-configs/:id | updateConfig |
| DELETE | /api-configs/:id | deleteConfig |
| POST | /api-configs/:id/test | testConnection |

---

## 28. Utils — Utility Functions

### 28.1 logger.js (36 baris)

Dua fungsi logging yang menulis ke database:

```javascript
// Log aksi admin (audit trail)
logAudit({
  admin_id,
  action_type,
  target_type,
  target_id,
  details,
  ip_address,
});
// → INSERT INTO audit_logs (...) VALUES (...)

// Log aktivitas user
logActivity({ user_id, activity_type, details });
// → INSERT INTO user_activities (...) VALUES (...)
```

Kedua fungsi ini adalah **fire-and-forget** — error pada logging tidak menggagalkan request utama.

### 28.2 upload.js (35 baris)

Konfigurasi **multer** untuk upload file:

```javascript
const upload = multer({
  storage: diskStorage({
    destination: "public/uploads/icons",
    filename: (req, file, cb) => {
      // nama file: avatar-1234567890-random.jpg
      cb(
        null,
        `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    // Hanya terima: .jpg, .jpeg, .png, .gif
    const filetypes = /jpeg|jpg|png|gif/;
    if (filetypes.test(ext)) cb(null, true);
    else cb("Error: Images only!");
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Maks 5 MB
});
```

---

## 29. Daftar Semua API Endpoints

Semua endpoint menggunakan prefix `/api` (sudah termasuk di bawah).

### User APIs

```
GET    /api/users                     → Semua user
GET    /api/users/active              → User aktif
GET    /api/users/inactive            → User tidak aktif
GET    /api/users/admins              → User admin
GET    /api/users/privilege           → User privilege
GET    /api/users/sync-metrics        → Sinkronisasi metrik
GET    /api/users/:id                 → Detail user
POST   /api/users                     → Buat user baru
POST   /api/users/login               → Login
PUT    /api/users/:id                 → Update user
PUT    /api/users/:id/change-password  → Ganti password
DELETE /api/users/:id                 → Hapus user
GET    /api/users/:id/privileges      → Ambil privilege user
PUT    /api/users/:id/privileges      → Update privilege user
```

### Department APIs

```
GET    /api/departments                              → Semua departemen
GET    /api/departments/permissions                   → Semua permission departemen
GET    /api/departments/:id/permissions               → Permission 1 departemen
PUT    /api/departments/:id/permissions               → Update permission
PATCH  /api/departments/:id/permissions/:appId        → Toggle 1 permission
```

### Session APIs

```
GET    /api/sessions             → Semua sesi aktif
POST   /api/sessions             → Buat sesi baru (login)
DELETE /api/sessions/:id         → Hapus sesi (force logout)
GET    /api/dashboard/stats      → Statistik dashboard
```

### Application APIs

```
GET    /api/applications              → Semua aplikasi
GET    /api/applications/categories   → Aplikasi per kategori
GET    /api/applications/code/:code   → Aplikasi by kode
GET    /api/applications/:id          → Aplikasi by ID
POST   /api/applications              → Buat aplikasi baru
PUT    /api/applications/:id          → Update aplikasi
DELETE /api/applications/:id          → Hapus aplikasi
```

### Broadcast APIs

```
GET    /api/broadcasts          → Semua broadcast
GET    /api/broadcasts/active   → Broadcast aktif
POST   /api/broadcasts          → Buat broadcast baru
DELETE /api/broadcasts/:id      → Hapus broadcast
```

### Analytics APIs

```
GET    /api/analytics/logs          → Audit logs
GET    /api/analytics/distribution  → Distribusi user per dept
GET    /api/analytics/trends        → Tren login mingguan
GET    /api/analytics/usage         → Top 5 app usage
```

### Role APIs

```
GET    /api/roles               → Semua roles
POST   /api/roles               → Buat role baru
PUT    /api/roles/:id           → Update role
DELETE /api/roles/:id           → Hapus role
PATCH  /api/roles/:id/toggle    → Toggle status
```

### Position APIs

```
GET    /api/positions               → Semua posisi
POST   /api/positions               → Buat posisi baru
PUT    /api/positions/:id           → Update posisi
DELETE /api/positions/:id           → Hapus posisi
PATCH  /api/positions/:id/toggle    → Toggle status
```

### API Config APIs

```
GET    /api/api-configs              → Semua konfigurasi
POST   /api/api-configs              → Buat konfigurasi baru
PUT    /api/api-configs/:id          → Update konfigurasi
DELETE /api/api-configs/:id          → Hapus konfigurasi
POST   /api/api-configs/:id/test     → Test koneksi (simulasi)
```

### Health Check

```
GET    /health                  → Status server
```

---

## 30. Glosarium Istilah

| Istilah                        | Penjelasan                                                                |
| ------------------------------ | ------------------------------------------------------------------------- |
| **Component**                  | Bagian UI yang bisa dipakai ulang (function yang return JSX)              |
| **State**                      | Data dalam component yang bisa berubah dan memicu re-render               |
| **Props**                      | Data yang dikirim dari component induk ke anak                            |
| **Hook**                       | Fungsi spesial React yang dimulai dengan `use` (useState, useEffect, dll) |
| **JSX**                        | Syntax untuk menulis HTML di dalam JavaScript                             |
| **Render**                     | Proses menampilkan component ke layar                                     |
| **Re-render**                  | Proses menggambar ulang component saat state berubah                      |
| **Mount**                      | Saat component pertama kali ditampilkan di layar                          |
| **Unmount**                    | Saat component dihapus dari layar                                         |
| **Event**                      | Aksi user (klik, ketik, hover, scroll, dll)                               |
| **Handler**                    | Fungsi yang menangani event                                               |
| **Async/Await**                | Cara menangani operasi yang butuh waktu (API call, dll)                   |
| **Fetch**                      | API browser untuk mengirim HTTP request ke server                         |
| **API**                        | Antarmuka untuk komunikasi antara frontend dan backend                    |
| **Endpoint**                   | URL spesifik di server yang menerima request                              |
| **Middleware**                 | Fungsi yang berjalan di antara request dan response di backend            |
| **Query**                      | Perintah SQL untuk berinteraksi dengan database                           |
| **Hash**                       | Mengubah data menjadi string acak yang tidak bisa dikembalikan            |
| **localStorage**               | Penyimpanan data di browser (persisten)                                   |
| **Modal**                      | Dialog/popup yang muncul di atas halaman                                  |
| **Overlay**                    | Layer semi-transparan di belakang modal                                   |
| **Proxy**                      | Meneruskan request dari satu server ke server lain                        |
| **Conditional Rendering**      | Menampilkan elemen berdasarkan kondisi                                    |
| **Destructuring**              | Mengekstrak nilai dari object/array ke variabel terpisah                  |
| **Spread Operator (...)**      | Menyalin semua property dari object/array                                 |
| **Template Literal (` `)**     | String yang bisa menyisipkan ekspresi JS dengan `${}`                     |
| **Ternary Operator (? :)**     | Shorthand if-else dalam satu baris                                        |
| **Optional Chaining (?.)**     | Akses property dengan aman tanpa error jika null                          |
| **Regex (Regular Expression)** | Pola untuk mencocokkan teks                                               |
| **Event Bubbling**             | Event "naik" dari elemen anak ke induk                                    |
| **stopPropagation**            | Menghentikan event bubbling                                               |
| **Cleanup Function**           | Fungsi yang dijalankan saat component di-unmount                          |
| **Early Return**               | Mengembalikan nilai lebih awal dan menghentikan eksekusi                  |
| **Computed Property Name**     | `[variable]: value` — nama property ditentukan oleh variabel              |
| **CRUD**                       | Create, Read, Update, Delete — 4 operasi dasar database                   |
| **Connection Pool**            | Kumpulan koneksi database siap pakai (lebih efisien)                      |
| **Optimistic Update**          | Update UI langsung sebelum server respond (revert jika gagal)             |
| **Fire-and-forget**            | Operasi yang dijalankan tanpa menunggu hasilnya                           |
| **ESM**                        | ECMAScript Modules — sistem import/export modern (`import x from 'y'`)    |
| **Context (React)**            | Cara berbagi data antar component tanpa melewatkan props                  |
| **Accordion**                  | Komponen UI yang bisa dibuka/ditutup (expand/collapse)                    |
| **Pagination**                 | Membagi data menjadi halaman-halaman (7 item per halaman, dll)            |
| **FormData**                   | API browser untuk mengirim data form termasuk file upload                 |
| **System Role**                | Role bawaan yang tidak boleh dihapus (ADMIN, USER)                        |

---

> **Tips belajar:** Coba modifikasi satu hal kecil di kode, lihat hasilnya di browser, dan pahami hubungan antara perubahan kode dengan perubahan tampilan. Itu cara tercepat untuk belajar React!
