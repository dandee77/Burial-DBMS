
-- CEMETERY MANAGEMENT SYSTEM SQL SCHEMA (for deployment)

-- BLOCK Table
CREATE TABLE Block (
    block_id INT PRIMARY KEY AUTO_INCREMENT
);

-- CLIENT Table
CREATE TABLE Client (
    client_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    middle_name VARCHAR(255) NULL,
    last_name VARCHAR(255),
    gender ENUM('male', 'female', 'other'),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SLOT Table
CREATE TABLE Slot (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    block_id INT,
    slot_type ENUM('plot', 'mausoleum'),
    availability ENUM('available', 'occupied', 'reserved'),
    client_id INT NULL,
    total_price DECIMAL(10,2),
    avail_code ENUM('buy', 'reserve'),
    request_maintenance BOOLEAN DEFAULT FALSE,
    password VARCHAR(255),
    FOREIGN KEY (block_id) REFERENCES Block(block_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

-- PLOT Table
CREATE TABLE Plot (
    slot_id INT PRIMARY KEY,
    deceased_id INT,
    FOREIGN KEY (slot_id) REFERENCES Slot(slot_id)
);

-- MAUSOLEUM Table
CREATE TABLE Mausoleum (
    slot_id INT PRIMARY KEY,
    deceased_ids JSON,
    FOREIGN KEY (slot_id) REFERENCES Slot(slot_id)
);

-- DECEASED Table
CREATE TABLE Deceased (
    deceased_id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT,
    client_id INT,
    name VARCHAR(255),
    date_of_birth DATE,
    date_of_death DATE,
    FOREIGN KEY (slot_id) REFERENCES Slot(slot_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

-- PURCHASE Table
CREATE TABLE Purchase (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT,
    client_id INT,
    price DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    down_payment DECIMAL(10,2),
    years_to_pay INT,
    final_price DECIMAL(10,2),
    FOREIGN KEY (slot_id) REFERENCES Slot(slot_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

-- RESERVE Table
CREATE TABLE Reserve (
    reserve_id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT,
    client_id INT,
    price DECIMAL(10,2),
    refundable_deposit DECIMAL(10,2),
    final_price DECIMAL(10,2),
    FOREIGN KEY (slot_id) REFERENCES Slot(slot_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

-- ADMIN Table
CREATE TABLE Admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);
