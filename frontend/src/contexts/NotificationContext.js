import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Notification Types
export const NOTIFICATION_TYPES = {
    ORDER_NEW: 'ORDER_NEW',
    ORDER_UPDATE: 'ORDER_UPDATE',
    CALL_STAFF: 'CALL_STAFF',
    PAYMENT: 'PAYMENT',
    SYSTEM: 'SYSTEM',
    REVIEW: 'REVIEW',
    INVENTORY: 'INVENTORY',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
};

// Action Types
const ACTIONS = {
    SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    MARK_AS_READ: 'MARK_AS_READ',
    MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
    DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
    CLEAR_ALL: 'CLEAR_ALL',
    ADD_TOAST: 'ADD_TOAST',
    REMOVE_TOAST: 'REMOVE_TOAST',
    SET_FILTER: 'SET_FILTER'
};

// Initial State
const initialState = {
    notifications: [],
    toasts: [],
    filter: 'all', // 'all', 'unread', 'ORDER_UPDATE', 'CALL_STAFF', etc.
    unreadCount: 0
};

// Reducer
const notificationReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_NOTIFICATIONS:
            return {
                ...state,
                notifications: action.payload,
                unreadCount: action.payload.filter(n => !n.isRead).length
            };

        case ACTIONS.ADD_NOTIFICATION:
            console.log('🔄 Reducer ADD_NOTIFICATION:', action.payload);
            const newNotifications = [action.payload, ...state.notifications];
            console.log('📊 New notifications count:', newNotifications.length);
            console.log('📊 Unread count:', newNotifications.filter(n => !n.isRead).length);
            return {
                ...state,
                notifications: newNotifications,
                unreadCount: newNotifications.filter(n => !n.isRead).length
            };

        case ACTIONS.MARK_AS_READ:
            const updatedNotifications = state.notifications.map(n =>
                n.id === action.payload ? { ...n, isRead: true } : n
            );
            return {
                ...state,
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.isRead).length
            };

        case ACTIONS.MARK_ALL_AS_READ:
            const allReadNotifications = state.notifications.map(n => ({ ...n, isRead: true }));
            return {
                ...state,
                notifications: allReadNotifications,
                unreadCount: 0
            };

        case ACTIONS.DELETE_NOTIFICATION:
            const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
            return {
                ...state,
                notifications: filteredNotifications,
                unreadCount: filteredNotifications.filter(n => !n.isRead).length
            };

        case ACTIONS.CLEAR_ALL:
            return {
                ...state,
                notifications: [],
                unreadCount: 0
            };

        case ACTIONS.ADD_TOAST:
            console.log('🔄 Reducer ADD_TOAST:', action.payload);
            // Max 3 toasts at a time
            const newToasts = [action.payload, ...state.toasts].slice(0, 3);
            console.log('📊 Toasts array:', newToasts);
            console.log('📊 Toasts count:', newToasts.length);
            return {
                ...state,
                toasts: newToasts
            };

        case ACTIONS.REMOVE_TOAST:
            console.log('🔄 Reducer REMOVE_TOAST:', action.payload);
            return {
                ...state,
                toasts: state.toasts.filter(t => t.id !== action.payload)
            };

        case ACTIONS.SET_FILTER:
            return {
                ...state,
                filter: action.payload
            };

        default:
            return state;
    }
};

// Create Context
const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Show toast notification
    const showToast = useCallback((notification) => {
        console.log('🍞 showToast called with:', notification);

        const toast = {
            id: Date.now() + Math.random(),
            ...notification
        };

        console.log('📤 Dispatching ADD_TOAST:', toast);
        dispatch({ type: ACTIONS.ADD_TOAST, payload: toast });

        // Auto dismiss after duration (default 5s)
        const duration = notification.duration || 5000;
        console.log(`⏰ Toast will auto-dismiss in ${duration}ms`);

        setTimeout(() => {
            console.log('⏰ Auto-dismissing toast:', toast.id);
            dispatch({ type: ACTIONS.REMOVE_TOAST, payload: toast.id });
        }, duration);
    }, []);

    // Add notification
    const addNotification = useCallback((notification) => {
        console.log('🔔 addNotification called with:', notification);

        const newNotification = {
            // Default values first
            timestamp: new Date().toISOString(),
            isRead: false,
            // Then spread notification (this will override defaults if they exist in notification)
            ...notification,
            // Generate ID only if not provided
            id: notification.id || (Date.now() + Math.random())
        };

        console.log('📦 Dispatching notification:', newNotification);
        dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });

        // Also show as toast if showToast is true
        if (notification.showToast !== false) {
            console.log('🔔 Showing toast for notification:', newNotification.title);
            showToast(newNotification);
        } else {
            console.log('⏭️ Skipping toast (showToast = false)');
        }
    }, [showToast]);

    // Set notifications (bulk update from API)
    const setNotifications = useCallback((notifications) => {
        dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications });
    }, []);

    // Mark as read
    const markAsRead = useCallback((notificationId) => {
        dispatch({ type: ACTIONS.MARK_AS_READ, payload: notificationId });
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        dispatch({ type: ACTIONS.MARK_ALL_AS_READ });
    }, []);

    // Delete notification
    const deleteNotification = useCallback((notificationId) => {
        dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: notificationId });
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_ALL });
    }, []);

    // Remove toast
    const removeToast = useCallback((toastId) => {
        dispatch({ type: ACTIONS.REMOVE_TOAST, payload: toastId });
    }, []);

    // Set filter
    const setFilter = useCallback((filter) => {
        dispatch({ type: ACTIONS.SET_FILTER, payload: filter });
    }, []);

    // Get filtered notifications
    const getFilteredNotifications = useCallback(() => {
        if (state.filter === 'all') {
            return state.notifications;
        }
        if (state.filter === 'unread') {
            return state.notifications.filter(n => !n.isRead);
        }
        // Special filter for all order types
        if (state.filter === 'ORDERS') {
            return state.notifications.filter(n =>
                n.type === NOTIFICATION_TYPES.ORDER_NEW ||
                n.type === NOTIFICATION_TYPES.ORDER_UPDATE
            );
        }
        // Filter by single type
        return state.notifications.filter(n => n.type === state.filter);
    }, [state.notifications, state.filter]);

    // Context value
    const value = {
        notifications: state.notifications,
        filteredNotifications: getFilteredNotifications(),
        toasts: state.toasts,
        unreadCount: state.unreadCount,
        filter: state.filter,
        addNotification,
        setNotifications,
        showToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        removeToast,
        setFilter
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom Hook
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export default NotificationContext;
