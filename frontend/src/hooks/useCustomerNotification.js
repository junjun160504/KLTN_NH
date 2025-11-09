import { useEffect, useRef } from 'react';
import { App } from 'antd';
import notificationService from '../services/notificationService';

/**
 * Custom Hook để Customer nhận thông báo real-time từ Admin
 * Tự động hiển thị Ant Design message theo type
 * 
 * Sử dụng qrSessionId từ QR scan (không cần đăng nhập)
 * 
 * @param {Object} options - Tùy chọn cấu hình
 */
const useCustomerNotification = (options = {}) => {
    const {
        showToast = true,           // Hiển thị message toast
        duration = 4,               // Thời gian hiển thị (giây)
        maxCount = 3                // Số message tối đa cùng lúc
    } = options;

    const listenerRef = useRef(null);

    // ✅ Sử dụng App.useApp() INSIDE component để lấy message instance đúng
    const { message } = App.useApp();

    useEffect(() => {
        // Lấy qrSessionId từ localStorage (được set khi quét QR)
        // Format: { table_id, session_id }
        const qrSessionData = localStorage.getItem('qr_session');

        if (!qrSessionData) {
            console.warn('⚠️ useCustomerNotification: No qr_session found. User needs to scan QR code.');
            return;
        }

        let qrSessionId;
        try {
            const parsed = JSON.parse(qrSessionData);
            qrSessionId = parsed.session_id;
        } catch (err) {
            console.error('❌ Failed to parse qr_session:', err);
            return;
        }

        if (!qrSessionId) {
            console.warn('⚠️ useCustomerNotification: No session_id in qr_session.');
            return;
        }

        console.log('🔔 Initializing customer notification listener with qrSessionId:', qrSessionId);

        // Listener callback - Hiển thị theo type
        const handleNotification = (notification) => {
            console.log('📩 Customer received notification:', notification);

            if (!showToast) {
                console.log('🔕 Toast disabled, skipping message display');
                return;
            }

            const { type = 'info', message: msg } = notification;

            // Hiển thị message theo type
            switch (type) {
                case 'success':
                    message.success(msg, duration);
                    break;
                case 'error':
                    message.error(msg, duration);
                    break;
                case 'warning':
                    message.warning(msg, duration);
                    break;
                case 'info':
                default:
                    message.info(msg, duration);
                    break;
            }
        };

        // Register listener với notificationService
        listenerRef.current = notificationService.addListener(handleNotification);

        // Initialize socket nếu chưa có
        if (!notificationService.socket) {
            console.log('🔌 Initializing socket with qrSessionId:', qrSessionId);
            notificationService.initializeSocket(qrSessionId, 'CUSTOMER');
        }

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up customer notification listener');
            if (listenerRef.current) {
                listenerRef.current(); // Unsubscribe
            }
        };
    }, [showToast, duration, maxCount, message]);
};

export default useCustomerNotification;
