import db from '../config/database.js';

try {
  await db.query(`
    ALTER TABLE applications 
    ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER icon
  `);
  console.log('Successfully added status column');
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log('Column status already exists');
  } else {
    console.error('Error adding column:', error);
  }
} finally {
  process.exit();
}
