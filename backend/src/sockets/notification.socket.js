/**
 * Notification Socket.IO Handler
 * Manages real-time notification emissions to clients
 */

let io = null;

/**
 * Initialize Socket.IO instance
 * Must be called from server.js after io is created
 * @param {Server} socketIoInstance - Socket.IO server instance
 */
export function initializeSocket(socketIoInstance) {
    io = socketIoInstance;
    console.log('✅ Notification socket handler initialized');
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO instance
 */
export function getIO() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initializeSocket() first.');
    }
    return io;
}

/**
 * Emit notification to a specific user
 * @param {string} targetType - CUSTOMER, STAFF, or ALL
 * @param {number} targetId - User ID
 * @param {Object} notification - Notification object
 */
export function emitToUser(targetType, targetId, notification) {
    try {
        const io = getIO();
        const room = `${targetType}_${targetId}`;

        io.to(room).emit('notification', notification);

        console.log(`📤 Notification sent to room: ${room}`, {
            id: notification.id,
            type: notification.type,
            title: notification.title
        });
    } catch (error) {
        console.error('❌ Error emitting notification to user:', error.message);
    }
}

/**
 * Emit notification to all users of a specific type
 * @param {string} targetType - CUSTOMER or STAFF
 * @param {Object} notification - Notification object
 */
export function emitToType(targetType, notification) {
    try {
        const io = getIO();

        io.to(targetType).emit('notification', notification);

        console.log(`📤 Notification sent to all ${targetType}`, {
            id: notification.id,
            type: notification.type,
            title: notification.title
        });
    } catch (error) {
        console.error(`❌ Error emitting notification to ${targetType}:`, error.message);
    }
}

/**
 * Emit notification to all STAFF members
 * @param {Object} notification - Notification object
 */
export function emitToAllStaff(notification) {
    emitToType('STAFF', notification);
}

/**
 * Emit notification to all CUSTOMERS
 * @param {Object} notification - Notification object
 */
export function emitToAllCustomers(notification) {
    emitToType('CUSTOMER', notification);
}

/**
 * Emit notification to all connected clients
 * @param {Object} notification - Notification object
 */
export function emitToAll(notification) {
    try {
        const io = getIO();

        io.emit('notification', notification);

        console.log(`📤 Notification broadcast to ALL clients`, {
            id: notification.id,
            type: notification.type,
            title: notification.title
        });
    } catch (error) {
        console.error('❌ Error broadcasting notification:', error.message);
    }
}

/**
 * Smart emit - automatically determines target based on notification data
 * @param {Object} notification - Notification object with target_type and target_id
 */
export function emitNotification(notification) {
    const { target_type, target_id } = notification;

    try {
        if (target_type === 'ALL') {
            // Broadcast to everyone
            emitToAll(notification);
        } else if (target_id === null || target_id === undefined) {
            // Broadcast to all users of this type
            emitToType(target_type, notification);
        } else {
            // Send to specific user
            emitToUser(target_type, target_id, notification);
        }
    } catch (error) {
        console.error('❌ Error in smart emit:', error.message);
    }
}

/**
 * Emit notification read status update
 * @param {number} notificationId - Notification ID
 * @param {string} targetType - Target type
 * @param {number} targetId - User ID
 */
export function emitReadStatus(notificationId, targetType, targetId) {
    try {
        const io = getIO();
        const room = targetId ? `${targetType}_${targetId}` : targetType;

        io.to(room).emit('notification:read', {
            notificationId,
            isRead: true,
            timestamp: new Date().toISOString()
        });

        console.log(`📤 Read status emitted to ${room} for notification #${notificationId}`);
    } catch (error) {
        console.error('❌ Error emitting read status:', error.message);
    }
}

/**
 * Emit notification delete event
 * @param {number} notificationId - Notification ID
 * @param {string} targetType - Target type
 * @param {number} targetId - User ID
 */
export function emitDelete(notificationId, targetType, targetId) {
    try {
        const io = getIO();
        const room = targetId ? `${targetType}_${targetId}` : targetType;

        io.to(room).emit('notification:delete', {
            notificationId,
            timestamp: new Date().toISOString()
        });

        console.log(`📤 Delete event emitted to ${room} for notification #${notificationId}`);
    } catch (error) {
        console.error('❌ Error emitting delete event:', error.message);
    }
}

/**
 * Get number of connected clients in a room
 * @param {string} room - Room name
 * @returns {Promise<number>} Number of clients
 */
export async function getRoomSize(room) {
    try {
        const io = getIO();
        const sockets = await io.in(room).fetchSockets();
        return sockets.length;
    } catch (error) {
        console.error('❌ Error getting room size:', error.message);
        return 0;
    }
}

/**
 * Get list of all active rooms
 * @returns {Array<string>} Array of room names
 */
export function getActiveRooms() {
    try {
        const io = getIO();
        return Array.from(io.sockets.adapter.rooms.keys());
    } catch (error) {
        console.error('❌ Error getting active rooms:', error.message);
        return [];
    }
}
