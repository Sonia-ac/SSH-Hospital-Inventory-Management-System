CREATE DATABASE IF NOT EXISTS hospital_inventory;
USE hospital_inventory;
-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MEDICINES / INVENTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
    markup_percentage DECIMAL(6,2) NOT NULL DEFAULT 500,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(150),
    expiry_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
-- ==========================================
-- RECORDS
-- ==========================================
CREATE TABLE IF NOT EXISTS records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    type ENUM('stock In', 'stock Out') NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) DEFAULT NULL,
    unit_price DECIMAL(12,2) DEFAULT NULL,
    total_cost DECIMAL(12,2) DEFAULT NULL,
    total_amount DECIMAL(12,2) DEFAULT NULL,
    user VARCHAR(100) NOT NULL,
    patient_name VARCHAR(150),
    description TEXT,
    supplier VARCHAR(150),
    expiry_date DATE NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (medicine_id)
        REFERENCES medicines(id)
        ON DELETE CASCADE
);