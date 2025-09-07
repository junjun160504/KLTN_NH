import { query } from '../config/db.js';

export async function payOrder({ order_id, method, print_bill }) {
    const order = await query('SELECT total_price FROM orders WHERE id = ?', [order_id]);
    if (!order[0]) throw new Error('Order not found');

    const amount = order[0].total_price;

    await query(`INSERT INTO payments (order_id, method, amount, printed_bill)
               VALUES (?, ?, ?, ?)`, [order_id, method, amount, print_bill ?? false]);

    await query(`UPDATE orders SET status = 'PAID' WHERE id = ?`, [order_id]);

    return {
        order_id,
        method,
        amount,
        status: 'PAID',
        print_bill: !!print_bill
    };
}
