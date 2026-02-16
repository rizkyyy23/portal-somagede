
import db from '../config/database.js';

const migrateBroadcasts = async () => {
  try {
    console.log('Creating broadcasts table...');
    const connection = await db.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
        target_audience VARCHAR(50) DEFAULT 'all',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Broadcasts table created successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateBroadcasts();
