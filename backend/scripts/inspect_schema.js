import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'somagede_db'
  });

  const tables = ['users', 'departments', 'applications', 'roles']; // Added roles as user mentioned 'admin'
  
  console.log("--- Database Schema Analysis ---");
  
  for (const table of tables) {
    try {
      const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
      console.log(`\nTable: ${table.toUpperCase()}`);
      console.log(columns.map(c => ` - ${c.Field} (${c.Type})`).join('\n'));
      
      // Also check row count to see if 'data' was updated
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   Row Count: ${rows[0].count}`);
      
    } catch (err) {
      console.log(`\nTable: ${table.toUpperCase()} - ERROR: ${err.message}`);
    }
  }

  await connection.end();
}

checkSchema().catch(console.error);
