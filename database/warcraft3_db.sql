-- Initialize database with proper encoding
CREATE DATABASE warcraft3_db
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

\c warcraft3_db

-- Create schema for better organization
CREATE SCHEMA IF NOT EXISTS game_data;

-- Add users table first (since it's referenced by other tables)
CREATE TABLE game_data.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_attempts INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT chk_password_hash CHECK (LENGTH(password_hash) = 60),
    CONSTRAINT chk_password_hash_format CHECK (password_hash ~ '^\$2[ayb]\$.+'),
    CONSTRAINT chk_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_username CHECK (username ~ '^[A-Za-z0-9_-]{2,}$')
);

-- Add security-related tables
CREATE TABLE game_data.login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES game_data.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL
);

-- Add audit logging
CREATE TABLE game_data.audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES game_data.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_username ON game_data.users(username);
CREATE INDEX idx_email ON game_data.users(email);
CREATE INDEX idx_login_attempts ON game_data.login_attempts(user_id, attempt_time);

-- Add table descriptions
COMMENT ON TABLE game_data.users IS 'Stores user account information and credentials';
COMMENT ON TABLE game_data.login_attempts IS 'Tracks login attempts for security monitoring';
COMMENT ON TABLE game_data.audit_log IS 'Maintains audit trail of user actions';

-- Create application user and grant permissions
CREATE USER warcraft3_app WITH PASSWORD 'your_secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA game_data TO warcraft3_app;
GRANT USAGE ON SCHEMA game_data TO warcraft3_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA game_data TO warcraft3_app;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON game_data.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
