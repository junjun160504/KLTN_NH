import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications with filters
 * @query   target_type, target_id, type, is_read, priority, limit, offset
 * @access  Protected
 */
router.get('/', notificationController.getAllNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @query   target_type, target_id
 * @access  Protected
 * @note    This route MUST be before /:id to avoid conflict
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Protected
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @body    target_type, target_id, type, title, message, priority, action_url, metadata
 * @access  Protected
 */
router.post('/', notificationController.createNotification);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Protected
 */
router.patch('/:id/read', notificationController.markNotificationAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @body    target_type, target_id
 * @access  Protected
 */
router.patch('/read-all', notificationController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Protected
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications
 * @body    target_type, target_id
 * @access  Protected
 */
router.delete('/clear-all', notificationController.clearAllNotifications);

export default router;
