import React from 'react';
import useNotificationLoader from '../hooks/useNotificationLoader';

/**
 * AdminLayout - Layout component cho tất cả admin pages
 * - Load notifications từ API khi mount
 * - Khởi tạo Socket.IO connection
 * - Listen real-time notifications
 * - Notifications sẽ hoạt động trên TẤT CẢ admin pages
 */
const AdminLayout = ({ children }) => {
    // Get userId and userType from localStorage
    // TODO: Nên lấy từ auth context/Redux store thay vì localStorage
    const userId = parseInt(localStorage.getItem('userId')) || 1;
    const userType = localStorage.getItem('userType') || 'STAFF';

    // Initialize notifications và Socket.IO
    // Hook này sẽ chạy mỗi khi AdminLayout mount
    // Vì mỗi admin page đều wrap trong AdminLayout nên hook sẽ chạy mỗi lần navigate
    useNotificationLoader(userId, userType);

    // Render child page component
    return <>{children}</>;
};

export default AdminLayout;
