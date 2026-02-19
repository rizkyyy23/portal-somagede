-- Add phone field to users table

USE somagede_db;

-- Add phone column
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email;
