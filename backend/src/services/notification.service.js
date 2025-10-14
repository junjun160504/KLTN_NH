import { pool, query } from "../config/db.js";
import { emitNotification } from "../sockets/notification.socket.js";

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @returns {Object} Created notification
 */
export async function createNotification(data) {
    const {
        target_type,
        target_id = null,
        type,
        title,
        message,
        priority = 'medium',
        action_url = null,
        metadata = null
    } = data;

    // Validate required fields
    if (!target_type || !type || !title) {
        throw new Error("Missing required fields: target_type, type, title");
    }

    // Validate enums
    const validTargetTypes = ['CUSTOMER', 'STAFF', 'ALL'];
    const validTypes = [
        'ORDER_NEW', 'ORDER_UPDATE', 'CALL_STAFF', 'PAYMENT', 'REVIEW',
        'INVENTORY', 'SYSTEM', 'SUCCESS', 'ERROR', 'WARNING', 'INFO'
    ];
    const validPriorities = ['high', 'medium', 'low'];

    if (!validTargetTypes.includes(target_type)) {
        throw new Error(`Invalid target_type. Must be one of: ${validTargetTypes.join(', ')}`);
    }

    if (!validTypes.includes(type)) {
        throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!validPriorities.includes(priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    try {
        const result = await query(
            `INSERT INTO notifications 
       (target_type, target_id, type, title, message, priority, action_url, metadata, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, false)`,
            [
                target_type,
                target_id,
                type,
                title,
                message,
                priority,
                action_url,
                metadata ? JSON.stringify(metadata) : null
            ]
        );

        // Return created notification
        const notification = {
            id: result.insertId,
            target_type,
            target_id,
            type,
            title,
            message,
            priority,
            action_url,
            metadata,
            is_read: false,
            created_at: new Date().toISOString()
        };

        console.log(`✅ Notification created: #${notification.id} - ${title}`);

        // Emit real-time notification via Socket.IO
        emitNotification(notification);

        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
}

/**
 * Get notifications with filters
 * @param {Object} filters - Query filters
 * @returns {Object} Notifications and pagination info
 */
export async function getNotifications(filters = {}) {
    const {
        target_type,
        target_id,
        type,
        is_read,
        priority,
        limit = 50,
        offset = 0
    } = filters;

    console.log("getNotifications filters:", filters);

    let whereClauses = [];
    let params = [];

    // Build WHERE clause dynamically
    if (target_type) {
        whereClauses.push('target_type = ?');
        params.push(target_type);
    }

    if (target_id !== undefined && target_id !== null) {
        // Get notifications for specific user OR broadcast (target_id IS NULL)
        whereClauses.push('(target_id = ? OR target_id IS NULL)');
        params.push(target_id);
    }

    if (type) {
        whereClauses.push('type = ?');
        params.push(type);
    }

    if (is_read !== undefined && is_read !== null) {
        whereClauses.push('is_read = ?');
        params.push(is_read);
    }

    if (priority) {
        whereClauses.push('priority = ?');
        params.push(priority);
    }

    const whereSQL = whereClauses.length > 0
        ? 'WHERE ' + whereClauses.join(' AND ')
        : '';

    console.log("whereSQL:", whereSQL, "params:", params);

    try {
        // Get total count
        const totalResult = await query(
            `SELECT COUNT(*) as total FROM notifications ${whereSQL}`,
            params
        );
        const total = totalResult[0].total;


        // Get unread count (need to add is_read = false parameter)
        const unreadParams = [...params]; // Clone params array
        const unreadResult = await query(
            `SELECT COUNT(*) as unreadCount FROM notifications 
       ${whereSQL} ${whereClauses.length > 0 ? 'AND' : 'WHERE'} is_read = ?`,
            [...unreadParams, false]
        );
        const unreadCount = unreadResult[0].unreadCount;

        // Get notifications with pagination
        // Note: LIMIT and OFFSET should be in SQL string, not as parameters
        const limitValue = parseInt(limit);
        const offsetValue = parseInt(offset);

        const notifications = await query(
            `SELECT 
                id, target_type, target_id, type, title, message, 
                priority, action_url, metadata, is_read, created_at
                FROM notifications 
                ${whereSQL}
                ORDER BY created_at DESC
                LIMIT ${limitValue} OFFSET ${offsetValue}`,
            params
        );


        // Parse metadata JSON (only if it's a string, not already an object)
        const parsedNotifications = notifications.map(n => ({
            ...n,
            metadata: n.metadata ?
                (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata)
                : null
        }));

        return {
            notifications: parsedNotifications,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadCount
            }
        };
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        throw error;
    }
}

/**
 * Get notification by ID
 * @param {number} notificationId 
 * @returns {Object} Notification object
 */
export async function getNotificationById(notificationId) {
    try {
        const notifications = await query(
            `SELECT 
        id, target_type, target_id, type, title, message, 
        priority, action_url, metadata, is_read, created_at
       FROM notifications 
       WHERE id = ?`,
            [notificationId]
        );

        if (notifications.length === 0) {
            throw new Error('Notification not found');
        }

        const notification = notifications[0];
        // Parse metadata only if it's a string
        notification.metadata = notification.metadata ?
            (typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : notification.metadata)
            : null;

        return notification;
    } catch (error) {
        console.error('❌ Error getting notification by ID:', error);
        throw error;
    }
}

/**
 * Mark notification as read
 * @param {number} notificationId 
 * @returns {boolean} Success
 */
export async function markAsRead(notificationId) {
    try {
        const result = await query(
            'UPDATE notifications SET is_read = true WHERE id = ?',
            [notificationId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Notification not found');
        }

        console.log(`✅ Notification #${notificationId} marked as read`);
        return true;
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 * @param {string} target_type - CUSTOMER, STAFF, or ALL
 * @param {number} target_id - User ID (optional for broadcast)
 * @returns {number} Number of updated notifications
 */
export async function markAllAsRead(target_type, target_id = null) {
    try {
        let sql = '';
        let params = [];
        if (!target_type) {
            sql = `
                UPDATE notifications 
                SET is_read = true 
                WHERE is_read = false
            `;
            params = [];
        } else {
            sql = `
                UPDATE notifications 
                SET is_read = true 
                WHERE target_type = ? 
                AND is_read = false`;
            params = [target_type];
            if (target_id !== null) {
                sql += ' AND (target_id = ? OR target_id IS NULL)';
                params.push(target_id);
            }
        }
        const result = await query(sql, params);

        console.log(`✅ Marked ${result.affectedRows} notifications as read for ${target_type}${target_id ? ` #${target_id}` : ''}`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        throw error;
    }
}

/**
 * Delete a notification
 * @param {number} notificationId 
 * @returns {boolean} Success
 */
export async function deleteNotification(notificationId) {
    try {
        const result = await query(
            'DELETE FROM notifications WHERE id = ?',
            [notificationId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Notification not found');
        }

        console.log(`✅ Notification #${notificationId} deleted`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        throw error;
    }
}

/**
 * Clear all notifications for a user
 * @param {string} target_type - CUSTOMER, STAFF, or ALL
 * @param {number} target_id - User ID (optional for broadcast)
 * @returns {number} Number of deleted notifications
 */
export async function clearAll(target_type, target_id = null) {
    try {
        let sql = 'DELETE FROM notifications WHERE target_type = ?';
        let params = [target_type];

        if (target_id !== null) {
            sql += ' AND (target_id = ? OR target_id IS NULL)';
            params.push(target_id);
        }

        const result = await query(sql, params);

        console.log(`✅ Cleared ${result.affectedRows} notifications for ${target_type}${target_id ? ` #${target_id}` : ''}`);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Error clearing notifications:', error);
        throw error;
    }
}

/**
 * Get unread count by type
 * @param {string} target_type - CUSTOMER, STAFF, or ALL
 * @param {number} target_id - User ID (optional)
 * @returns {Object} Unread counts
 */
export async function getUnreadCount(target_type, target_id = null) {
    try {
        let whereClause = 'WHERE target_type = ? AND is_read = false';
        let params = [target_type];

        if (target_id !== null) {
            whereClause += ' AND (target_id = ? OR target_id IS NULL)';
            params.push(target_id);
        }

        // Total unread count
        const totalResult = await query(
            `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
            params
        );

        // Count by type
        const byTypeResult = await query(
            `SELECT type, COUNT(*) as count 
       FROM notifications 
       ${whereClause}
       GROUP BY type`,
            params
        );

        const byType = {};
        byTypeResult.forEach(row => {
            byType[row.type] = row.count;
        });

        return {
            unreadCount: totalResult[0].total,
            byType
        };
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        throw error;
    }
}
