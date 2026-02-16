
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portal_somagede', 
};

async function setPasswords() {
  console.log('🔐 Setting Temporary Passwords...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Get Emails
    const [rows] = await connection.execute('SELECT id, name, email, role FROM users WHERE id IN (1, 31)');
    
    if (rows.length === 0) {
      console.log('❌ Users not found.');
      return;
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 3. Update Passwords
    for (const user of rows) {
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      console.log(`✅ Updated password for ${user.role}: ${user.name} (${user.email}) -> 'password123'`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

setPasswords();
