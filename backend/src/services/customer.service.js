import { query } from '../config/db.js';

export async function addPhone({ phone }) {
    const found = await query('SELECT * FROM customers WHERE phone = ?', [phone]);
    if (found.length > 0) return { id: found[0].id, phone };

    const res = await query('INSERT INTO customers (phone) VALUES (?)', [phone]);
    return { id: res.insertId, phone };
}
