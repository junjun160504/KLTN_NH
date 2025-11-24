import { query } from "../config/db.js";   // 👈 thêm dòng này ở đầu file
export async function updateMenuItem(id, { name, price, description, image_url, is_available }) {
    const found = await query("SELECT id FROM menu_items WHERE id=? AND deleted_at IS NULL", [id]);
    if (found.length === 0) throw new Error(`Menu item with id ${id} not found`);

    await query(
        `UPDATE menu_items 
         SET name=?, price=?, description=?, image_url=?, is_available=? 
         WHERE id=?`,
        [name, price, description, image_url, is_available, id]
    );
    return { id, name, price, description, image_url, is_available };
}

export async function deleteMenuItem(id) {
    const result = await query("UPDATE menu_items SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", [id]);
    return result.affectedRows > 0;
}
