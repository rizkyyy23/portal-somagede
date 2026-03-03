# Integrasi Login Microsoft 365 (MSAL) – Dokumentasi Frontend

## Alur Login Microsoft 365 (SPA/React)

1. **User klik tombol login Microsoft**
   - Komponen: `MicrosoftLoginButton.jsx`
   - Memanggil MSAL (`loginPopup`) untuk autentikasi ke Microsoft.

2. **MSAL mengembalikan accessToken/idToken**
   - Token ini didapatkan dari Microsoft setelah user berhasil login.

3. **Frontend mengirim accessToken ke backend**
   - Endpoint: `POST /auth/microsoft`
   - Payload:
     ```json
     {
       "accessToken": "<token dari MSAL>"
     }
     ```

4. **Backend memverifikasi accessToken ke Microsoft Graph API**
   - Mendapatkan data user (email, nama, dsb).
   - Membuat/memvalidasi user di database lokal.
   - Menghasilkan JWT aplikasi (opsional).
   - Response ke frontend:
     ```json
     {
       "success": true,
       "data": {
         "token": "<jwt aplikasi>",
         "id": "...",
         "name": "...",
         "email": "...",
         "role": "...",
         "department": "...",
         "position": "...",
         "avatar": "..."
       }
     }
     ```

5. **Frontend menyimpan session**
   - Menyimpan JWT aplikasi dan data user di localStorage.
   - Melakukan redirect ke dashboard sesuai role user.

---

## File Terkait Frontend

- `src/msalConfig.js` – Konfigurasi MSAL (clientId, authority, redirectUri)
- `src/main.jsx` – Inisialisasi MSAL Provider
- `src/pages/Login.jsx` – Proses login, kirim token ke backend, simpan session
- `src/components/MicrosoftLoginButton.jsx` – Tombol login Microsoft

---

## Catatan untuk Backend

- Endpoint `/auth/microsoft` harus menerima accessToken dari frontend.
- Backend WAJIB memverifikasi accessToken ke Microsoft Graph API (bukan hanya menerima mentah-mentah dari frontend).
- Setelah verifikasi, backend boleh membuat user baru atau login user lama, lalu mengembalikan JWT aplikasi ke frontend.
- Jangan pernah mengirim client secret ke frontend.

---

## Contoh Request dari Frontend

```
POST /auth/microsoft
Content-Type: application/json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJub..."
}
```

## Contoh Response dari Backend

```
{
  "success": true,
  "data": {
    "token": "<jwt aplikasi>",
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "...",
    "department": "...",
    "position": "...",
    "avatar": "..."
  }
}
```

---

## Troubleshooting

- Jika login gagal/timed_out: cek clientId, redirectUri, dan konfigurasi Azure App Registration.
- Jika backend error: pastikan accessToken diverifikasi ke Microsoft Graph API.
- Jika user tidak ditemukan: pastikan backend membuat user baru jika belum ada.

---

Untuk pertanyaan lebih lanjut, silakan hubungi tim frontend.
