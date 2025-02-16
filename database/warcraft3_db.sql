-- Set proper character set and collation for the server connection
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS warcraft3_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE warcraft3_db;

-- Create schema for better organization
CREATE SCHEMA IF NOT EXISTS game_data;

-- Add users table first (since it's referenced by other tables)
CREATE TABLE game_data.users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_version INT NOT NULL DEFAULT 1,
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT chk_password_hash CHECK (LENGTH(password_hash) = 60),
    CONSTRAINT chk_password_hash_format CHECK (password_hash REGEXP '^\\$2[ayb]\\$.+'),
    CONSTRAINT chk_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_username CHECK (username REGEXP '^[A-Za-z0-9_-]{2,}$')
) ENGINE=InnoDB 
  ROW_FORMAT=COMPRESSED 
  KEY_BLOCK_SIZE=8;

-- Add security-related tables
CREATE TABLE game_data.login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    CONSTRAINT FK_login_attempts_users 
        FOREIGN KEY (user_id) 
        REFERENCES game_data.users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB 
  ROW_FORMAT=COMPRESSED 
  KEY_BLOCK_SIZE=8;

-- Add audit logging
CREATE TABLE game_data.audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_audit_log_users 
        FOREIGN KEY (user_id) 
        REFERENCES game_data.users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB 
  ROW_FORMAT=COMPRESSED 
  KEY_BLOCK_SIZE=8;

-- Add indexes for performance
CREATE INDEX idx_username ON game_data.users(username);
CREATE INDEX idx_email ON game_data.users(email);
CREATE INDEX idx_login_attempts ON game_data.login_attempts(user_id, attempt_time);

-- Add table comments
ALTER TABLE game_data.users COMMENT 'Stores user account information and credentials';
ALTER TABLE game_data.login_attempts COMMENT 'Tracks login attempts for security monitoring';
ALTER TABLE game_data.audit_log COMMENT 'Maintains audit trail of user actions';

-- Set up proper permissions (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON game_data.* TO 'warcraft3_app'@'localhost';
FLUSH PRIVILEGES;
