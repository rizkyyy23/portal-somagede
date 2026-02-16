# 🚀 Quick Start Guide - Portal Somagede with Database

## Langkah 1: Setup Database MySQL

### A. Pastikan MySQL Server Running

```bash
# Check MySQL service status
net start | findstr MySQL

# Atau buka MySQL Workbench / phpMyAdmin
```

### B. Import Database Schema

Buka MySQL Command Line atau MySQL Workbench, lalu jalankan:

```sql
-- Login ke MySQL
mysql -u root -p

-- Jalankan script ini
source C:/Users/ROG/Downloads/Documents/portal-somagede/backend/database/schema.sql
```

**Atau via command line langsung:**

```bash
cd C:\Users\ROG\Downloads\Documents\portal-somagede\backend
mysql -u root -p < database/schema.sql
```

### C. Verifikasi Database

```sql
USE somagede_db;

-- Check tables
SHOW TABLES;

-- Check sample data
SELECT * FROM users;
SELECT * FROM departments;
```

## Langkah 2: Konfigurasi Backend

Edit file `backend\.env` sesuai kredensial MySQL Anda:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        # Isi password MySQL Anda disini
DB_NAME=somagede_db
DB_PORT=3306

PORT=3001
```

## Langkah 3: Start Backend Server

Buka terminal baru dan jalankan:

```bash
cd backend
npm start
```

✅ **Backend berhasil jika muncul:**

```
✅ Database connected successfully
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
💊 Health check at http://localhost:3001/health
```

## Langkah 4: Start Frontend (Vite)

Buka terminal baru (biarkan backend tetap running):

```bash
# Dari root folder
npm run dev
```

✅ **Frontend berhasil jika muncul:**

```
VITE v7.3.1 ready in 1210 ms
Local: http://localhost:5173/
```

## Langkah 5: Test User Control dengan Database

1. Buka browser: `http://localhost:5173`
2. Login sebagai admin: `admin@admin.somagede.com`
3. Masuk ke **User Control** menu
4. Anda akan melihat data user dari database MySQL!

### Features Yang Bisa Ditest:

✅ **Tab All Users** - Menampilkan user active dari database  
✅ **Tab Inactive Users** - Menampilkan user inactive  
✅ **Tab Privilege Users** - Menampilkan user dengan cross-department access  
✅ **Add User** - Create user baru ke database  
✅ **Edit User** - Update data user di database  
✅ **Search** - Filter user by name/email

## Test API Langsung

### Test Health Check

```bash
curl http://localhost:3001/health
```

### Test Get All Users

```bash
curl http://localhost:3001/api/users
```

### Test Create User

```bash
curl -X POST http://localhost:3001/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@somagede.com\",\"position\":\"Staff\",\"department\":\"Finance\",\"role\":\"User\",\"status\":\"active\"}"
```

## 🎯 Hasil Akhir

Sekarang sistem sudah:

- ✅ Connected ke MySQL database `somagede_db`
- ✅ Backend API running di port 3001
- ✅ Frontend React di port 5173
- ✅ User Control fetch data real dari database
- ✅ CRUD operations working (Create, Read, Update)

## ⚠️ Troubleshooting

### Problem: "Failed to connect to server"

**Solusi:**

```bash
# Check backend masih running
cd backend
npm start
```

### Problem: "Database connection error"

**Solusi:**

1. Check MySQL running: `net start | findstr MySQL`
2. Check password di `backend\.env` sudah benar
3. Test manual: `mysql -u root -p -e "USE somagede_db; SELECT * FROM users;"`

### Problem: "No users found"

**Solusi:**

```sql
-- Import ulang sample data
USE somagede_db;
source C:/Users/ROG/Downloads/Documents/portal-somagede/backend/database/schema.sql
```

## 📊 Database Info

**Sample Data yang sudah di-import:**

- 8 Active Users
- 2 Inactive Users
- 2 Users dengan Privilege Access
- 6 Departments

**Departments:**

- Finance
- Human Resources
- Warehouse
- IT Department
- Marketing
- Sales

## 🎉 Next Steps

1. **Customize API**: Edit `backend/controllers/userController.js`
2. **Add Authentication**: Tambahkan JWT untuk secure API
3. **Add More Features**: Session management, broadcast, dll
4. **Deploy**: Setup untuk production environment

## 📞 Need Help?

Check logs:

- Backend: Terminal tempat `npm start` backend running
- Frontend: Browser console (F12)
- MySQL: MySQL error log

Sistem sudah siap digunakan! 🚀
