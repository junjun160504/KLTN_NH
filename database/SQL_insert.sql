INSERT INTO employees (name, phone, email, gender, address, created_at)
VALUES 
('Admin', '0342845584', 'admin@gmail.com', 'FEMALE', 'Hà Nội', '2025-08-27 21:42:30'),
('Ngô Thùy Dung', '0902222222', 'vydung0504@gmail.com', 'FEMALE', 'Hải Dương', '2025-08-27 21:42:30'),
('Ngô Viết Tùng', '0903333333', 'tungngo@gmail.com', 'MALE', 'Hải Dương', '2025-08-27 21:42:30');

INSERT INTO admins (employee_id, username, password, role, is_active, created_at)
VALUES
(1, 'admin', '123456', 'OWNER', 1, '2025-08-27 21:49:42'),
(2, 'dungnt', '123456', 'STAFF', 1, '2025-08-27 21:49:42'),
(3, 'tungnv', '123456', 'STAFF', 1, '2025-08-27 21:49:42');

INSERT INTO customers (phone, created_at)
VALUES ('0900000001', '2025-08-27 21:51:11');


-- menu
INSERT INTO menu_categories (name, description) VALUES
('Món đặc trưng','Các món đặc sản nổi bật, mang hương vị đặc trưng của nhà hàng.'),
('Set menu','Thực đơn trọn gói, kết hợp nhiều món ăn hài hòa cho bữa ăn đầy đủ.'),
('Cuốn Phương Nam','Các món cuốn đặc trưng Nam Bộ, tươi ngon, dễ ăn.'),
('Nộm thanh mát','Các món nộm, gỏi với hương vị thanh mát, kích thích vị giác.'),
('Món ăn chơi','Các món ăn nhẹ, dễ thưởng thức khi trò chuyện hoặc khai vị.'),
('Món rau xanh','Các món rau tươi, chế biến đa dạng, tốt cho sức khỏe.'),
('Món ngon vườn nhà','Các món dân dã, gần gũi, mang hương vị vườn nhà.'),
('Món ngon đồng cỏ','Món ăn đặc trưng từ nguyên liệu vùng đồng quê.'),
('Món ngon sông nước','Món ăn chế biến từ thủy sản, mang hương vị miền sông nước.'),
('Lẩu lá giang tươi','Món lẩu chua thanh, nấu cùng lá giang tươi đặc trưng.'),
('Bánh tráng Trảng Bàng','Đặc sản Trảng Bàng với bánh tráng phơi sương, ăn kèm rau và thịt.'),
('Cơm nhà Phương Nam','Các món cơm gia đình đậm đà hương vị miền Nam.'),
('Cơm chiên, mì, cháo','Các món cơm chiên, mì và cháo đa dạng, hợp khẩu vị nhiều thực khách.');

-- item
INSERT INTO menu_items (name, price, description, image_url, is_available) VALUES
('Cá kèo muối ớt', 128000, 'Cá kèo đi máy bay – món ngon sông nước, món đặc sản, món đặc trưng.', NULL, 1),
('Cá đặc sản Phương Nam muối ớt', 58000, 'Cá thòi lòi Cà Mau (phục vụ tối thiểu từ 4 con), loài cá độc lạ nhất.', NULL, 1),
('Bánh tráng phơi sương cuốn ba chỉ quay (chính hiệu)', 158000, 'Bánh tráng phơi sương Trảng Bàng, thịt ba chỉ quay, rau rừng.', NULL, 1),
('Nộm củ hủ dừa tôm thịt', 138000, 'Củ hủ dừa, tôm, thịt ba chỉ quay, rau gia vị, nước sốt đặc biệt.', NULL, 1),
('Lẩu kèo đệ nhất Phương Nam 16 con', 498000, 'Cá kèo đồng bơi 16 con, nước dùng kèm rau, quả, gia vị.', NULL, 1),
('Bánh xèo cuốn lá cải nhân tép đồng bông điên điển', 138000, 'Bột bánh xèo, nước cốt dừa, trứng gà, tép đồng, bông điên điển, giá.', NULL, 1),
('Cá lóc hấp bầu', 448000, 'Cá lóc hấp bầu – món ăn lạ miệng, xuất xứ từ miền sông nước.', NULL, 1),
('Bánh tráng phơi sương cuốn cá lóc nướng (chính hiệu)', 448000, 'Cá lóc 1000–1200gr, bánh tráng 10 lá, rau rừng các loại.', NULL, 1),
('Bánh tráng Trảng Bàng phơi sương cuốn bò tơ (chính hiệu)', 158000, 'Bò tơ, bánh tráng Trảng Bàng, rau rừng, mắm nêm.', NULL, 1),
('Lẩu bò lá giang', 398000, 'Thịt bò 0.4kg (bò bắp), lá giang, rau ngò, mùi tàu và các gia vị khác.', NULL, 1),
('Lẩu gà lá giang (L)', 498000, 'Gà ta ngấm gia vị, nước lẩu chua thanh từ lá giang miền Nam.', NULL, 1),
('Lẩu gà lá giang (N)', 398000, 'Gà ta ngấm gia vị, nước lẩu chua thanh từ lá giang miền Nam.', NULL, 1);

-- menu_item
INSERT INTO menu_item_categories (item_id, category_id) VALUES
(1, 1), (1, 9),
(2, 1), (2, 9),
(3, 1), (3, 3), (3, 11),
(4, 1), (4, 4),
(5, 1), (5, 10),
(6, 1), (6, 3),
(7, 1), (7, 9),
(8, 1), (8, 3), (8, 11),
(9, 1), (9, 3), (9, 11),
(10, 1), (10, 10),
(11, 1), (11, 10),
(12, 1), (12, 10);

-- tables
INSERT INTO tables (table_number, qr_code_url, is_active) VALUES
('T1', NULL, 1),
('T2', NULL, 1),
('T3', NULL, 1),
('T4', NULL, 1),
('T5', NULL, 1),
('T6', NULL, 1),
('T7', NULL, 1),
('T8', NULL, 1),
('T9', NULL, 1),
('T10', NULL, 1);

-- qr_sessions
INSERT INTO qr_sessions (table_id, customer_id, status) VALUES
(1, 1, 'ACTIVE'),
(2, null, 'COMPLETED'),
(3, null, 'ACTIVE');


-- test thử
-- Phiên QR tại bàn số 1
INSERT INTO qr_sessions (id, table_id, customer_id)
VALUES (1, 1, 1);

-- Giỏ hàng của khách
INSERT INTO carts (id, customer_id, qr_session_id, status)
VALUES (1, 1, 1, 'ACTIVE');

-- Chi tiết giỏ hàng
INSERT INTO cart_items (id, cart_id, menu_item_id, quantity, note, unit_price)
VALUES 
(1, 1, 1, 2, 'Ít cay', 128000),
(2, 1, 2, 1, NULL, 58000); 

-- Đơn hàng
INSERT INTO orders (id, qr_session_id)
VALUES (1, 1);

INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, note)
VALUES
(1, 1, 1, 2, 128000, 'Ít cay'),   
(2, 1, 2, 1, 58000, NULL);  

-- Thanh toán
INSERT INTO payments (qr_session_id, method, printed_bill)
VALUES (1, 'CASH', 1);

