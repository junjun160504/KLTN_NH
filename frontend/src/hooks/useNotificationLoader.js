import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import notificationService from '../services/notificationService';

// Global flags - separate concerns
let globalSocketInitialized = false;  // Socket only init once
let globalApiLoaded = false;          // API only load once

/**
 * Hook để load notifications từ API và listen Socket.IO real-time updates
 * Sử dụng trong các component cần hiển thị notifications (ví dụ: Admin layout)
 * 
 * IMPORTANT: 
 * - Socket initialization: Only once globally
 * - Listener registration: Every time component mounts (to handle remounting)
 * - API loading: Only once globally
 */
const useNotificationLoader = (userId = null, userType = 'STAFF') => {
    const {
        addNotification,
        setNotifications,
        notifications,
        markAsRead: markAsReadContext,
        deleteNotification: deleteNotificationContext
    } = useNotifications();
    const socketListenerRef = useRef(null);

    useEffect(() => {
        console.log('🔄 useNotificationLoader effect running...');
        console.log('📊 Status - Socket initialized:', globalSocketInitialized, 'API loaded:', globalApiLoaded);

        // 1. Load notifications from API (only once globally)
        const loadNotifications = async () => {
            if (globalApiLoaded) {
                console.log('⏭️ API already loaded, skipping...');
                return;
            }

            try {
                console.log('📥 Loading notifications from API...');
                const response = await notificationService.fetchNotifications({
                    limit: 50,
                    offset: 0
                });

                console.log('📦 API response structure:', response);

                // Backend returns: { status: 200, data: { notifications: [...], pagination: {...} } }
                if (response.data && response.data.notifications) {
                    // Transform API data to match context format
                    const transformedNotifications = response.data.notifications.map(notification => ({
                        id: notification.id,
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        timestamp: notification.created_at,
                        isRead: notification.is_read === 1 || notification.is_read === true,
                        priority: notification.priority,
                        actionUrl: notification.action_url,
                        metadata: notification.metadata
                    }));

                    // Set all notifications at once (more efficient than adding one by one)
                    setNotifications(transformedNotifications);

                    console.log(`✅ Loaded ${response.data.notifications.length} notifications from API`);
                    console.log(`📊 Pagination:`, response.data.pagination);

                    globalApiLoaded = true;
                } else {
                    console.warn('⚠️ No notifications data in response:', response);
                }
            } catch (error) {
                console.error('❌ Error loading notifications:', error);
            }
        };

        // 2. Register listener (ALWAYS - every mount)
        console.log('🎧 Registering socket listener...');
        const listenerCallback = (notification) => {
            console.log('🎯 LISTENER CALLBACK TRIGGERED!');
            console.log('📩 Received real-time notification:', notification);
            console.log('📊 Notification structure:', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                created_at: notification.created_at,
                priority: notification.priority
            });

            // Handle different event types
            if (notification.type === 'READ') {
                // Update read status
                markAsReadContext(notification.data.notificationId);
            } else if (notification.type === 'DELETE') {
                // Remove notification
                deleteNotificationContext(notification.data.notificationId);
            } else {
                console.log('🔔 Adding notification to context with showToast: true');

                // New notification - add with toast
                // IMPORTANT: Use backend's ID directly, don't override it
                const notificationToAdd = {
                    id: notification.id, // Use backend's ID
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    timestamp: notification.created_at || new Date().toISOString(),
                    isRead: false,
                    priority: notification.priority || 'medium',
                    actionUrl: notification.action_url,
                    metadata: notification.metadata,
                    showToast: true // Show toast for real-time notifications
                };

                console.log('📤 Calling addNotification with:', notificationToAdd);
                addNotification(notificationToAdd);
                console.log('✅ addNotification called successfully');
            }
        };

        socketListenerRef.current = notificationService.addListener(listenerCallback);
        console.log('✅ Socket listener registered');

        // 3. Initialize Socket.IO connection (only once globally)
        const initializeSocket = () => {
            if (globalSocketInitialized) {
                console.log('⏭️ Socket already initialized, skipping...');
                return;
            }

            try {
                console.log('� Initializing Socket.IO connection for first time...');

                // Use userId from props or default to 1 (for demo)
                const finalUserId = userId || 1;

                console.log('📡 Creating socket with userId:', finalUserId, 'userType:', userType);
                notificationService.initializeSocket(finalUserId, userType);

                globalSocketInitialized = true;
                console.log('✅ Socket.IO initialized');
            } catch (error) {
                console.error('❌ Error initializing Socket.IO:', error);
            }
        };

        // Execute initialization
        loadNotifications();
        initializeSocket();

        // Cleanup function - IMPORTANT: Only remove listener, NOT disconnect socket
        return () => {
            console.log('🧹 useNotificationLoader cleanup...');

            // Remove THIS component's listener
            if (socketListenerRef.current) {
                socketListenerRef.current();
                console.log('✅ Socket.IO listener removed for this component');
            }

            // DON'T disconnect socket - keep it alive for other components/remounts
            // notificationService.disconnectSocket();
        };
    }, [userId, userType, addNotification, setNotifications, markAsReadContext, deleteNotificationContext]); // Dependencies

    // Sync API calls with context actions
    const markAsRead = async (notificationId) => {
        const success = await notificationService.markAsRead(notificationId);
        if (success) {
            markAsReadContext(notificationId);
        }
    };

    const markAllAsRead = async () => {
        const success = await notificationService.markAllAsRead();
        if (success) {
            // Context will handle this via API response or you can manually update all
            notifications.forEach(n => {
                if (!n.isRead) {
                    markAsReadContext(n.id);
                }
            });
        }
    };

    const deleteNotification = async (notificationId) => {
        const success = await notificationService.deleteNotification(notificationId);
        if (success) {
            deleteNotificationContext(notificationId);
        }
    };

    return {
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
};

export default useNotificationLoader;

