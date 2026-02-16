import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "portal_somagede",
};

async function setUserPassword() {
  console.log("🔐 Setting User Password for Testing...\n");

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Get user details
    const [rows] = await connection.execute(
      "SELECT id, name, email, role, department FROM users WHERE id = 69",
    );

    if (rows.length === 0) {
      console.log("❌ User not found.");
      return;
    }

    const user = rows[0];

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("user123", salt);

    // Update Password
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);

    console.log("✅ Password updated successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("📋 USER LOGIN CREDENTIALS");
    console.log("═══════════════════════════════════════");
    console.log(`   Name:       ${user.name}`);
    console.log(`   Email:      ${user.email}`);
    console.log(`   Password:   user123`);
    console.log(`   Role:       ${user.role}`);
    console.log(`   Department: ${user.department}`);
    console.log("═══════════════════════════════════════\n");
    console.log("💡 Use these credentials to login and test");
    console.log("   department-based application access.\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (connection) await connection.end();
  }
}

setUserPassword();
