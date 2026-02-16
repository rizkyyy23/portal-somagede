import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function normalize() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somagede_db'
  });

  console.log(">>> Starting Data Normalization...");

  // 1. Get Application Mapping (ID -> Code)
  const [apps] = await connection.execute('SELECT id, code FROM applications');
  const idToCode = {};
  const allCodes = new Set();
  apps.forEach(app => {
    idToCode[app.id] = app.code;
    idToCode[String(app.id)] = app.code;
    allCodes.add(app.code);
  });

  console.log(`Found ${apps.length} applications for mapping.`);

  // 2. Normalize Departments
  const [depts] = await connection.execute('SELECT id, name, allowed_apps FROM departments');
  for (const dept of depts) {
    let raw = dept.allowed_apps;
    if (!raw) continue;

    let parsed = [];
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = raw.split(',').map(s => s.trim().replace(/["\[\]]/g, ''));
    }

    if (!Array.isArray(parsed)) parsed = [parsed];

    // Convert IDs to Codes, and filter out invalid ones
    const normalizedCodes = parsed.map(item => {
      if (idToCode[item]) return idToCode[item];
      if (allCodes.has(item)) return item;
      return null;
    }).filter(code => code !== null);

    const finalValue = JSON.stringify([...new Set(normalizedCodes)]);
    
    console.log(`Dept: ${dept.name} | Original: ${raw} -> Normalized: ${finalValue}`);
    
    await connection.execute('UPDATE departments SET allowed_apps = ? WHERE id = ?', [finalValue, dept.id]);
  }

  // 3. Normalize User Privileges (ensure comma-separated strings of IDs/Codes if needed, 
  // but let's focus on clearing the mess in department defaults first as that's the primary blocker)
  
  console.log(">>> Normalization Complete.");
  await connection.end();
}

normalize().catch(err => {
  console.error("Normalization failed:", err);
  process.exit(1);
});
