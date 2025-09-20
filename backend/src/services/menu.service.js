import { query } from '../config/db.js';

export async function getAllMenuItems(name) {
    let sql = "";
    let params = [];

    if (name && name !== "all") {
        sql = "SELECT * FROM menu_items WHERE is_available = 1 AND name LIKE ?";
        params.push(`%${name}%`);
    } else {
        sql = "SELECT * FROM menu_items WHERE is_available = 1";
    }

    return await query(sql, params);
}

export async function addMenuItem({ name, price, description, category, image_url, is_available }) {
    const sql = `INSERT INTO menu_items (name, price, description, category, image_url, is_available)
               VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [name, price, description, category, image_url, is_available ?? true];
    const result = await query(sql, params);
    return { id: result.insertId, name, price };
}

export async function getMenuCategories() {
    const sql = 'SELECT * FROM menu_categories WHERE is_available = 1';
    return await query(sql);
}

export async function getItemsByCategory(id) {
    const sql = `
        SELECT 
            mi.id, 
            mi.name, 
            mi.price,
            mi.description,
            mi.image_url,
            mi.is_available,
            mc.id AS categoryId,
            mc.name AS categoryName
        FROM menu_items mi
        LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
        LEFT JOIN menu_categories mc ON mc.id = mic.category_id
        WHERE mic.category_id = ?;
    `;
    return await query(sql, [id]);
}

export async function getAllItems() {
  const sql = `
    SELECT 
      mi.id, 
      mi.name, 
      mi.price,
      mi.description,
      mi.image_url,
      mi.is_available,
      mc.id AS categoryId,
      mc.name AS categoryName
    FROM menu_items mi
    LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
    LEFT JOIN menu_categories mc ON mc.id = mic.category_id;
  `;
  return await query(sql);
}
