
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portal_somagede', 
};

async function checkUser() {
  console.log('🔍 Checking User Details...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check the user I thought was user@somagede.com (Agus Lestari 26, ID 31)
    // AND check if there is actually a user with email 'user@somagede.com'
    const [rows] = await connection.execute(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = 31 OR email = 'user@somagede.com' OR email LIKE 'user%'
    `);
    
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkUser();
