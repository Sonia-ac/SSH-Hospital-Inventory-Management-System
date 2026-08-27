CREATE DATABASE sshinventory;
USE sshinventory;

CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(100) NOT NULL,
email VARCHAR(150),
password VARCHAR(255),
role ENUM('admin', 'staff') DEFAULT 'staff', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE record(
id INT AUTO_INCREMENT PRIMARY KEY,
user CHAR(255),
date DATE,
time time,
type ENUM('stock In', 'stock Out'),
category VARCHAR(100),
name CHAR(255),
unit VARCHAR(150),
quantity VARCHAR(100),
-- For Stock In --
expiry_date DATE,
supplier VARCHAR(150),
-- For Stock Out --
patient VARCHAR(150) NULL,
description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

