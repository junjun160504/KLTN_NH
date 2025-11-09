/**
 * Simple Notification Service
 * Hệ thống thông báo đơn giản sử dụng qr_session_id
 * 
 * Usage:
 * await notifyUser(qrSessionId, { type: 'success', message: 'Đơn hàng đã được xác nhận' });
 */

import { io } from '../server.js';

/**
 * Gửi notification đến customer qua qr_session_id
 * @param {number} qrSessionId - QR Session ID
 * @param {Object} notification - Notification data
 * @param {string} notification.type - Type: 'success', 'error', 'warning', 'info'
 * @param {string} notification.message - Message content
 * @returns {Object} Result
 */
export async function notifyUser(qrSessionId, notification) {
    console.log('🔔 notifyUser called with:', { qrSessionId, notification });
    if (!io) {
        console.error('❌ Socket.IO not initialized');
        return { success: false, error: 'Socket.IO not initialized' };
    }

    if (!qrSessionId) {
        console.error('❌ qrSessionId is required');
        return { success: false, error: 'qrSessionId is required' };
    }

    const { type = 'info', message } = notification;

    if (!message) {
        console.error('❌ message is required');
        return { success: false, error: 'message is required' };
    }

    // Validate type
    const validTypes = ['success', 'error', 'warning', 'info'];
    if (!validTypes.includes(type)) {
        console.warn(`⚠️ Invalid type: ${type}, defaulting to 'info'`);
        notification.type = 'info';
    }

    const room = `QR_SESSION_${qrSessionId}`;

    // Emit notification to room
    io.to(room).emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
    });


    return {
        success: true,
        qrSessionId,
        room,
        type,
        message
    };
}

/**
 * Broadcast notification đến TẤT CẢ customers
 * @param {Object} notification - Notification data
 * @param {string} notification.type - Type: 'success', 'error', 'warning', 'info'
 * @param {string} notification.message - Message content
 */
export async function notifyAllUsers(notification) {
    if (!io) {
        console.error('❌ Socket.IO not initialized');
        return { success: false, error: 'Socket.IO not initialized' };
    }

    const { type = 'info', message } = notification;

    if (!message) {
        console.error('❌ message is required');
        return { success: false, error: 'message is required' };
    }

    io.to('CUSTOMER').emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
    });


    return {
        success: true,
        type,
        message
    };
}

/**
 * Gửi thông báo thanh toán hoàn tất đến customer
 * @param {number} qrSessionId - QR Session ID
 * @param {Object} paymentData - Payment details
 * @param {Array} paymentData.ordersConfirmed - Danh sách orders đã thanh toán
 * @param {Array} paymentData.ordersCancelled - Danh sách orders đã hủy
 * @param {number} paymentData.totalAmount - Tổng số tiền đã thanh toán
 * @returns {Object} Result
 */
export async function notifyPaymentCompleted(qrSessionId, paymentData) {
    console.log('🔔 notifyPaymentCompleted called with:', { qrSessionId, paymentData });

    if (!io) {
        console.error('❌ Socket.IO not initialized');
        return { success: false, error: 'Socket.IO not initialized' };
    }

    if (!qrSessionId) {
        console.error('❌ qrSessionId is required');
        return { success: false, error: 'qrSessionId is required' };
    }

    const { ordersConfirmed = [], ordersCancelled = [], totalAmount = 0 } = paymentData;

    // Tạo message chi tiết
    const confirmedCount = ordersConfirmed.length;
    const cancelledCount = ordersCancelled.length;

    let message = `Thanh toán thành công`;

    message += '. Cảm ơn quý khách!';

    const room = `QR_SESSION_${qrSessionId}`;

    // Emit notification với type 'session_paid' chứa đầy đủ payment data
    io.to(room).emit('notification', {
        type: 'session_paid',
        message,
        timestamp: new Date().toISOString(),
        data: {
            sessionId: qrSessionId,
            paidAt: new Date().toISOString(),
            ordersConfirmed: ordersConfirmed.map(o => ({
                id: o.id,
                status: o.status,
                totalPrice: o.total_price
            })),
            ordersCancelled: ordersCancelled.map(o => ({
                id: o.id,
                status: o.status
            })),
            totalAmount,
            message
        }
    });

    console.log('✅ Payment notification sent:', {
        room,
        confirmedCount,
        cancelledCount,
        totalAmount
    });

    return {
        success: true,
        qrSessionId,
        room,
        confirmedCount,
        cancelledCount,
        totalAmount,
        message
    };
}

export default {
    notifyUser,
    notifyAllUsers,
    notifyPaymentCompleted
};
