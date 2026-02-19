import pool from "../config/database.js";

async function addPhoneField() {
  try {
    console.log("Checking if phone field exists...");

    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'somagede_db' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone'
    `);

    if (columns.length > 0) {
      console.log("✅ Phone field already exists!");
      process.exit(0);
    }

    console.log("Adding phone field to users table...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email
    `);

    console.log("✅ Phone field added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding phone field:", error);
    process.exit(1);
  }
}

addPhoneField();
