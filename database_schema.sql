-- Credit Card Payment System - MySQL Database Schema
-- Modules: RBAC, Real-Time Fraud Shield, Visual Analytics, System Health Monitoring

CREATE DATABASE IF NOT EXISTS credit_card_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE credit_card_db;

-- 1. Users Table (managed by Django) - Role-Based Access Control (Admin, Support, Read-Only, Customer)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    username VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(20) DEFAULT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    password VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_staff TINYINT(1) NOT NULL DEFAULT 0,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    is_superuser TINYINT(1) NOT NULL DEFAULT 0,
    date_joined DATETIME(6) NOT NULL,
    last_login DATETIME(6) DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Cards Table (managed by Django)
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
    INDEX idx_user_id (user_id),
    INDEX idx_is_blocked (is_blocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions Table (managed by Django) - Added Category & Fraud Evaluation Fields
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    card_id BIGINT DEFAULT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description VARCHAR(255) DEFAULT '',
    merchant_name VARCHAR(255) DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    status VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    fraud_status VARCHAR(20) NOT NULL DEFAULT 'CLEAN',
    fraud_reason VARCHAR(255) DEFAULT '',
    ip_address VARCHAR(39) DEFAULT NULL,
    device_info VARCHAR(255) DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    failure_reason VARCHAR(255) DEFAULT '',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_fraud_status (fraud_status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Fraud Logs Table (managed by Django) - Anomaly & Risk Evaluation Storage
CREATE TABLE IF NOT EXISTS fraud_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    card_id BIGINT DEFAULT NULL,
    rule_triggered VARCHAR(100) NOT NULL,
    risk_score INT NOT NULL DEFAULT 50,
    details TEXT,
    ip_address VARCHAR(39) DEFAULT NULL,
    device_info VARCHAR(255) DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    review_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewed_by_id BIGINT DEFAULT NULL,
    review_notes TEXT,
    reviewed_at DATETIME(6) DEFAULT NULL,
    timestamp DATETIME(6) NOT NULL,
    CONSTRAINT fk_fraud_txn FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    CONSTRAINT fk_fraud_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fraud_card FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE SET NULL,
    CONSTRAINT fk_fraud_reviewer FOREIGN KEY (reviewed_by_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_review_status (review_status),
    INDEX idx_rule_triggered (rule_triggered),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. System Health & Performance Metrics Table (managed by Django)
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms DOUBLE NOT NULL,
    user_id BIGINT DEFAULT NULL,
    ip_address VARCHAR(39) DEFAULT NULL,
    error_message TEXT,
    timestamp DATETIME(6) NOT NULL,
    CONSTRAINT fk_metric_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_endpoint (endpoint),
    INDEX idx_status_code (status_code),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Admin Logs Table (managed by Django) - Audit Trail with Role and Target ID Tracking
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    actor_role VARCHAR(20) DEFAULT 'ADMIN',
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) DEFAULT NULL,
    target_id VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    ip_address VARCHAR(39) DEFAULT NULL,
    timestamp DATETIME(6) NOT NULL,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payment Logs Table (managed by FastAPI)
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

-- 8. JWT Token Blacklist (managed by Django SimpleJWT)
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
