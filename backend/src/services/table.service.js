import { query } from "../config/db.js";

export async function createTable({ table_number, qr_code_url }) {
    const result = await query(
        "INSERT INTO tables (table_number, qr_code_url, is_active) VALUES (?, ?, true)",
        [table_number, qr_code_url]
    );
    return { id: result.insertId, table_number, qr_code_url };
}

export async function updateTable(id, { table_number, is_active }) {
    await query("UPDATE tables SET table_number=?, is_active=? WHERE id=?", [
        table_number,
        is_active,
        id,
    ]);
    return { id, table_number, is_active };
}

export async function getTables() {
    return await query("SELECT * FROM tables");
}
