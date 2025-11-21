import React, { useState, useEffect, useRef } from "react";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  TableOutlined,
  WindowsOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

const AppSidebar = ({ collapsed, currentPageKey, setPageTitle }) => {
  const navigate = useNavigate();
  const menuContainerRef = useRef(null);

  // Lưu trạng thái mở/đóng của submenu vào localStorage
  const [openKeys, setOpenKeys] = useState(() => {
    const saved = localStorage.getItem('sidebarOpenKeys');
    return saved ? JSON.parse(saved) : [];
  });

  // Lưu vào localStorage mỗi khi openKeys thay đổi
  useEffect(() => {
    localStorage.setItem('sidebarOpenKeys', JSON.stringify(openKeys));
  }, [openKeys]);

  // Đảm bảo submenu mở khi sidebar mở và currentPageKey thuộc submenu
  useEffect(() => {
    if (!collapsed && currentPageKey) {
      const parentKey = getParentKey(currentPageKey);
      if (parentKey && !openKeys.includes(parentKey)) {
        setOpenKeys([...openKeys, parentKey]);
      }
    }
  }, [collapsed, currentPageKey]);

  // Helper function để tìm parent key
  const getParentKey = (key) => {
    if (['menus', 'categorys'].includes(key)) return 'products';
    if (['report_sales', 'report_customers', 'report_chatbot'].includes(key)) return 'report';
    return null;
  };

  // Scroll đến menu item được chọn
  useEffect(() => {
    if (currentPageKey && menuContainerRef.current) {
      setTimeout(() => {
        const selectedElement = menuContainerRef.current.querySelector(
          `.ant-menu-item-selected, .ant-menu-submenu-selected`
        );
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
  }, [currentPageKey]);

  // map key -> path & title
  const menuConfig = {
    homes: { path: "/main/homes", title: "Tổng quan" },
    orders: { path: "/main/orders", title: "Đơn hàng" },
    categorys: { path: "/main/categorys", title: "Danh mục" },
    menus: { path: "/main/menus", title: "Thực đơn" },
    tables: { path: "/main/tables", title: "Bàn" },
    customers: { path: "/main/customers", title: "Khách hàng" },
    staffs: { path: "/main/staffs", title: "Nhân viên" },
    accounts: { path: "/main/accounts", title: "Tài khoản" },
    report_sales: { path: "/main/reports/sales", title: "Báo cáo bán hàng" },
    report_customers: { path: "/main/reports/customers", title: "Báo cáo khách hàng" },
    report_chatbot: { path: "/main/reports/chatbots", title: "Báo cáo Chatbot" },
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      className="fixed left-0 top-0 bottom-0 z-[100] bg-white"
    >
      {/* Logo - Grid Layout */}
      <div className="h-24 grid place-items-center overflow-hidden">
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          className={collapsed ? "h-10" : "h-20"}
        />
      </div>

      {/* Menu với scroll - Grid Layout */}
      <div
        ref={menuContainerRef}
        className="h-[calc(100%-6rem)] overflow-y-auto"
      >
        <Menu
          mode="inline"
          selectedKeys={[currentPageKey]}
          openKeys={collapsed ? undefined : openKeys}
          onOpenChange={(keys) => {
            // Chỉ update khi sidebar đang mở
            if (!collapsed) {
              setOpenKeys(keys);
            }
          }}
          onClick={(e) => {
            navigate(menuConfig[e.key].path);
            if (setPageTitle) setPageTitle(menuConfig[e.key].title);
          }}
          inlineCollapsed={collapsed}
          items={[
            { key: "homes", icon: <AppstoreOutlined />, label: "Tổng quan" },
            { key: 'tables', icon: <TableOutlined />, label: 'Bàn' },
            { key: "orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
            {
              key: "products",
              icon: <WindowsOutlined />,
              label: "Sản phẩm",
              children: [
                { key: "menus", icon: <CoffeeOutlined />, label: "Thực đơn" },
                { key: "categorys", icon: <CoffeeOutlined />, label: "Danh mục" }
              ],
            },
            { key: "customers", icon: <UserOutlined />, label: "Khách hàng" },
            { key: "staffs", icon: <TeamOutlined />, label: "Nhân viên" },
            { key: "accounts", icon: <SafetyOutlined />, label: "Tài khoản" },
            {
              key: "report",
              icon: <BarChartOutlined />,
              label: "Báo cáo",
              children: [
                { key: "report_sales", label: "Báo cáo bán hàng" },
                { key: "report_customers", label: "Báo cáo khách hàng" },
                { key: "report_chatbot", label: "Báo cáo Chatbot" },
              ],
            },
          ]}
        />
      </div>
    </Sider>
  );
};

export default AppSidebar;


