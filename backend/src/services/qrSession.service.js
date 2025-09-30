import { query } from "../config/db.js";

// Quét QR và mở session mới
export async function startSession({ table_id, customer_id }) {
    const [table] = await query("SELECT * FROM tables WHERE id = ?", [table_id]);
    if (!table) throw new Error("Table not found");

    // Check bàn đã có session active chưa
    const [active] = await query("SELECT * FROM qr_sessions WHERE table_id = ? AND status = 'ACTIVE'", [table_id]);
    if (active) return active; // return session hiện tại

    const result = await query(
        "INSERT INTO qr_sessions (table_id, customer_id, status) VALUES (?, ?, 'ACTIVE')",
        [table_id, customer_id ?? null]
    );
    return { id: result.insertId, table_id, status: "ACTIVE" };
}

// Đóng session khi thanh toán xong
export async function closeSession(sessionId) {
    await query("UPDATE qr_sessions SET status = 'COMPLETED' WHERE id = ?", [sessionId]);
    return { id: sessionId, status: "COMPLETED" };
}
