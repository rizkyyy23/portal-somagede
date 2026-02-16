-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default positions
INSERT INTO positions (name, code, description, status) VALUES
('Staff', 'STAFF', 'Regular staff member', 'active'),
('Intern', 'INTERN', 'Internship position', 'active'),
('Manager', 'MANAGER', 'Management position', 'active')
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  status = VALUES(status);
