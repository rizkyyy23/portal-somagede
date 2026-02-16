import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function auditData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somagede_db'
  });

  console.log("=== TARGETED DATA AUDIT ===\n");

  // 1. Applications
  const [apps] = await connection.execute('SELECT id, name, code, status FROM applications');
  console.log("APPLICATIONS:");
  apps.forEach(a => console.log(` - [${a.id}] ${a.code}: ${a.name} (${a.status})`));

  // 2. Roles
  const [roles] = await connection.execute('SELECT id, name, code, is_active FROM roles');
  console.log("\nROLES:");
  roles.forEach(r => console.log(` - [${r.id}] ${r.code}: ${r.name} (Active: ${r.is_active})`));

  // 3. Department Permission Check (Sample)
  const [depts] = await connection.execute('SELECT id, name, code, allowed_apps FROM departments LIMIT 5');
  console.log("\nDEPARTMENTS (Sample):");
  depts.forEach(d => console.log(` - [${d.id}] ${d.code}: ${d.name} | Allowed: ${d.allowed_apps}`));

  // 4. User Sample
  const [users] = await connection.execute('SELECT id, name, role, department FROM users LIMIT 10');
  console.log("\nUSERS (Sample):");
  users.forEach(u => console.log(` - [${u.id}] ${u.name} | Role: ${u.role} | Dept: ${u.department}`));

  await connection.end();
}

auditData().catch(console.error);
