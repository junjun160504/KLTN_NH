-- Bảng khách hàng
CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NULL,
    email VARCHAR(100) UNIQUE NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    points INT DEFAULT 0,
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

-- Migration: Add session expiration to qr_sessions table
-- Date: October 26, 2025

-- Add expired_at column
ALTER TABLE qr_sessions 
ADD COLUMN expired_at TIMESTAMP NULL DEFAULT NULL AFTER status;

-- Add index for performance
CREATE INDEX idx_qr_sessions_status_expired 
ON qr_sessions(status, expired_at);

-- Update existing ACTIVE sessions to expire in 24 hours
UPDATE qr_sessions 
SET expired_at = DATE_ADD(created_at, INTERVAL 24 HOUR)
WHERE status = 'ACTIVE' AND expired_at IS NULL;

-- Note: 
-- - expired_at = NULL nghĩa là session không bao giờ expire (cho testing)
-- - expired_at != NULL nghĩa là session sẽ expire sau X giờ





-- Bảng danh mục món ăn
CREATE TABLE menu_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

-- Bảng món ăn
CREATE TABLE menu_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng trung gian món ăn, danh mục
CREATE TABLE menu_item_categories (
	id BIGINT PRIMARY KEY AUTO_INCREMENT,
    item_id BIGINT,
    category_id BIGINT,
    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
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
    qr_session_id BIGINT, 
    status ENUM('ACTIVE','ORDERED','CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    status ENUM('IN_CART','ORDERED') DEFAULT 'IN_CART',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Bảng đơn đặt món
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT NOT NULL,
    admin_id BIGINT, 
    total_price DECIMAL(12,2) DEFAULT 0,
    status ENUM('NEW','IN_PROGRESS','DONE','PAID','CANCELLED') DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- Chi tiết món trong đơn hàng
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    cart_item_id BIGINT,  -- 👈 tham chiếu món gốc trong giỏ
    menu_item_id BIGINT,
    quantity INT DEFAULT 1,
    note TEXT,
    unit_price DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_item_id) REFERENCES cart_items(id) ON DELETE SET NULL
);


-- Bảng thanh toán
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT,
    admin_id BIGINT,
    method ENUM('BANKING','CASH') NOT NULL,
    amount DECIMAL(12,2),
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_bill BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

alter table employees
add column updated_at timestamp default null on update CURRENT_TIMESTAMP;


CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    target_type ENUM('CUSTOMER','STAFF','ALL') NOT NULL,
    target_id BIGINT, -- qr_session_id hoặc admin_id
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('ORDER_UPDATE','CALL_STAFF','SYSTEM','PROMOTION') DEFAULT 'SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);

ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
    'ORDER_UPDATE',
    'CALL_STAFF', 
    'PAYMENT',
    'REVIEW',
    'INVENTORY',
    'SYSTEM',
    'SUCCESS',
    'ERROR',
    'WARNING',
    'INFO'
) DEFAULT 'SYSTEM';

-- Thêm các column bổ sung
ALTER TABLE notifications
ADD COLUMN priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
ADD COLUMN action_url VARCHAR(500),
ADD COLUMN metadata JSON,
ADD INDEX idx_is_read (is_read),
ADD INDEX idx_type (type),
ADD INDEX idx_priority (priority);
