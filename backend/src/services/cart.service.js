import { pool, query } from "../config/db.js";

/**
 * Thêm món vào giỏ hàng
 * Auto tìm hoặc tạo cart ACTIVE cho qr_session
 */
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
    `INSERT INTO cart_items (cart_id, menu_item_id, quantity, note, unit_price, status) 
     VALUES (?, ?, ?, ?, ?, 'IN_CART')`,
    [cartId, menu_item_id, quantity || 1, note || null, item.price]
  );

  return {
    cart_item_id: result.insertId,
    cart_id: cartId,
    menu_item_id,
    quantity: quantity || 1,
    note,
    unit_price: item.price
  };
}

/**
 * Lấy giỏ hàng theo qr_session_id
 */
export async function getCart(qr_session_id) {
  const [rows] = await pool.query(
    `SELECT ci.id as cart_item_id, ci.quantity, ci.note, ci.unit_price, ci.status,
            mi.id as menu_item_id, mi.name as menu_item_name, mi.image_url,
            c.id as cart_id, c.status as cart_status
     FROM carts c
     JOIN cart_items ci ON c.id = ci.cart_id
     JOIN menu_items mi ON ci.menu_item_id = mi.id
     WHERE c.qr_session_id = ? AND c.status = "ACTIVE" AND ci.status = 'IN_CART'
     ORDER BY ci.created_at DESC`,
    [qr_session_id]
  );
  return rows;
}

/**
 * Cập nhật số lượng hoặc note của cart item
 * Nếu quantity = 0 → Xóa item
 */
export async function updateCartItem(cartItemId, { quantity, note }) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get cart item info
    const [[cartItem]] = await connection.query(
      `SELECT ci.*, c.status as cart_status 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ?`,
      [cartItemId]
    );

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // 2. Validate cart status
    if (cartItem.cart_status !== 'ACTIVE') {
      throw new Error('Cannot update item in non-active cart');
    }

    if (cartItem.status !== 'IN_CART') {
      throw new Error('Cannot update item that has been ordered');
    }

    // 3. Handle quantity = 0 (delete item)
    if (quantity !== undefined && quantity === 0) {
      await connection.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
      await connection.commit();

      return {
        deleted: true,
        message: 'Cart item deleted successfully'
      };
    }

    // 4. Validate quantity
    if (quantity !== undefined && quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    // 5. Update item
    const updates = [];
    const values = [];

    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity);
    }

    if (note !== undefined) {
      updates.push('note = ?');
      values.push(note);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(cartItemId);

    await connection.query(
      `UPDATE cart_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();

    // 6. Return updated cart item
    const [[updatedItem]] = await connection.query(
      `SELECT ci.*, mi.name as menu_item_name, mi.image_url
       FROM cart_items ci
       JOIN menu_items mi ON ci.menu_item_id = mi.id
       WHERE ci.id = ?`,
      [cartItemId]
    );

    return updatedItem;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Xóa một món khỏi giỏ hàng
 */
export async function removeCartItem(cartItemId) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get cart item info
    const [[cartItem]] = await connection.query(
      `SELECT ci.*, c.status as cart_status 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ?`,
      [cartItemId]
    );

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // 2. Validate cart status
    if (cartItem.cart_status !== 'ACTIVE') {
      throw new Error('Cannot remove item from non-active cart');
    }

    if (cartItem.status !== 'IN_CART') {
      throw new Error('Cannot remove item that has been ordered');
    }

    // 3. Delete item
    await connection.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);

    await connection.commit();

    return {
      success: true,
      message: 'Cart item removed successfully'
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Xóa tất cả items trong giỏ hàng (Clear cart)
 */
export async function clearCart(qr_session_id) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get cart
    const [[cart]] = await connection.query(
      'SELECT * FROM carts WHERE qr_session_id = ? AND status = "ACTIVE"',
      [qr_session_id]
    );

    if (!cart) {
      throw new Error('No active cart found for this session');
    }

    // 2. Delete all IN_CART items
    const [result] = await connection.query(
      'DELETE FROM cart_items WHERE cart_id = ? AND status = "IN_CART"',
      [cart.id]
    );

    await connection.commit();

    return {
      success: true,
      message: `Cleared ${result.affectedRows} items from cart`,
      deletedCount: result.affectedRows
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Cập nhật status của cart (ACTIVE → ORDERED/CANCELLED)
 */
export async function updateCartStatus(cartId, status) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate status
    const validStatuses = ['ACTIVE', 'ORDERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // 2. Get cart
    const [[cart]] = await connection.query('SELECT * FROM carts WHERE id = ?', [cartId]);

    if (!cart) {
      throw new Error('Cart not found');
    }

    // 3. Update status
    await connection.query('UPDATE carts SET status = ? WHERE id = ?', [status, cartId]);

    // 4. If status = ORDERED, update all cart_items status
    if (status === 'ORDERED') {
      await connection.query(
        'UPDATE cart_items SET status = "ORDERED" WHERE cart_id = ? AND status = "IN_CART"',
        [cartId]
      );
    }

    await connection.commit();

    return {
      success: true,
      message: `Cart status updated to ${status}`,
      cart_id: cartId,
      new_status: status
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
