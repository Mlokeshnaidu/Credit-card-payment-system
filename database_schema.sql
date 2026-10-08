-- Credit Card Payment System - MySQL Database Schema
-- Module 7: Database

CREATE DATABASE IF NOT EXISTS credit_card_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE credit_card_db;

-- Users Table (managed by Django)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    username VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(20) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_staff TINYINT(1) NOT NULL DEFAULT 0,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    is_superuser TINYINT(1) NOT NULL DEFAULT 0,
    date_joined DATETIME(6) NOT NULL,
    last_login DATETIME(6) DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cards Table (managed by Django)
CREATE TABLE IF NOT EXISTS cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    card_holder_name VARCHAR(255) NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    masked_card_number VARCHAR(20) NOT NULL,
    card_type VARCHAR(10) NOT NULL DEFAULT 'CREDIT',
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    bank_name VARCHAR(100) DEFAULT '',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_blocked TINYINT(1) NOT NULL DEFAULT 0,
    credit_limit DECIMAL(12, 2) NOT NULL DEFAULT 50000.00,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_cards_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions Table (managed by Django)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    card_id BIGINT DEFAULT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description VARCHAR(255) DEFAULT '',
    merchant_name VARCHAR(255) DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    failure_reason VARCHAR(255) DEFAULT '',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Logs Table (managed by Django)
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT DEFAULT NULL,
    ip_address VARCHAR(39) DEFAULT NULL,
    timestamp DATETIME(6) NOT NULL,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Logs Table (managed by FastAPI)
CREATE TABLE IF NOT EXISTS payment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    amount VARCHAR(20) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    card_last_four VARCHAR(4) NOT NULL,
    card_type VARCHAR(10) NOT NULL,
    status VARCHAR(10) NOT NULL,
    failure_reason VARCHAR(255) DEFAULT NULL,
    processing_time_ms INT DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JWT Token Blacklist (managed by Django SimpleJWT)
CREATE TABLE IF NOT EXISTS token_blacklist_blacklistedtoken (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id BIGINT NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS token_blacklist_outstandingtoken (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    jti VARCHAR(255) NOT NULL UNIQUE,
    token TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT NULL,
    expires_at DATETIME(6) NOT NULL,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
