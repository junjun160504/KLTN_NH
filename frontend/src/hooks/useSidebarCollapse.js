import { useState, useEffect } from "react";

/**
 * Custom hook để quản lý trạng thái collapsed của sidebar
 * Lưu trữ vào localStorage để duy trì trạng thái khi refresh trang
 */
const useSidebarCollapse = () => {
  const [collapsed, setCollapsed] = useState(() => {
    // Lấy giá trị từ localStorage khi khởi tạo
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    return savedCollapsed === "true"; // Convert string to boolean
  });

  useEffect(() => {
    // Lưu vào localStorage mỗi khi collapsed thay đổi
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  return [collapsed, setCollapsed];
};

export default useSidebarCollapse;
