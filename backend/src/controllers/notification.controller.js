import * as notificationService from "../services/notification.service.js";

/**
 * GET /api/notifications
 * Get all notifications with filters
 */
export async function getAllNotifications(req, res) {
    try {
        const {
            target_type,
            target_id,
            type,
            is_read,
            priority,
            limit,
            offset
        } = req.query;

        const filters = {
            target_type,
            target_id: target_id ? parseInt(target_id) : undefined,
            type,
            is_read: is_read !== undefined ? is_read === 'true' : undefined,
            priority,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        };

        // Remove undefined values
        Object.keys(filters).forEach(key =>
            filters[key] === undefined && delete filters[key]
        );

        const result = await notificationService.getNotifications(filters);

        res.json({
            status: 200,
            data: result
        });
    } catch (err) {
        console.error("getAllNotifications error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
export async function getNotificationById(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid notification ID"
            });
        }

        const notification = await notificationService.getNotificationById(parseInt(id));

        res.json({
            status: 200,
            data: notification
        });
    } catch (err) {
        console.error("getNotificationById error:", err);

        if (err.message === 'Notification not found') {
            return res.status(404).json({
                status: 404,
                message: err.message
            });
        }

        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function createNotification(req, res) {
    try {
        const {
            target_type,
            target_id,
            type,
            title,
            message,
            priority,
            action_url,
            metadata
        } = req.body;

        // Validate required fields
        if (!target_type || !type || !title) {
            return res.status(400).json({
                status: 400,
                message: "Missing required fields: target_type, type, title"
            });
        }

        const notification = await notificationService.createNotification({
            target_type,
            target_id,
            type,
            title,
            message,
            priority,
            action_url,
            metadata
        });

        res.status(201).json({
            status: 201,
            message: "Notification created successfully",
            data: notification
        });
    } catch (err) {
        console.error("createNotification error:", err);

        if (err.message.includes('Invalid')) {
            return res.status(400).json({
                status: 400,
                message: err.message
            });
        }

        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
export async function markNotificationAsRead(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid notification ID"
            });
        }

        await notificationService.markAsRead(parseInt(id));

        res.json({
            status: 200,
            message: "Notification marked as read"
        });
    } catch (err) {
        console.error("markNotificationAsRead error:", err);

        if (err.message === 'Notification not found') {
            return res.status(404).json({
                status: 404,
                message: err.message
            });
        }

        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(req, res) {
    try {
        const target_type = req.body?.target_type;
        const target_id = req.body?.target_id;

        const updatedCount = await notificationService.markAllAsRead(
            target_type,
            target_id ? parseInt(target_id) : null
        );

        res.json({
            status: 200,
            message: "All notifications marked as read",
            data: {
                updated_count: updatedCount
            }
        });
    } catch (err) {
        console.error("markAllNotificationsAsRead error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid notification ID"
            });
        }

        await notificationService.deleteNotification(parseInt(id));

        res.json({
            status: 200,
            message: "Notification deleted successfully"
        });
    } catch (err) {
        console.error("deleteNotification error:", err);

        if (err.message === 'Notification not found') {
            return res.status(404).json({
                status: 404,
                message: err.message
            });
        }

        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications
 */
export async function clearAllNotifications(req, res) {
    try {
        const { target_type, target_id } = req.body;

        if (!target_type) {
            return res.status(400).json({
                status: 400,
                message: "Missing required field: target_type"
            });
        }

        const deletedCount = await notificationService.clearAll(
            target_type,
            target_id ? parseInt(target_id) : null
        );

        res.json({
            status: 200,
            message: "All notifications cleared",
            data: {
                deleted_count: deletedCount
            }
        });
    } catch (err) {
        console.error("clearAllNotifications error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export async function getUnreadCount(req, res) {
    try {
        const { target_type, target_id } = req.query;

        if (!target_type) {
            return res.status(400).json({
                status: 400,
                message: "Missing required query parameter: target_type"
            });
        }

        const result = await notificationService.getUnreadCount(
            target_type,
            target_id ? parseInt(target_id) : null
        );

        res.json({
            status: 200,
            data: result
        });
    } catch (err) {
        console.error("getUnreadCount error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}
