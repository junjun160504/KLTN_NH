import { query } from "../config/db.js";
import QRCodeUtils from "../utils/qrCodeUtils.js";

export async function createTable({ table_number }) {
    try {
        // Step 1: Create table record first (without QR URL)
        const result = await query(
            "INSERT INTO tables (table_number, is_active) VALUES (?, true)",
            [table_number]
        );

        const tableId = result.insertId;

        // Step 2: Generate QR code for the new table
        const qrResult = await QRCodeUtils.generateTableQR(tableId);

        // Step 3: Update table with QR code URL
        await query(
            "UPDATE tables SET qr_code_url = ? WHERE id = ?",
            [qrResult.imagePath, tableId]
        );

        return {
            id: tableId,
            table_number,
            qr_code_url: qrResult.imagePath,
            qr_url: qrResult.qrUrl,
            session_token: qrResult.sessionToken,
            generated_at: qrResult.generatedAt
        };
    } catch (error) {
        console.error("Error creating table with QR:", error);
        throw new Error(`Failed to create table with QR: ${error.message}`);
    }
}

export async function updateTable(id, { table_number, is_active }) {
    await query("UPDATE tables SET table_number=?, is_active=? WHERE id=?", [
        table_number,
        is_active,
        id,
    ]);
    return { id, table_number, is_active };
}

export async function deleteTable(id) {
    try {
        // Check if table exists
        const [table] = await query("SELECT * FROM tables WHERE id = ?", [id]);
        if (!table) {
            throw new Error(`Table with ID ${id} not found`);
        }

        // Check if table has active sessions
        const [activeSession] = await query(
            "SELECT * FROM qr_sessions WHERE table_id = ? AND status = 'ACTIVE'",
            [id]
        );

        if (activeSession) {
            throw new Error(`Cannot delete table ${table.table_number}. There are active customer sessions.`);
        }

        // Check if table has pending orders
        const pendingOrders = await query(`
            SELECT COUNT(*) as count FROM orders o 
            JOIN qr_sessions q ON o.qr_session_id = q.id 
            WHERE q.table_id = ? AND o.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
        `, [id]);

        if (pendingOrders[0].count > 0) {
            throw new Error(`Cannot delete table ${table.table_number}. There are pending orders.`);
        }

        // Safe to delete - remove table record
        await query("DELETE FROM tables WHERE id = ?", [id]);

        // Note: QR image file will remain for reference, can be cleaned up separately
        return {
            id,
            table_number: table.table_number,
            message: `Table ${table.table_number} deleted successfully`
        };
    } catch (error) {
        throw new Error(`Failed to delete table: ${error.message}`);
    }
}

export async function getTables() {
    return await query("SELECT * FROM tables");
}
