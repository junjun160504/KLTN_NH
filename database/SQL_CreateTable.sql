-- Bảng khách hàng
CREATE TABLE customers (
    idcustomers BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng bàn ăn
CREATE TABLE tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_number VARCHAR(10) UNIQUE NOT NULL,
    qr_code_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- Bảng phiên QR (mỗi lần quét QR bắt đầu một phiên ăn uống)
CREATE TABLE qr_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_id BIGINT NOT NULL,
    customer_id BIGINT,
    status ENUM('ACTIVE','COMPLETED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(idcustomers) ON DELETE SET NULL
);

-- Bảng danh mục món ăn
CREATE TABLE menu_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Bảng món ăn
CREATE TABLE menu_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    description TEXT,
    category_id BIGINT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);

CREATE TABLE menu_price_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    item_id BIGINT,
    old_price DECIMAL(12,2),
    new_price DECIMAL(12,2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by BIGINT,
    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Tạo bảng carts
CREATE TABLE carts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    qr_session_id BIGINT, 
    status ENUM('ACTIVE','ORDERED','CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(idcustomers) ON DELETE CASCADE,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE
);

-- Tạo bảng cart_items
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT DEFAULT 1,
    note TEXT,
    unit_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Bảng đơn đặt món
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT,
    cart_id BIGINT NULL,
    total_price DECIMAL(12,2) DEFAULT 0,
    status ENUM('NEW','IN_PROGRESS','DONE','PAID','CANCELLED') DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL
);

-- Chi tiết món trong đơn hàng
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT,
    menu_item_id BIGINT,
    quantity INT DEFAULT 1,
    note TEXT,
    unit_price DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Bảng thanh toán
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT,
    method ENUM('MOMO','VNPAY','CASH') NOT NULL,
    amount DECIMAL(12,2),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_bill BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Bảng tích điểm khách hàng
CREATE TABLE IF NOT EXISTS reward_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT,
    points INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(idcustomers) ON DELETE CASCADE
);

-- Đánh giá tổng thể bữa ăn
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE
);

-- Đánh giá từng món ăn
CREATE TABLE menu_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    item_id BIGINT,
    qr_session_id BIGINT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE
);

-- Lưu lịch sử chat với chatbot
CREATE TABLE chats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT,
    sender ENUM('USER','BOT'),
    message TEXT,
    intent VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE
);

-- Tài khoản nhân viên hệ thống
CREATE TABLE admins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('STAFF','MANAGER','OWNER') DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Nhân viên
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    gender ENUM('MALE','FEMALE','OTHER') DEFAULT 'OTHER',
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

