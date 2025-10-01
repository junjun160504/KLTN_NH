-- ================================
-- ENHANCEMENT FOR QR ORDERING SYSTEM
-- ================================

-- 1. Bổ sung parent-child relationship cho orders
ALTER TABLE orders ADD COLUMN parent_order_id BIGINT NULL;
ALTER TABLE orders ADD COLUMN order_type ENUM('MAIN','ADDITIONAL') DEFAULT 'MAIN';
ALTER TABLE orders ADD FOREIGN KEY (parent_order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- 2. Cập nhật order status để phù hợp yêu cầu
ALTER TABLE orders MODIFY status ENUM('PENDING','CONFIRMED','IN_PROGRESS','DONE','PAID','CANCELLED') DEFAULT 'PENDING';

-- 3. Thêm bảng call staff requests
CREATE TABLE call_staff_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT NOT NULL,
    request_type ENUM('HELP','PAYMENT','COMPLAINT','OTHER') DEFAULT 'HELP',
    message TEXT,
    status ENUM('PENDING','RESPONDED','RESOLVED') DEFAULT 'PENDING',
    admin_id BIGINT, -- nhân viên xử lý
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- 4. Thêm audit trail cho order changes
CREATE TABLE order_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by BIGINT, -- admin_id
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- 5. Thêm real-time notifications
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

-- 6. Index optimization cho performance
CREATE INDEX idx_orders_qr_session_status ON orders(qr_session_id, status);
CREATE INDEX idx_orders_parent ON orders(parent_order_id);
CREATE INDEX idx_qr_sessions_table_status ON qr_sessions(table_id, status);
CREATE INDEX idx_cart_items_cart_status ON cart_items(cart_id, status);

-- 7. Triggers để tự động cập nhật timestamps và audit
DELIMITER //

CREATE TRIGGER order_status_audit_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_audit (order_id, old_status, new_status, changed_by, change_reason)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.admin_id, 'Status updated');
    END IF;
END//

CREATE TRIGGER notification_order_update_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO notifications (target_type, target_id, title, message, type)
        VALUES ('CUSTOMER', NEW.qr_session_id, 
                CONCAT('Đơn hàng #', NEW.id, ' đã được cập nhật'),
                CONCAT('Trạng thái: ', NEW.status),
                'ORDER_UPDATE');
    END IF;
END//

DELIMITER ;