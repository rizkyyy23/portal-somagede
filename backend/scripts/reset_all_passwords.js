import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, "../.env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "portal_somagede",
};

async function resetAllPasswords() {
  console.log("🔐 Resetting All User Passwords...\n");

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Get all users
    const [users] = await connection.execute(
      "SELECT id, name, email, role, status FROM users ORDER BY role DESC, name ASC",
    );

    if (users.length === 0) {
      console.log("❌ No users found in database.");
      return;
    }

    console.log(`Found ${users.length} users in database.\n`);

    // Hash Password
    const newPassword = "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update all passwords
    const [result] = await connection.execute("UPDATE users SET password = ?", [
      hashedPassword,
    ]);

    console.log(
      `✅ Successfully reset passwords for ${result.affectedRows} users!\n`,
    );

    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 ALL USER PASSWORDS HAVE BEEN RESET");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`   New Password: ${newPassword}`);
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log("👥 Updated Users:");
    console.log("───────────────────────────────────────────────────────────");

    users.forEach((user, index) => {
      const statusIcon = user.status === "active" ? "✓" : "✗";
      const roleIcon = user.role === "Admin" ? "👑" : "👤";
      console.log(`${index + 1}. ${roleIcon} ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(
        `   Role: ${user.role} | Status: ${user.status} ${statusIcon}`,
      );
      console.log("");
    });

    console.log("───────────────────────────────────────────────────────────");
    console.log(`💡 All users can now login with password: "${newPassword}"\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

resetAllPasswords();
