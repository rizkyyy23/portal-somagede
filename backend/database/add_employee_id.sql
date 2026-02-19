-- Add employee_id field to users table

USE somagede_db;

-- Add employee_id column
ALTER TABLE users 
ADD COLUMN employee_id VARCHAR(20) UNIQUE DEFAULT NULL AFTER id;

-- Create index for better query performance
CREATE INDEX idx_employee_id ON users(employee_id);
