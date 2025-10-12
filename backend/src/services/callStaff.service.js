import { query } from '../config/db.js';
import * as notificationService from './notification.service.js';

/**
 * Tạo thông báo gọi nhân viên (chỉ tạo notification, không lưu vào table riêng)
 * @param {Number} qrSessionId - ID của QR session
 * @param {String} message - Message tùy chỉnh (optional)
 * @returns {Object} Notification đã tạo và thông tin bàn
 */
export async function createCallStaffNotification(qrSessionId, message = null) {
    try {
        // 1. Lấy thông tin bàn từ qr_session
        const sessions = await query(
            `SELECT qs.id, qs.table_id, t.table_number
             FROM qr_sessions qs
             JOIN tables t ON qs.table_id = t.id
             WHERE qs.id = ? AND qs.status = 'ACTIVE'`,
            [qrSessionId]
        );

        if (!sessions || sessions.length === 0) {
            throw new Error("QR session không tồn tại hoặc đã kết thúc");
        }

        const session = sessions[0];
        const tableName = `Bàn ${session.table_number}`;

        // 2. Tạo notification cho tất cả STAFF
        // notificationService.createNotification() sẽ tự động emit qua Socket.IO
        const notification = await notificationService.createNotification({
            target_type: "STAFF",
            target_id: null, // null = broadcast tới tất cả staff
            type: "CALL_STAFF",
            title: `${tableName} đang gọi nhân viên`,
            message: message || `Khách hàng ở ${tableName} cần hỗ trợ`,
            priority: "high",
            action_url: `/management/tables/${session.table_id}`,
            metadata: {
                tableId: session.table_id,
                tableName: session.table_number,
                qrSessionId: qrSessionId,
            },
        });

        console.log(`✅ Call staff notification created for ${tableName}`);
        console.log(`📤 Notification sent to all STAFF members via Socket.IO`);

        return {
            notification,
            tableInfo: {
                tableId: session.table_id,
                tableName: session.table_number,
            },
            message: `Đã gọi nhân viên thành công - ${tableName}`,
        };
    } catch (error) {
        console.error('❌ Error creating call staff notification:', error);
        throw error;
    }
}

