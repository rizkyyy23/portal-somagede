# Portal Somagede - Database Integration

Sistem ini menggunakan MySQL database `somagede_db` untuk manajemen user.

## 📋 Prerequisites

- Node.js (v16 atau lebih baru)
- MySQL Server (v5.7 atau lebih baru)
- NPM atau Yarn

## 🗄️ Database Setup

### 1. Buat Database dan Import Schema

Jalankan file SQL schema:

```bash
cd backend
mysql -u root -p < database/schema.sql
```

Atau buka MySQL dan jalankan manual:

```sql
source C:/Users/ROG/Downloads/Documents/portal-somagede/backend/database/schema.sql
```

### 2. Konfigurasi Database Connection

Edit file `backend/.env` sesuai dengan konfigurasi MySQL Anda:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=somagede_db
DB_PORT=3306

PORT=3001
```

## 🚀 Setup dan Menjalankan Aplikasi

### Backend API

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install dependencies
npm install

# 3. Jalankan server
npm start
```

Server akan berjalan di: `http://localhost:3001`

### Frontend (React)

```bash
# 1. Kembali ke root folder
cd ..

# 2. Jalankan Vite dev server (jika belum running)
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173`

## 📊 Database Structure

### Table: **users**

Menyimpan data user

| Column     | Type         | Description                   |
| ---------- | ------------ | ----------------------------- |
| id         | INT          | Primary key                   |
| name       | VARCHAR(255) | Nama lengkap user             |
| email      | VARCHAR(255) | Email (unique)                |
| position   | VARCHAR(100) | Jabatan (Staff, Manager, dll) |
| department | VARCHAR(100) | Department                    |
| role       | VARCHAR(50)  | Role (User, Manager, Admin)   |
| status     | ENUM         | Status (active/inactive)      |
| created_at | TIMESTAMP    | Waktu dibuat                  |
| updated_at | TIMESTAMP    | Waktu update terakhir         |

### Table: **departments**

Master data department

| Column      | Type         | Description     |
| ----------- | ------------ | --------------- |
| id          | INT          | Primary key     |
| name        | VARCHAR(100) | Nama department |
| code        | VARCHAR(50)  | Kode department |
| description | TEXT         | Deskripsi       |

### Table: **user_privileges**

Cross-department access privileges

| Column        | Type | Description       |
| ------------- | ---- | ----------------- |
| id            | INT  | Primary key       |
| user_id       | INT  | FK ke users       |
| department_id | INT  | FK ke departments |

## 🔌 API Endpoints

### Users

- `GET /api/users` - Get all active users
- `GET /api/users/inactive` - Get inactive users
- `GET /api/users/privilege` - Get users with special privileges
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Privileges

- `GET /api/users/:id/privileges` - Get user privileges
- `PUT /api/users/:id/privileges` - Update user privileges

### Example Request (Create User)

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@somagede.com",
    "position": "Staff",
    "department": "Finance",
    "role": "User",
    "status": "active"
  }'
```

## 🧪 Testing

### Test Backend Connection

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2026-02-09T...",
  "message": "Portal Somagede Backend API is running"
}
```

### Test Database Connection

Check terminal backend untuk pesan:

```
✅ Database connected successfully
```

## ⚠️ Troubleshooting

### Error: "Failed to connect to server"

**Solusi:**

1. Pastikan backend server sudah running (`cd backend && npm start`)
2. Check port 3001 tidak digunakan aplikasi lain

### Error: "Database connection error"

**Solusi:**

1. Pastikan MySQL server sudah running
2. Check credentials di `.env` sudah benar
3. Pastikan database `somagede_db` sudah dibuat
4. Test connection: `mysql -u root -p -e "USE somagede_db;"`

### Error: "Table doesn't exist"

**Solusi:**

1. Import schema.sql lagi
2. Jalankan: `mysql -u root -p somagede_db < backend/database/schema.sql`

## 📝 Sample Data

Database sudah include sample data:

- 10 users (8 active, 2 inactive)
- 6 departments
- 2 users dengan privilege access

## 🔄 Development Workflow

1. **Backend changes**: Edit di `backend/`, server akan auto-reload
2. **Frontend changes**: Edit di `src/`, Vite akan hot-reload
3. **Database changes**: Update `schema.sql` dan re-import

## 📦 Production Deployment

1. Build frontend: `npm run build`
2. Setup environment variables di production
3. Run backend dengan PM2: `pm2 start backend/server.js`
4. Serve frontend dari `dist/` folder

## 🔐 Security Notes

- Jangan commit file `.env` ke git
- Ganti password database untuk production
- Tambahkan authentication/authorization untuk API endpoints
- Gunakan HTTPS untuk production

## 📞 Support

Jika ada masalah, check:

1. Backend terminal untuk error logs
2. Browser console untuk frontend errors
3. MySQL logs: `tail -f /var/log/mysql/error.log`
