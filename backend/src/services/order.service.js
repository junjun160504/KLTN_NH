import { pool, query } from "../config/db.js";

// Tạo đơn mới cho 1 qr_session
export async function createOrder({ qr_session_id }) {
  const [result] = await pool.query(
    "INSERT INTO orders (qr_session_id, total_price, status) VALUES (?, 0, 'NEW')",
    [qr_session_id]
  );
  return { id: result.insertId, qr_session_id, status: "NEW", total_price: 0 };
}

// Thêm món vào đơn
export async function addItem(orderId, { menu_item_id, quantity, note }) {
  const [menuRows] = await pool.query("SELECT * FROM menu_items WHERE id = ?", [menu_item_id]);
  const menu = menuRows[0];
  if (!menu) throw new Error("Menu item not found");

  const unitPrice = menu.price;
  const subtotal = unitPrice * (quantity || 1);

  await pool.query(
    `INSERT INTO order_items (order_id, menu_item_id, quantity, note, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, menu_item_id, quantity || 1, note || null, unitPrice]
  );

  await pool.query(
    "UPDATE orders SET total_price = total_price + ? WHERE id = ?",
    [subtotal, orderId]
  );

  return { orderId, menu_item_id, quantity, unitPrice, subtotal };
}

// Lấy đơn + chi tiết món
export async function getOrderById(orderId) {
  const [[order]] = await pool.query("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) return null;

  const [items] = await pool.query(
    `SELECT oi.*, mi.name as menu_item_name, mi.image_url 
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return { ...order, items };
}

// Cập nhật trạng thái đơn
export async function updateStatus(orderId, status) {
  const valid = ["NEW", "IN_PROGRESS", "DONE", "PAID", "CANCELLED"];
  if (!valid.includes(status)) throw new Error("Invalid order status");

  await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  return { orderId, status };
}
