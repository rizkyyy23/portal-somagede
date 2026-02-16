# Setup 22 Departments - Portal Somagede

## Langkah Setup Database

### 1. Jalankan SQL untuk membuat 22 departments

Buka terminal di folder backend, lalu jalankan:

```bash
cd backend/database
mysql -u root somagede_db < 22_departments.sql
```

Atau bisa juga melalui MySQL command line:

```bash
mysql -u root
```

Kemudian:

```sql
USE somagede_db;
source C:/Users/ROG/Downloads/Documents/portal-somagede/backend/database/22_departments.sql;
```

### 2. Verifikasi 22 departments sudah masuk

```sql
USE somagede_db;
SELECT COUNT(*) FROM departments;
-- Should return 22

SELECT * FROM departments ORDER BY name;
-- Should show all 22 departments
```

### 3. Verifikasi table department_permissions sudah dibuat

```sql
SHOW TABLES LIKE 'department_permissions';
-- Should return department_permissions

SELECT COUNT(*) FROM department_permissions;
-- Should return 132 (22 departments × 6 applications)
```

## 22 Departments Yang Dibuat

1. Sales (SALES)
2. Head Branch (HEAD_BRANCH)
3. Product Manager (PROD_MGR)
4. Marketing (MKT)
5. Sales Admin (SALES_ADMIN)
6. Technical Support (TECH_SUP)
7. Warehouse (WH)
8. Logistic (LOG)
9. Purchasing (PURCH)
10. Import (IMPORT)
11. General Affair (GA)
12. Human Resource (HR)
13. Information Technology (IT)
14. Legal (LEGAL)
15. Accounting (ACC)
16. Tax (TAX)
17. Management (MGMT)
18. HSE
19. Director (DIR)
20. Secretaries (SEC)
21. Finance (FIN)
22. International Relations (INTL_REL)

## Struktur Database Baru

### Table: `departments`

- id (PK)
- name (nama department)
- code (kode department, unique)
- description
- created_at
- updated_at

### Table: `department_permissions` (BARU)

- id (PK)
- department_id (FK → departments.id)
- application_id (FK → applications.id)
- enabled (BOOLEAN: 0/1)
- created_at
- updated_at

## API Endpoints Baru

### GET /api/departments

Mendapatkan semua departments

**Response:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Sales", "code": "SALES", "description": "..." },
    ...
  ]
}
```

### GET /api/departments/permissions

Mendapatkan semua permissions dengan grouping per department

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales",
      "code": "SALES",
      "permissions": [
        { "application_id": 1, "application_code": "FIN_SYS", "enabled": false },
        ...
      ]
    },
    ...
  ]
}
```

### GET /api/departments/:departmentId/permissions

Mendapatkan permissions untuk department tertentu

### PATCH /api/departments/:departmentId/permissions/:applicationId

Toggle permission untuk satu aplikasi di satu department

**Request Body:**

```json
{
  "enabled": true
}
```

### PUT /api/departments/:departmentId/permissions

Update multiple permissions sekaligus

**Request Body:**

```json
{
  "permissions": {
    "1": true,
    "2": false,
    "3": true
  }
}
```

## Perubahan Frontend

### ApplicationManagement.jsx

- ❌ **BEFORE:** Menggunakan localStorage
- ✅ **NOW:** Fetch dari database via API
- Data departments & permissions sekarang real-time dari database
- Setiap toggle langsung save ke database

## Testing

1. Start backend:

```bash
cd backend
npm start
```

2. Start frontend:

```bash
npm run dev
```

3. Buka browser: http://localhost:5173/admin/application-management

4. Test toggle permissions - seharusnya tersimpan di database

5. Refresh page - permissions seharusnya tetap sama (tidak hilang)

## Troubleshooting

### Error: "Table departments doesn't have enough records"

→ Jalankan kembali `22_departments.sql`

### Error: "Unknown column 'department_permissions'"

→ Table belum dibuat. Jalankan `22_departments.sql`

### Frontend tidak load data

→ Pastikan backend running di port 3001
→ Check console browser untuk error messages
→ Verifikasi API URL: `http://localhost:3001/api`

### Permissions tidak tersimpan

→ Check backend console log untuk errors
→ Verifikasi MySQL connection
→ Check network tab di browser developer tools
