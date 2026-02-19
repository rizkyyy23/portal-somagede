import pool from "../config/database.js";

// Generate employee ID in format SMG-YYYY-XXX
function generateEmployeeId(index) {
  const year = 2026;
  const number = String(index).padStart(3, "0");
  return `SMG-${year}-${number}`;
}

async function addEmployeeIdField() {
  try {
    console.log("Checking if employee_id field exists...");

    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'somagede_db' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'employee_id'
    `);

    if (columns.length === 0) {
      console.log("Adding employee_id field to users table...");
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN employee_id VARCHAR(20) UNIQUE DEFAULT NULL AFTER id
      `);
      console.log("✅ Employee ID field added successfully!");
    } else {
      console.log("✅ Employee ID field already exists!");
    }

    // Get all users without employee_id
    const [users] = await pool.query(`
      SELECT id, name 
      FROM users 
      WHERE employee_id IS NULL OR employee_id = ''
      ORDER BY id
    `);

    if (users.length === 0) {
      console.log("✅ All users already have employee IDs!");
      process.exit(0);
    }

    console.log(`\nPopulating employee IDs for ${users.length} users...`);

    // Update each user with a unique employee ID
    let counter = 1;
    for (const user of users) {
      const employeeId = generateEmployeeId(counter);
      await pool.query("UPDATE users SET employee_id = ? WHERE id = ?", [
        employeeId,
        user.id,
      ]);
      console.log(`✓ ${user.name}: ${employeeId}`);
      counter++;
    }

    console.log(
      `\n✅ Successfully added employee IDs to ${users.length} users!`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addEmployeeIdField();
