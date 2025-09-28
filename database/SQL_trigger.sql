DELIMITER $$

-- Trigger khi INSERT vào order_items thì thay đổi total ở order
CREATE TRIGGER trg_order_items_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders
  SET total_price = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
END$$

-- Trigger khi UPDATE order_items thì thay đổi total ở order
CREATE TRIGGER trg_order_items_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders
  SET total_price = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
END$$

-- Trigger khi DELETE order_items thì thay đổi total ở order
CREATE TRIGGER trg_order_items_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders
  SET total_price = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_id = OLD.order_id
  )
  WHERE id = OLD.order_id;
END$$
DELIMITER ;
-- trigeer sau khi thanh toán trạng thái của qr_session chuyển về complete
DELIMITER $$

CREATE TRIGGER trg_complete_qr_session
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    -- Cập nhật trạng thái session thành COMPLETED
    UPDATE qr_sessions
    SET status = 'COMPLETED'
    WHERE id = NEW.qr_session_id;
END$$

DELIMITER ;



