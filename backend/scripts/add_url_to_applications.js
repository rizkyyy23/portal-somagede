
import db from '../config/database.js';

const addUrlColumn = async () => {
  try {
    console.log('Checking applications table for url column...');
    const [columns] = await db.execute('SHOW COLUMNS FROM applications LIKE "url"');
    
    if (columns.length === 0) {
      console.log('Adding url column to applications table...');
      await db.execute('ALTER TABLE applications ADD COLUMN url VARCHAR(255) DEFAULT NULL AFTER icon');
      console.log('Successfully added url column.');
    } else {
      console.log('url column already exists.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding url column:', error);
    process.exit(1);
  }
};

addUrlColumn();
