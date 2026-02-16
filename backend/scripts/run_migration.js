import db from './config/database.js';

(async () => {
  try {
    console.log('Dropping existing positions table...');
    await db.query('DROP TABLE IF EXISTS positions');
    
    console.log('Creating positions table...');
    await db.query(
      CREATE TABLE positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    );
    
    console.log('Inserting default positions...');
    await db.query(
      INSERT INTO positions (name, code, description, status) VALUES
      ('Staff', 'STAFF', 'Regular staff member', 'active'),
      ('Intern', 'INTERN', 'Internship position', 'active'),
      ('Manager', 'MANAGER', 'Management position', 'active')
    );
    
    console.log(' Migration completed successfully!');
    process.exit(0);
  } catch(e) {
    console.error(' Error:', e.message);
    process.exit(1);
  }
})();
