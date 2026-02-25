-- Table: menus (sidebar menu items)
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  path VARCHAR(191) NOT NULL UNIQUE,
  icon VARCHAR(100) DEFAULT 'fas fa-th-large',
  custom_icon LONGTEXT DEFAULT NULL,
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default sidebar menus
INSERT INTO menus (label, path, icon, display_order, is_active) VALUES
('Dashboard', '/admin/dashboard-admin', 'fas fa-th-large', 1, 1),
('Active Session', '/admin/active-session', 'fas fa-clock', 2, 1),
('Application Management', '/admin/application-management', 'fas fa-window-restore', 3, 1),
('User Control', '/admin/user-control', 'fas fa-users-cog', 4, 1),
('Master Data', '/admin/masterdata', 'fas fa-database', 5, 1),
('Broadcast Message', '/admin/broadcast', 'fas fa-comment-dots', 6, 1)
ON DUPLICATE KEY UPDATE label=VALUES(label);
