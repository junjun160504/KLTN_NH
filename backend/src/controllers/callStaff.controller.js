import * as callStaffService from '../services/callStaff.service.js';

/**
 * POST /api/call-staff
 * Tạo thông báo gọi nhân viên (chỉ tạo notification, không lưu vào table riêng)
 */
export async function createCallStaffNotification(req, res) {
    try {
        const { qr_session_id, message } = req.body;

        // Validate required fields
        if (!qr_session_id) {
            return res.status(400).json({
                status: 400,
                error: 'Thiếu thông tin: qr_session_id'
            });
        }

        // Gọi service để tạo notification
        // Service sẽ tự động emit qua Socket.IO tới tất cả STAFF
        const result = await callStaffService.createCallStaffNotification(
            qr_session_id,
            message
        );

        res.status(201).json({
            status: 201,
            message: result.message,
            data: {
                notification: result.notification,
                tableInfo: result.tableInfo
            }
        });
    } catch (error) {
        console.error('createCallStaffNotification error:', error);
        res.status(500).json({
            status: 500,
            error: error.message || 'Lỗi khi gọi nhân viên'
        });
    }
}
