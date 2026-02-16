import db from '../config/database.js';

const migrate = async () => {
  try {
    console.log('=== Migrating API Configurations ===');

    console.log('1. Creating api_configurations table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_configurations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        description TEXT,
        method VARCHAR(10) DEFAULT 'GET',
        timeout INT DEFAULT 30000,
        retry_attempts INT DEFAULT 3,
        status ENUM('active', 'inactive') DEFAULT 'active',
        last_sync DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Table api_configurations created/verified');

    // Seed dummy data if empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM api_configurations');
    if (rows[0].count === 0) {
      console.log('2. Seeding initial data...');
      await db.query(`
        INSERT INTO api_configurations (name, endpoint, api_key, description, method, status, last_sync) VALUES
        ('Third-Party Employee API', 'https://api-pegawai.somagede.com/api/v1', 'sk_live_dummy123', 'External HR system for employee data', 'GET', 'active', NOW()),
        ('Microsoft Teams 365 OAuth', 'https://login.microsoftonline.com/oauth2/v2.0', 'client_id_dummy789', 'Authentication service for user login', 'POST', 'active', NOW())
      `);
      console.log('   ✅ Seed data inserted');
    } else {
      console.log('   ℹ️ Table already has data, skipping seed');
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
