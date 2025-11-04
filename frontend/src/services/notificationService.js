import axios from 'axios';
import { io } from 'socket.io-client';

/**
 * Notification Service
 * Handles API calls and Socket.IO integration
 */

// API Base URL (update this with your actual backend URL)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

class NotificationService {
    constructor() {
        this.socket = null;
        this.listeners = new Set();
    }

    /**
     * Initialize Socket.IO connection
     * @param {number} userId - User ID (hoặc qrSessionId nếu là CUSTOMER)
     * @param {string} userType - User type (STAFF, CUSTOMER)
     */
    initializeSocket(userId, userType = 'STAFF') {
        if (this.socket) {
            console.log('⚠️ Socket already initialized, reusing existing connection');
            console.log('📊 Current listeners count:', this.listeners.size);

            // Socket đã tồn tại, chỉ cần join rooms lại
            console.log('🔄 Re-joining rooms for userId:', userId, 'userType:', userType);

            // CUSTOMER join với qrSessionId
            if (userType === 'CUSTOMER') {
                this.socket.emit('join', { qrSessionId: userId, userType: 'CUSTOMER' });
            } else {
                this.socket.emit('join', { userId, userType });
            }
            return;
        }

        try {
            console.log('🆕 Creating NEW Socket.IO connection...');
            // Create Socket.IO connection
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            // Connection events
            this.socket.on('connect', () => {
                console.log('✅ Socket.IO connected:', this.socket.id);
                console.log('📊 Listeners registered:', this.listeners.size);

                // Join user-specific and type-specific rooms
                // CUSTOMER join với qrSessionId
                if (userType === 'CUSTOMER') {
                    console.log('🔐 Customer joining with qrSessionId:', userId);
                    this.socket.emit('join', { qrSessionId: userId, userType: 'CUSTOMER' });
                } else {
                    this.socket.emit('join', { userId, userType });
                }
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Socket.IO disconnected');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
            });

            // Listen for new notifications
            this.socket.on('notification', (notification) => {
                console.log('📩 Real-time notification received:', notification);
                this.notifyListeners(notification);
            });

            // Listen for read status updates
            this.socket.on('notification:read', (data) => {
                console.log('📖 Notification marked as read:', data);
                // Notify listeners about read status change
                this.notifyListeners({ type: 'READ', data });
            });

            // Listen for delete events
            this.socket.on('notification:delete', (data) => {
                console.log('🗑️ Notification deleted:', data);
                // Notify listeners about delete event
                this.notifyListeners({ type: 'DELETE', data });
            });

            console.log('✅ Socket.IO initialized for user:', userId, userType);
        } catch (error) {
            console.error('Error initializing Socket.IO:', error);
        }
    }

    /**
     * Disconnect Socket.IO
     */
    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('Socket.IO disconnected');
        }
    }

    /**
     * Add listener for new notifications
     */
    addListener(callback) {
        console.log('➕ Adding listener, current count:', this.listeners.size);
        this.listeners.add(callback);
        console.log('✅ Listener added, new count:', this.listeners.size);
        console.log('📋 All listeners:', Array.from(this.listeners));

        return () => {
            console.log('➖ Removing listener, current count:', this.listeners.size);
            this.listeners.delete(callback);
            console.log('✅ Listener removed, new count:', this.listeners.size);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(notification) {
        console.log('🔔 notifyListeners called with:', notification);
        console.log('📊 Number of listeners:', this.listeners.size);
        console.log('📋 Listeners:', Array.from(this.listeners));

        if (this.listeners.size === 0) {
            console.warn('⚠️ NO LISTENERS REGISTERED! Notification will be lost.');
        }

        this.listeners.forEach((listener, index) => {
            console.log(`🔄 Calling listener #${index + 1}`);
            try {
                listener(notification);
                console.log(`✅ Listener #${index + 1} executed successfully`);
            } catch (error) {
                console.error(`❌ Listener #${index + 1} error:`, error);
            }
        });
    }

    /**
     * Fetch notifications from API
     */
    async fetchNotifications(filters = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications`, {
                params: filters
            });
            console.log('✅ API Response:', response.data);

            // Backend returns: { status: 200, data: [...] }
            // We need to return the structure that hook expects
            return response.data; // This is { status: 200, data: [...] }

        } catch (error) {
            console.error('❌ Error fetching notifications:', error);

            // Return empty data structure on error
            return {
                status: 500,
                data: []
            };
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`);
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            await axios.patch(`${API_BASE_URL}/notifications/read-all`);
            return true;
        } catch (error) {
            console.error('Error marking all as read:', error);
            return false;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
