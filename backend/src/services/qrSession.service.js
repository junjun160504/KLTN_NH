import { query } from "../config/db.js";
import QRCodeUtils from "../utils/qrCodeUtils.js";

/**
 * Validate existing session (for localStorage restore)
 * Check if session is still valid (ACTIVE, not expired, table still exists)
 */
export async function validateSession(sessionId) {
    try {
        // Get session with table info
        const [session] = await query(`
            SELECT 
                qs.*,
                t.table_number,
                t.is_active as table_is_active
            FROM qr_sessions qs
            JOIN tables t ON qs.table_id = t.id
            WHERE qs.id = ?
        `, [sessionId]);

        if (!session) {
            return {
                valid: false,
                reason: 'SESSION_NOT_FOUND',
                message: 'Session không tồn tại'
            };
        }

        // Check session status
        if (session.status !== 'ACTIVE') {
            return {
                valid: false,
                reason: 'SESSION_COMPLETED',
                message: 'Session đã kết thúc (khách đã thanh toán)',
                shouldClear: false // ✅ Không xóa - customer cần xem bills và reviews
            };
        }

        // Check table still active
        if (!session.table_is_active) {
            return {
                valid: false,
                reason: 'TABLE_INACTIVE',
                message: 'Bàn không còn hoạt động',
                shouldClear: true
            };
        }

        // Check expiration (if expired_at exists)
        if (session.expired_at) {
            const now = new Date();
            const expiredAt = new Date(session.expired_at);

            if (now > expiredAt) {
                // Auto close expired session
                await query(
                    "UPDATE qr_sessions SET status = 'COMPLETED' WHERE id = ?",
                    [sessionId]
                );

                return {
                    valid: false,
                    reason: 'SESSION_EXPIRED',
                    message: 'Session đã hết hạn',
                    shouldClear: true
                };
            }
        }

        // Session is valid
        return {
            valid: true,
            session: {
                id: session.id,
                table_id: session.table_id,
                table_number: session.table_number,
                status: session.status,
                created_at: session.created_at,
                expired_at: session.expired_at
            }
        };

    } catch (error) {
        console.error('validateSession error:', error);
        return {
            valid: false,
            reason: 'VALIDATION_ERROR',
            message: 'Lỗi khi validate session'
        };
    }
}

// Quét QR và mở session mới với validation
export async function startSession({ table_id, customer_id, session_token }) {
    // Validate table exists
    const [table] = await query("SELECT * FROM tables WHERE id = ? AND is_active = true AND deleted_at IS NULL", [table_id]);
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

    // Calculate expiration time (24 hours from now)
    const SESSION_DURATION_HOURS = process.env.QR_SESSION_DURATION_HOURS || 24;

    const result = await query(
        `INSERT INTO qr_sessions (table_id, customer_id, status, expired_at) 
         VALUES (?, ?, 'ACTIVE', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
        [table_id, customer_id ?? null, SESSION_DURATION_HOURS]
    );
    return {
        id: result.insertId,
        table_id,
        table_number: table.table_number,
        status: "ACTIVE",
        expired_at: new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
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

    // ✅ Get session info to send notification
    const [sessionData] = await query(
        "SELECT qs.*, t.table_number FROM qr_sessions qs JOIN tables t ON qs.table_id = t.id WHERE qs.id = ?",
        [sessionId]
    );

    // ✅ Emit notification to customer that session has ended
    if (sessionData) {
        const { emitNotification } = await import('../sockets/notification.socket.js');

        emitNotification({
            target_type: 'CUSTOMER',
            type: 'session_ended',
            title: `Phiên đã kết thúc - Bàn ${sessionData.table_number}`,
            message: `Phiên của bạn đã được kết thúc bởi nhà hàng.`,
            priority: 'high',
            metadata: JSON.stringify({
                sessionId: sessionData.id,
                tableId: sessionData.table_id,
                tableNumber: sessionData.table_number
            })
        });

        console.log(`✅ Emitted session_ended notification for session ${sessionId}`);
    }

    return { id: sessionId, status: "COMPLETED" };
}

/**
 * Update customer_id cho qr_session
 * Gọi sau khi customer đăng ký/đăng nhập
 */
export async function updateSessionCustomer(sessionId, customerId) {
    // Validate session exists and is active
    const [session] = await query(
        "SELECT * FROM qr_sessions WHERE id = ? AND status = 'ACTIVE'",
        [sessionId]
    );

    if (!session) {
        throw new Error("Session not found or already closed");
    }

    // Update customer_id
    await query(
        "UPDATE qr_sessions SET customer_id = ?, updated_at = NOW() WHERE id = ?",
        [customerId, sessionId]
    );

    // Return updated session
    const [updated] = await query(
        "SELECT * FROM qr_sessions WHERE id = ?",
        [sessionId]
    );

    return updated;
}

/**
 * Get session by ID (with customer info if available)
 * Dùng cho admin khi cần lấy thông tin session để thanh toán
 */
export async function getSessionById(sessionId) {
    const [session] = await query(
        `SELECT 
            qs.*,
            t.table_number,
            t.is_active as table_is_active
        FROM qr_sessions qs
        LEFT JOIN tables t ON qs.table_id = t.id
        WHERE qs.id = ?`,
        [sessionId]
    );

    return session;
}

