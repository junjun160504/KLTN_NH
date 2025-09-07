import { query } from '../config/db.js';

export async function getAllMenuItems() {
    const sql = 'SELECT * FROM menu_items WHERE is_available = 1';
    return await query(sql);
}

export async function addMenuItem({ name, price, description, category, image_url, is_available }) {
    const sql = `INSERT INTO menu_items (name, price, description, category, image_url, is_available)
               VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [name, price, description, category, image_url, is_available ?? true];
    const result = await query(sql, params);
    return { id: result.insertId, name, price };
}
