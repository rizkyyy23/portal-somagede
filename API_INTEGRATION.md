# API Configuration - Third Party Integration

## User Data API (Aplikasi Pihak Ke-3)

### Overview

Portal Somagede mengintegrasikan data user dari aplikasi pihak ketiga untuk mendapatkan data pegawai yang terpusat.

### Data yang Diambil dari API Pihak Ke-3:

1. **name** - Nama lengkap pegawai
2. **email** - Email korporat
3. **department** - Department/bagian pegawai
4. **position/jabatan** - Posisi/jabatan pegawai
5. **employee_id** - ID pegawai unik

### Konfigurasi API Endpoint

```javascript
// API Configuration
const THIRD_PARTY_API = {
  baseURL: "https://api-pegawai.somagede.com",
  endpoints: {
    getUserData: "/api/v1/users/:userId",
    getAllUsers: "/api/v1/users",
    validateUser: "/api/v1/auth/validate",
  },
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
};
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "EMP001",
    "name": "Rizky Setyo",
    "email": "rizky.setyo@somagede.com",
    "department": "Finance",
    "position": "Manager",
    "hire_date": "2020-01-15",
    "status": "active"
  }
}
```

### Implementasi

#### 1. UserControl.jsx

- Field name, email, department, position adalah **READ-ONLY**
- Data diambil dari API pihak ke-3 saat edit user
- Admin hanya bisa mengubah **role** (Admin/User)

#### 2. Login Flow dengan Microsoft Teams 365

- User login menggunakan Microsoft Teams 365 OAuth
- Setelah autentikasi berhasil, ambil data user dari API pihak ke-3
- Semua user (admin dan user biasa) masuk ke `/dashboard` terlebih dahulu
- Admin memiliki tombol "Admin Panel" di navbar untuk akses ke area admin

#### 3. Data Sync

- Data user di-sync secara otomatis dari API pihak ke-3 setiap login
- Position dan department mengikuti data terbaru dari API pihak ke-3
- Tidak ada Master Position karena semua data position berasal dari API

### Security

- API Key harus disimpan di environment variables
- Gunakan HTTPS untuk semua request
- Implement token refresh mechanism
- Validate response dari API sebelum digunakan

### Error Handling

```javascript
try {
  const response = await fetch(
    `${THIRD_PARTY_API.baseURL}/api/v1/users/${userId}`,
    {
      headers: THIRD_PARTY_API.headers,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error("API Error:", error);
  // Fallback to cached data or show error
  return null;
}
```

### TODO

- [ ] Implement Microsoft Teams 365 OAuth flow
- [ ] Connect to third-party API for user data
- [ ] Add API key management in Mastercard → API Configuration
- [ ] Implement data caching mechanism
- [ ] Add sync schedule for user data updates
- [ ] Create API documentation for integration team
