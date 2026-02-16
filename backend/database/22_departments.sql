-- Insert 22 Departments for Somagede Portal
USE somagede_db;

-- Clear old departments (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE departments;

-- Insert 22 Departments
INSERT INTO departments (name, code, description) VALUES
('Sales', 'SALES', 'Sales Department'),
('Head Branch', 'HEAD_BRANCH', 'Head Branch Office'),
('Product Manager', 'PROD_MGR', 'Product Management Department'),
('Marketing', 'MKT', 'Marketing Department'),
('Sales Admin', 'SALES_ADMIN', 'Sales Administration'),
('Technical Support', 'TECH_SUP', 'Technical Support Department'),
('Warehouse', 'WH', 'Warehouse Department'),
('Logistic', 'LOG', 'Logistics Department'),
('Purchasing', 'PURCH', 'Purchasing Department'),
('Import', 'IMPORT', 'Import Department'),
('General Affair', 'GA', 'General Affairs Department'),
('Human Resource', 'HR', 'Human Resources Department'),
('Information Technology', 'IT', 'Information Technology Department'),
('Legal', 'LEGAL', 'Legal Department'),
('Accounting', 'ACC', 'Accounting Department'),
('Tax', 'TAX', 'Tax Department'),
('Management', 'MGMT', 'Management'),
('HSE', 'HSE', 'Health, Safety & Environment'),
('Director', 'DIR', 'Directors'),
('Secretaries', 'SEC', 'Secretaries'),
('Finance', 'FIN', 'Finance Department'),
('International Relations', 'INTL_REL', 'International Relations')
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  description=VALUES(description);

-- Create department_permissions table to store app permissions per department
CREATE TABLE IF NOT EXISTS department_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  application_id INT NOT NULL,
  enabled TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dept_app (department_id, application_id),
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize all department-application permissions (all disabled by default)
INSERT IGNORE INTO department_permissions (department_id, application_id, enabled)
SELECT d.id, a.id, 0
FROM departments d
CROSS JOIN applications a;

SELECT 'Successfully created 22 departments and initialized permissions table!' as Status;
