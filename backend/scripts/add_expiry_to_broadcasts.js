
import db from '../config/database.js';

const migrate = async () => {
  try {
    console.log('Adding expires_at column to broadcasts table...');
    
    // Check if column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'portal_somagede'}' 
      AND TABLE_NAME = 'broadcasts' 
      AND COLUMN_NAME = 'expires_at'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE broadcasts 
        ADD COLUMN expires_at DATETIME NULL AFTER target_audience
      `);
      console.log('✅ expires_at column added successfully.');
    } else {
      console.log('ℹ️ expires_at column already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
