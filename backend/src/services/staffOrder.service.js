import { query } from "../config/db.js";

export async function confirmOrder(orderId) {
    await query("UPDATE orders SET status = 'IN_PROGRESS' WHERE id = ?", [orderId]);
    return { orderId, status: "IN_PROGRESS" };
}

export async function rejectOrder(orderId, reason) {
    await query("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
    return { orderId, status: "CANCELLED", reason };
}

export async function updateOrderItem(orderItemId, { quantity, note }) {
    await query("UPDATE order_items SET quantity = ?, note = ? WHERE id = ?", [quantity, note, orderItemId]);
    return { orderItemId, quantity, note };
}
