import { query } from '../config/db.js';

export async function handleCallStaff({ tableNumber, note }) {
    try {
        const sql = `
      INSERT INTO call_staff_logs (table_number, request_time, note, status)
      VALUES (?, NOW(), ?, 'PENDING')
    `;
        const params = [tableNumber, note || null];

        const result = await query(sql, params);

        return {
            success: true,
            message: 'Gọi nhân viên thành công!',
            data: {
                id: result.insertId,
                tableNumber,
                status: 'PENDING'
            }
        };
    } catch (error) {
        console.error('[handleCallStaff] Lỗi khi lưu gọi nhân viên:', error);
        return {
            success: false,
            message: 'Không thể gọi nhân viên. Vui lòng thử lại!'
        };
    }
}

