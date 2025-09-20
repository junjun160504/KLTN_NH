import { query } from '../config/db.js';

export async function addToCart({qr_session_id}) {
    const sql = `INSERT INTO carts (qr_session_id)
               VALUES (?)`;
    const params = [qr_session_id ?? true];
    const result = await query(sql, params);
    return { id: result.insertId, name, price };
}

export async function getCart() {
    const sql = 'SELECT * FROM carts';
    return await query(sql);
}