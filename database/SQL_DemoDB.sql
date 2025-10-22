
DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('STAFF','MANAGER','OWNER') DEFAULT 'STAFF',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (2,1,'admin888','$2b$10$vcsQZDI2nLaMYdftUYNhe.MUYRgASO6LAsJR2KaL.Hh/3OsTAh8k6','STAFF',1,'2025-10-04 09:35:44');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `menu_item_id` bigint NOT NULL,
  `quantity` int DEFAULT '1',
  `note` text,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `status` enum('IN_CART','ORDERED') DEFAULT 'IN_CART',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cart_id` (`cart_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `qr_session_id` bigint DEFAULT NULL,
  `status` enum('ACTIVE','ORDERED','CANCELLED') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qr_session_id` (`qr_session_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`qr_session_id`) REFERENCES `qr_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `qr_session_id` bigint DEFAULT NULL,
  `sender` enum('USER','BOT') DEFAULT NULL,
  `message` text,
  `intent` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qr_session_id` (`qr_session_id`),
  CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`qr_session_id`) REFERENCES `qr_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chats`
--

LOCK TABLES `chats` WRITE;
/*!40000 ALTER TABLE `chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `idcustomers` bigint NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idcustomers`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT 'OTHER',
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Dinh','0348119773','phamducdinh042004@gmail.com','MALE','Hai Duong','2025-10-04 09:35:34');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_categories`
--

DROP TABLE IF EXISTS `menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_categories`
--

LOCK TABLES `menu_categories` WRITE;
/*!40000 ALTER TABLE `menu_categories` DISABLE KEYS */;
INSERT INTO `menu_categories` VALUES (1,'Món đặc trưng','Các món đặc sản nổi bật, mang hương vị đặc trưng của nhà hàng.',1),(2,'Set menu','Thực đơn trọn gói, kết hợp nhiều món ăn hài hòa cho bữa ăn đầy đủ.',1),(3,'Cuốn Phương Nam','Các món cuốn đặc trưng Nam Bộ, tươi ngon, dễ ăn.',1),(4,'Nộm thanh mát','Các món nộm, gỏi với hương vị thanh mát, kích thích vị giác.',1),(5,'Món ăn chơi','Các món ăn nhẹ, dễ thưởng thức khi trò chuyện hoặc khai vị.',1),(6,'Món rau xanh','Các món rau tươi, chế biến đa dạng, tốt cho sức khỏe.',1),(7,'Món ngon vườn nhà','Các món dân dã, gần gũi, mang hương vị vườn nhà.',1),(8,'Món ngon đồng cỏ','Món ăn đặc trưng từ nguyên liệu vùng đồng quê.',1),(9,'Món ngon sông nước','Món ăn chế biến từ thủy sản, mang hương vị miền sông nước.',1),(10,'Lẩu lá giang tươi','Món lẩu chua thanh, nấu cùng lá giang tươi đặc trưng.',1),(11,'Bánh tráng Trảng Bàng','Đặc sản Trảng Bàng với bánh tráng phơi sương, ăn kèm rau và thịt.',1),(12,'Cơm nhà Phương Nam','Các món cơm gia đình đậm đà hương vị miền Nam.',1),(13,'Cơm chiên, mì, cháo','Các món cơm chiên, mì và cháo đa dạng, hợp khẩu vị nhiều thực khách.',1);
/*!40000 ALTER TABLE `menu_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item_categories`
--

DROP TABLE IF EXISTS `menu_item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `item_id` bigint DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `menu_item_categories_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_item_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_categories`
--

LOCK TABLES `menu_item_categories` WRITE;
/*!40000 ALTER TABLE `menu_item_categories` DISABLE KEYS */;
INSERT INTO `menu_item_categories` VALUES (1,1,1),(2,1,9),(3,2,1),(4,2,9),(5,3,1),(6,3,3),(7,3,11),(8,4,1),(9,4,4),(10,5,1),(11,5,10),(12,6,1),(13,6,3),(14,7,1),(15,7,9),(16,8,1),(17,8,3),(18,8,11),(19,9,1),(20,9,3),(21,9,11),(22,10,1),(23,10,10),(24,11,1),(25,11,10),(26,12,1),(27,12,10);
/*!40000 ALTER TABLE `menu_item_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,'Cá kèo muối ớt',128000.00,'Món cá kèo muối ớt là món ngon đặc trưng của sông nước, được chế biến từ cá kèo tươi sống. Cá được ướp với muối và ớt tạo nên hương vị đậm đà, cay nồng. Đây là món ăn hấp dẫn và thường được phục vụ trong các bữa tiệc hoặc cùng gia đình bạn bè.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(2,'Cá đặc sản Phương Nam muối ớt',58000.00,'Cá thòi lòi Cà Mau (phục vụ tối thiểu từ 4 con), loài cá độc lạ nhất.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(3,'Bánh tráng phơi sương cuốn ba chỉ quay (chính hiệu)',158000.00,'Bánh tráng phơi sương Trảng Bàng, thịt ba chỉ quay, rau rừng.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(4,'Nộm củ hủ dừa tôm thịt',138000.00,'Củ hủ dừa, tôm, thịt ba chỉ quay, rau gia vị, nước sốt đặc biệt.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(5,'Lẩu kèo đệ nhất Phương Nam 16 con',498000.00,'Cá kèo đồng bơi 16 con, nước dùng kèm rau, quả, gia vị.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(6,'Bánh xèo cuốn lá cải nhân tép đồng bông điên điển',138000.00,'Bột bánh xèo, nước cốt dừa, trứng gà, tép đồng, bông điên điển, giá.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(7,'Cá lóc hấp bầu',448000.00,'Cá lóc hấp bầu – món ăn lạ miệng, xuất xứ từ miền sông nước.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(8,'Bánh tráng phơi sương cuốn cá lóc nướng (chính hiệu)',448000.00,'Cá lóc 1000–1200gr, bánh tráng 10 lá, rau rừng các loại.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(9,'Bánh tráng Trảng Bàng phơi sương cuốn bò tơ (chính hiệu)',158000.00,'Bò tơ, bánh tráng Trảng Bàng, rau rừng, mắm nêm.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(10,'Lẩu bò lá giang',398000.00,'Thịt bò 0.4kg (bò bắp), lá giang, rau ngò, mùi tàu và các gia vị khác.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(11,'Lẩu gà lá giang (L)',498000.00,'Gà ta ngấm gia vị, nước lẩu chua thanh từ lá giang miền Nam.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1),(12,'Lẩu gà lá giang (N)',398000.00,'Gà ta ngấm gia vị, nước lẩu chua thanh từ lá giang miền Nam.','https://product.hstatic.net/1000093072/product/ca_keo_nuong_muoi_ot_dd2660b8e14d4456b3ad5469746ce601_master.jpg',1);
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_price_history`
--

DROP TABLE IF EXISTS `menu_price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_price_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `item_id` bigint DEFAULT NULL,
  `old_price` decimal(12,2) DEFAULT NULL,
  `new_price` decimal(12,2) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `menu_price_history_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_price_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_price_history`
--

LOCK TABLES `menu_price_history` WRITE;
/*!40000 ALTER TABLE `menu_price_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_reviews`
--

DROP TABLE IF EXISTS `menu_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `item_id` bigint DEFAULT NULL,
  `qr_session_id` bigint DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `qr_session_id` (`qr_session_id`),
  CONSTRAINT `menu_reviews_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_reviews_ibfk_2` FOREIGN KEY (`qr_session_id`) REFERENCES `qr_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_reviews`
--

LOCK TABLES `menu_reviews` WRITE;
/*!40000 ALTER TABLE `menu_reviews` DISABLE KEYS */;
INSERT INTO `menu_reviews` VALUES (1,1,18,4,'kha ngon','2025-10-05 07:01:10'),(2,2,18,5,'ok la','2025-10-05 07:01:10');
/*!40000 ALTER TABLE `menu_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `target_type` enum('CUSTOMER','STAFF','ALL') NOT NULL,
  `target_id` bigint DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `type` enum('ORDER_UPDATE','CALL_STAFF','PAYMENT','REVIEW','INVENTORY','SYSTEM','SUCCESS','ERROR','WARNING','INFO') DEFAULT 'SYSTEM',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `action_url` varchar(500) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`,`target_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'STAFF',NULL,'Bàn T5 - Thêm món vào đơn #11','Khách hàng vừa thêm 1 món: 1x món (giá: 128000.00đ)','ORDER_UPDATE',1,'2025-10-15 15:33:35','medium','/management/orders/11','{\"orderId\": 11, \"tableId\": 5, \"tableName\": \"T5\", \"isNewOrder\": false, \"totalItems\": 1, \"qrSessionId\": 18}'),(2,'STAFF',NULL,'Bàn T5 đang gọi nhân viên','Khách hàng ở Bàn T5 cần hỗ trợ','CALL_STAFF',1,'2025-10-15 16:23:11','high','/management/tables/5','{\"tableId\": 5, \"tableName\": \"T5\", \"qrSessionId\": 18}'),(3,'STAFF',NULL,'Bàn T5 - Thêm món vào đơn #11','Khách hàng vừa thêm 2 món: 1x món (giá: 58000.00đ), 1x món (giá: 128000.00đ)','ORDER_UPDATE',1,'2025-10-16 16:10:09','medium','/management/orders/11','{\"orderId\": 11, \"tableId\": 5, \"tableName\": \"T5\", \"isNewOrder\": false, \"totalItems\": 2, \"qrSessionId\": 18}'),(4,'STAFF',NULL,'Bàn T5 - Thêm món vào đơn #11','Khách hàng vừa thêm 2 món: 1x món (giá: 58000.00đ), 1x món (giá: 158000.00đ)','ORDER_UPDATE',1,'2025-10-16 16:14:53','medium','/management/orders/11','{\"orderId\": 11, \"tableId\": 5, \"tableName\": \"T5\", \"isNewOrder\": false, \"totalItems\": 2, \"qrSessionId\": 18}'),(5,'STAFF',NULL,'Bàn T11 đang gọi nhân viên','Khách hàng ở Bàn T11 cần hỗ trợ','CALL_STAFF',1,'2025-10-16 16:17:30','high','/management/tables/11','{\"tableId\": 11, \"tableName\": \"T11\", \"qrSessionId\": 21}'),(6,'STAFF',NULL,'Bàn T11 - Thêm món vào đơn #13','Khách hàng vừa thêm 1 món: 1x món (giá: 128000.00đ)','ORDER_UPDATE',1,'2025-10-16 16:18:02','medium','/management/orders/13','{\"orderId\": 13, \"tableId\": 11, \"tableName\": \"T11\", \"isNewOrder\": false, \"totalItems\": 1, \"qrSessionId\": 21}'),(7,'STAFF',NULL,'✏️ Bàn T6 - Cập nhật đơn #12','Khách hàng đã cập nhật số lượng món (số lượng: 3 → 1)','ORDER_UPDATE',1,'2025-10-20 15:01:07','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"newQuantity\": 1, \"oldQuantity\": 3, \"qrSessionId\": 19, \"updatedItemId\": \"10\"}'),(8,'STAFF',NULL,'✏️ Bàn T6 - Cập nhật đơn #12','Khách hàng đã cập nhật số lượng món (số lượng: 1 → 2)','ORDER_UPDATE',1,'2025-10-20 15:01:29','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"newQuantity\": 2, \"oldQuantity\": 1, \"qrSessionId\": 19, \"updatedItemId\": \"10\"}'),(9,'STAFF',NULL,'?️ Bàn T6 - Xóa món khỏi đơn #12','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',1,'2025-10-20 17:34:31','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"qrSessionId\": 19, \"removedItemId\": \"10\", \"remainingItems\": 3}'),(10,'STAFF',NULL,'❌ Bàn T5 - Hủy đơn #11','Khách hàng đã hủy đơn hàng (Lý do: Hủy từ danh sách đơn hàng)','ORDER_UPDATE',1,'2025-10-20 17:40:17','medium','/management/orders/11','{\"orderId\": \"11\", \"tableId\": 5, \"tableName\": \"T5\", \"qrSessionId\": 18, \"cancelReason\": \"Hủy từ danh sách đơn hàng\", \"previousStatus\": \"NEW\"}'),(11,'STAFF',NULL,'✏️ Bàn T6 - Cập nhật đơn #12','Khách hàng đã cập nhật số lượng món (số lượng: 2 → 3)','ORDER_UPDATE',1,'2025-10-22 14:12:51','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"newQuantity\": 3, \"oldQuantity\": 2, \"qrSessionId\": 19, \"updatedItemId\": \"13\"}'),(12,'STAFF',NULL,'✏️ Bàn T6 - Cập nhật đơn #12','Khách hàng đã cập nhật số lượng món (số lượng: 3 → 2)','ORDER_UPDATE',1,'2025-10-22 14:13:05','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"newQuantity\": 2, \"oldQuantity\": 3, \"qrSessionId\": 19, \"updatedItemId\": \"13\"}'),(13,'STAFF',NULL,'✏️ Bàn T6 - Cập nhật đơn #12','Khách hàng đã cập nhật số lượng món (số lượng: 2 → 1)','ORDER_UPDATE',1,'2025-10-22 14:13:19','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"newQuantity\": 1, \"oldQuantity\": 2, \"qrSessionId\": 19, \"updatedItemId\": \"13\"}'),(14,'STAFF',NULL,'?️ Bàn T6 - Xóa món khỏi đơn #12','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',1,'2025-10-22 14:43:39','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"qrSessionId\": 19, \"removedItemId\": \"11\", \"remainingItems\": 2}'),(15,'STAFF',NULL,'?️ Bàn T11 - Xóa món khỏi đơn #13','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',1,'2025-10-22 16:31:34','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"qrSessionId\": 21, \"removedItemId\": \"21\", \"remainingItems\": 2}'),(16,'STAFF',NULL,'✏️ Bàn T11 - Cập nhật đơn #13','Khách hàng đã cập nhật số lượng món (số lượng: 1 → 2)','ORDER_UPDATE',1,'2025-10-22 16:33:23','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"newQuantity\": 2, \"oldQuantity\": 1, \"qrSessionId\": 21, \"updatedItemId\": \"20\"}'),(17,'STAFF',NULL,'✏️ Bàn T11 - Cập nhật đơn #13','Khách hàng đã cập nhật số lượng món (số lượng: 1 → 2)','ORDER_UPDATE',1,'2025-10-22 16:37:33','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"newQuantity\": 2, \"oldQuantity\": 1, \"qrSessionId\": 21, \"updatedItemId\": \"19\"}'),(18,'STAFF',NULL,'?️ Bàn T6 - Xóa món khỏi đơn #12','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',1,'2025-10-22 16:38:15','low','/management/orders/12','{\"orderId\": \"12\", \"tableId\": 6, \"tableName\": \"T6\", \"qrSessionId\": 19, \"removedItemId\": \"13\", \"remainingItems\": 1}'),(19,'STAFF',NULL,'?️ Bàn T11 - Xóa món khỏi đơn #13','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',1,'2025-10-22 16:38:34','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"qrSessionId\": 21, \"removedItemId\": \"20\", \"remainingItems\": 1}'),(20,'STAFF',NULL,'✏️ Bàn T11 - Cập nhật đơn #13','Khách hàng đã cập nhật số lượng món (số lượng: 2 → 3)','ORDER_UPDATE',1,'2025-10-22 16:50:06','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"newQuantity\": 3, \"oldQuantity\": 2, \"qrSessionId\": 21, \"updatedItemId\": \"19\"}'),(21,'STAFF',NULL,'✏️ Bàn T11 - Cập nhật đơn #13','Khách hàng đã cập nhật số lượng món (số lượng: 3 → 4)','ORDER_UPDATE',1,'2025-10-22 16:52:00','low','/management/orders/13','{\"orderId\": \"13\", \"tableId\": 11, \"tableName\": \"T11\", \"newQuantity\": 4, \"oldQuantity\": 3, \"qrSessionId\": 21, \"updatedItemId\": \"19\"}'),(22,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 58000.00đ)','ORDER_UPDATE',0,'2025-10-22 17:24:20','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(23,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 158000.00đ)','ORDER_UPDATE',0,'2025-10-22 17:24:33','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(24,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 498000.00đ)','ORDER_UPDATE',0,'2025-10-22 17:24:42','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(25,'STAFF',NULL,'?️ Bàn T6 - Xóa món khỏi đơn #15','Khách hàng đã xóa 1 món khỏi đơn hàng','ORDER_UPDATE',0,'2025-10-22 17:27:00','low','/management/orders/15','{\"orderId\": \"15\", \"tableId\": 6, \"tableName\": \"T6\", \"qrSessionId\": 19, \"removedItemId\": \"26\", \"remainingItems\": 3}'),(26,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 498000.00đ)','ORDER_UPDATE',0,'2025-10-22 17:31:20','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(27,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 158000.00đ)','ORDER_UPDATE',0,'2025-10-22 17:34:46','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(28,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 138000.00đ)','ORDER_UPDATE',0,'2025-10-22 18:14:40','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(29,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 138000.00đ)','ORDER_UPDATE',0,'2025-10-22 18:14:53','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(30,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 128000.00đ)','ORDER_UPDATE',0,'2025-10-22 18:15:02','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(31,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 128000.00đ)','ORDER_UPDATE',0,'2025-10-22 18:17:11','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}'),(32,'STAFF',NULL,'? [ADMIN] Bàn T6 - Thêm món #15','Admin đã tạo đơn với 1 món: 1x món (giá: 58000.00đ)','ORDER_UPDATE',0,'2025-10-22 18:17:13','high','/management/orders/15','{\"adminId\": null, \"orderId\": 15, \"tableId\": 6, \"tableName\": \"T6\", \"totalItems\": 1, \"qrSessionId\": 19, \"createdByAdmin\": true}');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `cart_item_id` bigint DEFAULT NULL,
  `menu_item_id` bigint NOT NULL,
  `quantity` int DEFAULT '1',
  `note` text,
  `unit_price` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  KEY `cart_item_id` (`cart_item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (3,10,NULL,4,1,NULL,138000.00),(4,10,NULL,5,1,NULL,498000.00),(5,10,NULL,3,1,NULL,158000.00),(6,10,NULL,1,1,NULL,128000.00),(7,10,NULL,12,1,NULL,398000.00),(8,10,NULL,12,1,NULL,398000.00),(9,11,NULL,3,1,NULL,158000.00),(14,11,NULL,1,1,NULL,128000.00),(15,11,NULL,2,1,NULL,58000.00),(16,11,NULL,1,1,NULL,128000.00),(17,11,NULL,2,1,NULL,58000.00),(18,11,NULL,3,1,NULL,158000.00),(19,13,NULL,1,5,NULL,128000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `qr_session_id` bigint NOT NULL,
  `admin_id` bigint DEFAULT NULL,
  `total_price` decimal(12,2) DEFAULT '0.00',
  `status` enum('NEW','IN_PROGRESS','DONE','PAID','CANCELLED') DEFAULT 'NEW',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qr_session_id` (`qr_session_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`qr_session_id`) REFERENCES `qr_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (10,18,NULL,0.00,'PAID','2025-10-05 02:18:38','2025-10-05 03:23:08'),(11,18,NULL,0.00,'CANCELLED','2025-10-05 03:23:59','2025-10-20 17:40:17'),(13,21,NULL,326000.00,'NEW','2025-10-16 16:16:31','2025-10-22 17:11:46');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  `method` enum('BANKING','CASH') NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `payment_status` enum('PENDING','PAID','FAILED','REFUNDED') DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `printed_bill` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,11,NULL,'BANKING',0.00,'PENDING','2025-10-15 15:33:58',0);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_sessions`
--

DROP TABLE IF EXISTS `qr_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `table_id` bigint NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `status` enum('ACTIVE','COMPLETED') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `qr_sessions_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qr_sessions_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`idcustomers`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_sessions`
--

LOCK TABLES `qr_sessions` WRITE;
/*!40000 ALTER TABLE `qr_sessions` DISABLE KEYS */;
INSERT INTO `qr_sessions` VALUES (18,5,NULL,'ACTIVE','2025-10-04 07:34:37'),(19,6,NULL,'ACTIVE','2025-10-05 14:26:21'),(21,11,NULL,'ACTIVE','2025-10-16 16:16:15');
/*!40000 ALTER TABLE `qr_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `qr_session_id` bigint DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qr_session_id` (`qr_session_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`qr_session_id`) REFERENCES `qr_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_points`
--

DROP TABLE IF EXISTS `reward_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reward_points` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint DEFAULT NULL,
  `points` int DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `reward_points_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`idcustomers`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_points`
--

LOCK TABLES `reward_points` WRITE;
/*!40000 ALTER TABLE `reward_points` DISABLE KEYS */;
/*!40000 ALTER TABLE `reward_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `table_number` varchar(10) NOT NULL,
  `qr_code_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_number` (`table_number`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (5,'T5','/qr/table-5.png',1),(6,'T6','/qr/table-6.png',1),(11,'T11','/qr/table-11.png',1);
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'kltn_nhahang'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-23  1:22:14
