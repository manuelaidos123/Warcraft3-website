-- Set SQL configuration options
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Create database with proper character set and collation
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'warcraft3_db')
BEGIN
    CREATE DATABASE warcraft3_db
    COLLATE utf8mb4_unicode_ci;
END

GO

USE warcraft3_db;
GO

-- Add users table first (since it's referenced by other tables)
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2 NULL,
    account_locked BIT DEFAULT 0,
    failed_attempts INT DEFAULT 0,
    password_changed_at DATETIME2 DEFAULT GETDATE(),
    password_version INT NOT NULL DEFAULT 1,
    CONSTRAINT chk_password_hash CHECK (LEN(password_hash) = 60),
    CONSTRAINT chk_password_hash_format CHECK (password_hash LIKE '$2[ayb]$%'),
    CONSTRAINT chk_email CHECK (email LIKE '%_@_%._%'),
    CONSTRAINT chk_username CHECK (username LIKE '[A-Za-z0-9_-][A-Za-z0-9_-]%')
);

-- Add security-related tables
CREATE TABLE login_attempts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    attempt_time DATETIME2 DEFAULT GETDATE(),
    ip_address VARCHAR(45) NOT NULL,
    success BIT NOT NULL,
    CONSTRAINT FK_login_attempts_users FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Add audit logging
CREATE TABLE audit_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details NVARCHAR(MAX),
    ip_address VARCHAR(45),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_audit_log_users FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_login_attempts ON login_attempts(user_id, attempt_time);

GO
