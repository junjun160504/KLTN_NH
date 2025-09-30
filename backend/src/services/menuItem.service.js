export async function updateMenuItem(id, { name, price, description, image_url, is_available }) {
    await query(
        `UPDATE menu_items SET name=?, price=?, description=?, image_url=?, is_available=? WHERE id=?`,
        [name, price, description, image_url, is_available, id]
    );
    return { id, name, price };
}

export async function deleteMenuItem(id) {
    const result = await query("DELETE FROM menu_items WHERE id = ?", [id]);
    return result.affectedRows > 0;
}
