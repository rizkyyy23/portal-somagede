import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function dumpData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somagede_db'
  });

  const tables = ['departments', 'applications', 'roles', 'users'];
  
  console.log("=== DATABASE DATA DUMP ===\n");
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT * FROM ${table}`);
      console.log(`\n--- TABLE: ${table.toUpperCase()} (${rows.length} rows) ---`);
      if (rows.length > 0) {
        // Just print first 5 if too many, but small tables dump all
        const limit = (table === 'users') ? 5 : rows.length;
        console.table(rows.slice(0, limit));
        if (rows.length > limit) console.log(`... and ${rows.length - limit} more users`);
      }
    } catch (err) {
      console.log(`\nTable: ${table.toUpperCase()} - ERROR: ${err.message}`);
    }
  }

  await connection.end();
}

dumpData().catch(console.error);
