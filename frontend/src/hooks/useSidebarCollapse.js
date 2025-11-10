import { useState, useEffect } from 'react';

/**
 * Custom hook để quản lý trạng thái mở/đóng của sidebar
 * Lưu trạng thái vào localStorage để persist khi reload trang
 */
const useSidebarCollapse = (defaultCollapsed = false) => {
    // Lấy trạng thái từ localStorage, nếu không có thì dùng giá trị mặc định
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            return saved === 'true';
        }
        return defaultCollapsed;
    });

    // Lưu vào localStorage mỗi khi trạng thái thay đổi
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }, [collapsed]);

    return [collapsed, setCollapsed];
};

export default useSidebarCollapse;
