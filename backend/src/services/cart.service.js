import { pool } from '../config/db.js';

export async function addToCart({ qr_session_id, menu_item_id, quantity, note }) {
  // 1. Tìm hoặc tạo giỏ hàng ACTIVE cho session
  const [cartRows] = await pool.query(
    'SELECT * FROM carts WHERE qr_session_id = ? AND status = "ACTIVE"',
    [qr_session_id]
  );

  let cartId;
  if (cartRows.length === 0) {
    const [newCart] = await pool.query(
      'INSERT INTO carts (qr_session_id, status) VALUES (?, "ACTIVE")',
      [qr_session_id]
    );
    cartId = newCart.insertId;
  } else {
    cartId = cartRows[0].id;
  }

  // 2. Lấy giá món ăn
  const [[item]] = await pool.query('SELECT price FROM menu_items WHERE id = ?', [menu_item_id]);
  if (!item) throw new Error('Món không tồn tại');

  // 3. Thêm món vào cart_items
  const [result] = await pool.query(
    `INSERT INTO cart_items (cart_id, menu_item_id, quantity, note, unit_price) 
     VALUES (?, ?, ?, ?, ?)`,
    [cartId, menu_item_id, quantity || 1, note || null, item.price]
  );

  return {
    cart_item_id: result.insertId,
    cart_id: cartId,
    menu_item_id,
    quantity,
    note,
    unit_price: item.price
  };
}

export async function getCart(qr_session_id) {
  const [rows] = await pool.query(
    `SELECT ci.id as cart_item_id, ci.quantity, ci.note, ci.unit_price,
            mi.name as menu_item_name, mi.image_url
     FROM carts c
     JOIN cart_items ci ON c.id = ci.cart_id
     JOIN menu_items mi ON ci.menu_item_id = mi.id
     WHERE c.qr_session_id = ? AND c.status = "ACTIVE"`,
    [qr_session_id]
  );
  return rows;
}
