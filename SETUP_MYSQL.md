# ⚡ Setup MySQL Database - Portal Somagede

MySQL belum terdeteksi di sistem. Berikut cara setup:

## Option 1: Menggunakan XAMPP (Recommended - Paling Mudah)

### 1. Install XAMPP

- Download: https://www.apachefriends.org/download.html
- Install XAMPP (sudah include MySQL)

### 2. Start MySQL Server

1. Buka XAMPP Control Panel
2. Klik "Start" pada MySQL
3. Klik "Admin" untuk buka phpMyAdmin

### 3. Import Database via phpMyAdmin

1. Buka phpMyAdmin (http://localhost/phpmyadmin)
2. Klik tab "SQL"
3. Copy-paste isi file `backend/database/schema.sql`
4. Klik "Go"

✅ Database `somagede_db` siap!

---

## Option 2: Install MySQL Standalone

### 1. Download & Install MySQL

- Download: https://dev.mysql.com/downloads/installer/
- Pilih "MySQL Installer for Windows"
- Install dengan password yang mudah diingat (contoh: `root123`)

### 2. Add MySQL to PATH

```powershell
# Buka PowerShell as Administrator
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
```

### 3. Restart PowerShell dan Test

```powershell
mysql --version
```

### 4. Import Database

```bash
cd C:\Users\ROG\Downloads\Documents\portal-somagede\backend
mysql -u root -p < database\schema.sql
# Masukkan password MySQL Anda
```

---

## Konfigurasi Backend

Edit `backend\.env`:

### Jika pakai XAMPP:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=somagede_db
DB_PORT=3306

PORT=3001
```

### Jika pakai MySQL Standalone:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123    # Ganti dengan password Anda
DB_NAME=somagede_db
DB_PORT=3306

PORT=3001
```

---

## Cara Import Database Manual (Jika Command Line Tidak Bisa)

### Via phpMyAdmin (XAMPP):

1. Buka: http://localhost/phpmyadmin
2. Klik "New" di sidebar kiri
3. Nama database: `somagede_db`
4. Klik "Create"
5. Klik tab "Import"
6. Choose file: `backend/database/schema.sql`
7. Klik "Go"

### Via MySQL Workbench:

1. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Connect ke localhost
3. File → Open SQL Script → pilih `backend/database/schema.sql`
4. Execute (⚡ icon)

---

## Verify Database Berhasil

### Check via phpMyAdmin:

1. Buka http://localhost/phpmyadmin
2. Klik database `somagede_db` di sidebar
3. Anda harus lihat 3 tables:
   - `departments` (6 rows)
   - `users` (10 rows)
   - `user_privileges` (3 rows)

### Check via Command (jika MySQL di PATH):

```bash
mysql -u root -p -e "USE somagede_db; SHOW TABLES; SELECT COUNT(*) FROM users;"
```

---

## Start Backend Server

Setelah database ready:

```bash
cd backend
npm start
```

**Output yang benar:**

```
✅ Database connected successfully
🚀 Server running on http://localhost:3001
📊 API available at http://localhost:3001/api
💊 Health check at http://localhost:3001/health
```

**Jika error "Database connection error":**

- Check MySQL service running
- Check password di `.env` benar
- Check database `somagede_db` sudah dibuat

---

## Test Backend API

Buka browser atau curl:

```bash
# Test health
curl http://localhost:3001/health

# Test get users
curl http://localhost:3001/api/users
```

Atau buka di browser:

- http://localhost:3001/health
- http://localhost:3001/api/users

---

## Start Frontend

Terminal baru:

```bash
npm run dev
```

Buka: http://localhost:5173

Login dengan: `admin@admin.somagede.com`

Masuk ke **User Control** → Data users akan muncul dari database MySQL! 🎉

---

## Struktur Database

### Table: users

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  position VARCHAR(100),
  department VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'User',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sample Data Included:

- **8 Active Users**: Alex Thompson, Sarah Chen, Michael Rodriguez, dll
- **2 Inactive Users**: Robert James, Maria Garcia
- **2 Privilege Users**: Alexander Pierce (2 overrides), Emily Watson (1 override)
- **6 Departments**: Finance, HR, Warehouse, IT, Marketing, Sales

---

## Quick Commands Cheat Sheet

```bash
# Start MySQL (XAMPP)
# - Buka XAMPP Control Panel
# - Klik Start pada MySQL

# Start Backend
cd backend
npm start

# Start Frontend (terminal baru)
npm run dev

# Test API
curl http://localhost:3001/api/users

# Check MySQL running (jika di PATH)
mysql -u root -p -e "SHOW DATABASES;"
```

---

## Troubleshooting

### Problem: "Cannot connect to MySQL server"

**Solusi XAMPP:**

1. Buka XAMPP Control Panel
2. Stop MySQL jika running
3. Start MySQL lagi
4. Check port 3306 tidak dipakai aplikasi lain

**Solusi Standalone:**

```bash
# Start MySQL service
net start MySQL80
```

### Problem: "Access denied for user 'root'@'localhost'"

**Solusi:**

- Check password di `backend\.env`
- Reset password MySQL jika lupa

### Problem: "Unknown database 'somagede_db'"

**Solusi:**

- Import ulang `schema.sql` via phpMyAdmin
- Atau create manual:

```sql
CREATE DATABASE somagede_db;
USE somagede_db;
-- lalu paste isi schema.sql
```

---

## Recommended: XAMPP (Easiest Way)

✅ **Paling mudah untuk development**  
✅ **Include Apache + MySQL + phpMyAdmin**  
✅ **GUI friendly**  
✅ **No complex configuration**

Download XAMPP: https://www.apachefriends.org/download.html

Setelah install XAMPP:

1. Start MySQL via XAMPP Control
2. Import database via phpMyAdmin
3. Update `backend\.env`
4. `npm start` di backend folder
5. Done! ✨

---

Silakan pilih option yang paling mudah untuk Anda! 🚀
