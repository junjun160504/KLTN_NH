import { query } from '../config/db.js';

export async function createOrder({ qr_session_id }) {
    const sql = 'INSERT INTO orders (qr_session_id) VALUES (?)';
    const result = await query(sql, [qr_session_id]);
    return { id: result.insertId, status: 'NEW' };
}

export async function addItem(orderId, { menu_item_id, quantity, note }) {
    const menu = await query('SELECT * FROM menu_items WHERE id = ?', [menu_item_id]);
    if (!menu[0]) throw new Error('Menu item not found');
    const unitPrice = menu[0].price;

    await query(`INSERT INTO order_items (order_id, menu_item_id, quantity, note, unit_price)
               VALUES (?, ?, ?, ?, ?)`, [orderId, menu_item_id, quantity, note, unitPrice]);

    await query(`UPDATE orders SET total_price = total_price + ? WHERE id = ?`, [unitPrice * quantity, orderId]);
    return { orderId, menu_item_id, quantity, unitPrice };
}

export async function getOrderById(orderId) {
    const order = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    return { ...order[0], items };
}

export async function updateStatus(orderId, status) {
    await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    return { orderId, status };
}
