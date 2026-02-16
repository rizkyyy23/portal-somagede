-- Database: somagede_db
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS somagede_db;
USE somagede_db;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  position VARCHAR(100) DEFAULT 'Staff',
  department VARCHAR(100) NOT NULL,
  role ENUM('User', 'Admin') DEFAULT 'User',
  status ENUM('active', 'inactive') DEFAULT 'active',
  has_privilege TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_department (department),
  INDEX idx_has_privilege (has_privilege)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: applications
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_privileges (aplikasi yang diberikan akses khusus)
CREATE TABLE IF NOT EXISTS user_privileges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_app (user_id, application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default departments
INSERT INTO departments (name, code, description) VALUES
('Finance', 'FIN', 'Finance Department'),
('Human Resources', 'HR', 'Human Resources Department'),
('Warehouse', 'WH', 'Warehouse Department'),
('IT Department', 'IT', 'Information Technology Department'),
('Marketing', 'MKT', 'Marketing Department'),
('Sales', 'SALES', 'Sales Department')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default applications
INSERT INTO applications (name, code, description, icon) VALUES
('Finance System', 'FIN_SYS', 'Financial Management System', '💰'),
('HR Portal', 'HR_PORTAL', 'Human Resources Portal', '👥'),
('Warehouse Management', 'WH_MGT', 'Warehouse Management System', '📦'),
('Inventory Control', 'INV_CTL', 'Inventory Control System', '📊'),
('Sales Dashboard', 'SALES_DB', 'Sales Dashboard and Analytics', '📈'),
('Customer Portal', 'CUST_PORTAL', 'Customer Relationship Portal', '🤝')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample users (role: User/Admin, has_privilege: 0=false, 1=true)
INSERT INTO users (name, email, position, department, role, status, has_privilege) VALUES
('Alex Thompson', 'john.davis@somagede.com', 'Manager', 'Human Resources', 'Admin', 'active', 0),
('Sarah Chen', 'emily.watson@somagede.com', 'Staff', 'Finance', 'User', 'active', 0),
('Michael Rodriguez', 'robert.james@somagede.com', 'Staff', 'Warehouse', 'User', 'active', 0),
('Lisa Anderson', 'lisa.a@somagede.id', 'Staff', 'Finance', 'User', 'active', 0),
('John Smith', 'john.s@somagede.id', 'Director', 'Finance', 'Admin', 'active', 1),
('David Kim', 'david.k@somagede.id', 'Senior Manager', 'IT Department', 'Admin', 'active', 1),
('Alexander Pierce', 'alexander.pierce@somagede.com', 'Manager', 'Marketing', 'User', 'active', 1),
('Emily Watson', 'emily.watson2@somagede.com', 'Staff', 'Finance', 'User', 'active', 0),
('Robert James', 'robert.j@somagede.com', 'Staff', 'Sales', 'User', 'inactive', 0),
('Maria Garcia', 'maria.g@somagede.com', 'Manager', 'Sales', 'User', 'inactive', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample privileges (aplikasi dengan akses khusus)
-- John Smith (has_privilege=1): 3 aplikasi privilege
INSERT INTO user_privileges (user_id, application_id) 
SELECT u.id, a.id 
FROM users u
CROSS JOIN applications a
WHERE u.email = 'john.s@somagede.id' AND a.code IN ('FIN_SYS', 'INV_CTL', 'SALES_DB')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- David Kim (has_privilege=1): 4 aplikasi privilege
INSERT INTO user_privileges (user_id, application_id)
SELECT u.id, a.id
FROM users u
CROSS JOIN applications a
WHERE u.email = 'david.k@somagede.id' AND a.code IN ('HR_PORTAL', 'WH_MGT', 'INV_CTL', 'CUST_PORTAL')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- Alexander Pierce (has_privilege=1): 2 aplikasi privilege
INSERT INTO user_privileges (user_id, application_id)
SELECT u.id, a.id
FROM users u
CROSS JOIN applications a
WHERE u.email = 'alexander.pierce@somagede.com' AND a.code IN ('FIN_SYS', 'SALES_DB')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- View: user_with_privileges (helper view dengan jumlah aplikasi privilege)
CREATE OR REPLACE VIEW user_with_privileges AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.position,
  u.department,
  u.role,
  u.status,
  u.has_privilege,
  GROUP_CONCAT(a.name SEPARATOR ', ') as privilege_applications,
  COUNT(DISTINCT up.application_id) as privilege_app_count
FROM users u
LEFT JOIN user_privileges up ON u.id = up.user_id
LEFT JOIN applications a ON up.application_id = a.id
GROUP BY u.id, u.name, u.email, u.position, u.department, u.role, u.status, u.has_privilege;
