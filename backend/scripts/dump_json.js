import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function dumpJSON() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somagede_db'
  });

  const tables = ['departments', 'applications', 'roles', 'users'];
  const result = {};
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT * FROM ${table}`);
      result[table] = rows;
    } catch (err) {
      result[table] = { error: err.message };
    }
  }

  console.log(JSON.stringify(result, null, 2));
  await connection.end();
}

dumpJSON().catch(console.error);
