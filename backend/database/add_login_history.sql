-- Add login_history table to track past logins
USE somagede_db;

CREATE TABLE IF NOT EXISTS login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  role VARCHAR(50) DEFAULT 'User',
  ip_address VARCHAR(45) DEFAULT '0.0.0.0',
  app_name VARCHAR(100) DEFAULT 'Portal',
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_login_at (login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
