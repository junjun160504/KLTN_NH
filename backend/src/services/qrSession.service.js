import { query } from "../config/db.js";
import QRCodeUtils from "../utils/qrCodeUtils.js";

// Quét QR và mở session mới với validation
export async function startSession({ table_id, customer_id, session_token }) {
    // Validate table exists
    const [table] = await query("SELECT * FROM tables WHERE id = ? AND is_active = true", [table_id]);
    if (!table) throw new Error("Table not found or inactive");

    // Validate QR session token if provided
    if (session_token) {
        const isValidToken = QRCodeUtils.validateSessionToken(table_id, session_token);
        if (!isValidToken) {
            throw new Error("Invalid QR session token");
        }
    }

    // Check bàn đã có session active chưa
    const [active] = await query("SELECT * FROM qr_sessions WHERE table_id = ? AND status = 'ACTIVE'", [table_id]);
    if (active) return active; // return session hiện tại

    const result = await query(
        "INSERT INTO qr_sessions (table_id, customer_id, status) VALUES (?, ?, 'ACTIVE')",
        [table_id, customer_id ?? null]
    );
    return {
        id: result.insertId,
        table_id,
        table_number: table.table_number,
        status: "ACTIVE"
    };
}

// Validate QR and start session (new method for QR scanning)
export async function validateAndStartSession({ qrUrl, customer_id }) {
    // Validate QR format and extract data
    const validation = QRCodeUtils.validateQRData(qrUrl);

    if (!validation.valid) {
        throw new Error(`Invalid QR code: ${validation.error}`);
    }

    // Start session with validated table and token
    return await startSession({
        table_id: validation.tableId,
        customer_id,
        session_token: validation.sessionToken
    });
}

// Đóng session khi thanh toán xong
export async function closeSession(sessionId) {
    await query("UPDATE qr_sessions SET status = 'COMPLETED' WHERE id = ?", [sessionId]);
    return { id: sessionId, status: "COMPLETED" };
}
