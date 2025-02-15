-- Create database with proper character set
CREATE DATABASE IF NOT EXISTS warcraft3_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE warcraft3_db;

-- Users table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_username (username),
    UNIQUE KEY unique_email (email),
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints and indexes for better performance
ALTER TABLE users
    ADD CONSTRAINT chk_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    ADD CONSTRAINT chk_username CHECK (username REGEXP '^[A-Za-z0-9_-]{3,50}$');

-- Create trigger for updated_at
DELIMITER //
CREATE TRIGGER users_update_trigger
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;//
DELIMITER ;
