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

export default {
    notifyUser,
    notifyAllUsers
};
