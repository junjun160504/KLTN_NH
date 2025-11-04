import React from 'react';
import useCustomerNotification from '../hooks/useCustomerNotification';

/**
 * CustomerLayout - Layout wrapper cho customer pages
 * Tự động nhận và hiển thị thông báo real-time từ Admin
 * 
 * Sử dụng sessionToken từ QR scan (không cần đăng nhập)
 * 
 * Usage:
 * <CustomerLayout>
 *   <YourCustomerPage />
 * </CustomerLayout>
 */
const CustomerLayout = ({ children }) => {
    // Initialize customer notification
    // Hook tự động lấy sessionToken từ localStorage
    useCustomerNotification({
        showToast: true,      // Hiển thị message toast
        position: 'topRight', // Vị trí hiển thị
        duration: 4,          // 4 giây
        maxCount: 3           // Tối đa 3 message cùng lúc
    });

    return <>{children}</>;
};

export default CustomerLayout;
