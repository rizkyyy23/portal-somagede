-- Migration to add color column to departments table
USE somagede_db;

-- Add color column if not exists
ALTER TABLE departments ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#3498db' AFTER description;

-- Update departments with unique soft colors
UPDATE departments SET color = '#5470c6' WHERE name = 'Sales';
UPDATE departments SET color = '#91cc75' WHERE name = 'Head Branch';
UPDATE departments SET color = '#fac858' WHERE name = 'Product Manager';
UPDATE departments SET color = '#ee6666' WHERE name = 'Marketing';
UPDATE departments SET color = '#73c0de' WHERE name = 'Sales Admin';
UPDATE departments SET color = '#3ba272' WHERE name = 'Technical Support';
UPDATE departments SET color = '#fc8452' WHERE name = 'Warehouse';
UPDATE departments SET color = '#9a60b4' WHERE name = 'Logistic';
UPDATE departments SET color = '#ea7ccc' WHERE name = 'Purchasing';
UPDATE departments SET color = '#1bc2ad' WHERE name = 'Import';
UPDATE departments SET color = '#1abc9c' WHERE name = 'General Affair';
UPDATE departments SET color = '#2ecc71' WHERE name = 'Human Resource';
UPDATE departments SET color = '#3498db' WHERE name = 'Information Technology';
UPDATE departments SET color = '#9b59b6' WHERE name = 'Legal';
UPDATE departments SET color = '#34495e' WHERE name = 'Accounting';
UPDATE departments SET color = '#16a085' WHERE name = 'Tax';
UPDATE departments SET color = '#27ae60' WHERE name = 'Management';
UPDATE departments SET color = '#2980b9' WHERE name = 'HSE';
UPDATE departments SET color = '#8e44ad' WHERE name = 'Director';
UPDATE departments SET color = '#2c3e50' WHERE name = 'Secretaries';
UPDATE departments SET color = '#f1c40f' WHERE name = 'Finance';
UPDATE departments SET color = '#e67e22' WHERE name = 'International Relations';
