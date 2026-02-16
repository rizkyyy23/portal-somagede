import pool from '../config/database.js';

async function migrate() {
  try {
    console.log('🚀 Starting department color migration...');
    
    // 1. Add color column if it doesn't exist
    console.log('📊 Checking for color column...');
    const [columns] = await pool.query('SHOW COLUMNS FROM departments LIKE "color"');
    if (columns.length === 0) {
      await pool.query('ALTER TABLE departments ADD COLUMN color VARCHAR(20) DEFAULT "#3498db" AFTER description');
      console.log('✅ Added "color" column to departments table.');
    } else {
      console.log('ℹ️ "color" column already exists.');
    }

    // 2. Define color palette
    const deptColors = {
      'Sales': '#5470c6',
      'Head Branch': '#91cc75',
      'Product Manager': '#fac858',
      'Marketing': '#ee6666',
      'Sales Admin': '#73c0de',
      'Technical Support': '#3ba272',
      'Warehouse': '#fc8452',
      'Logistic': '#9a60b4',
      'Purchasing': '#ea7ccc',
      'Import': '#1bc2ad',
      'General Affair': '#1abc9c',
      'Human Resource': '#2ecc71',
      'Information Technology': '#3498db',
      'Legal': '#9b59b6',
      'Accounting': '#34495e',
      'Tax': '#16a085',
      'Management': '#27ae60',
      'HSE': '#2980b9',
      'Director': '#8e44ad',
      'Secretaries': '#2c3e50',
      'Finance': '#f1c40f',
      'International Relations': '#e67e22'
    };

    // 3. Update colors
    console.log('🎨 Updating department colors...');
    for (const [name, color] of Object.entries(deptColors)) {
      const [result] = await pool.query('UPDATE departments SET color = ? WHERE name = ?', [color, name]);
      if (result.affectedRows > 0) {
        console.log(`✅ Updated ${name} to ${color}`);
      }
    }

    console.log('✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
