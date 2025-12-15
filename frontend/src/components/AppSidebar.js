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
import { useAuth } from "../contexts/AuthContext";

const { Sider } = Layout;

const AppSidebar = ({ collapsed, currentPageKey, setPageTitle }) => {
  const navigate = useNavigate();
  const menuContainerRef = useRef(null);
  const { user } = useAuth();

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
    if (['report_sales', 'report_customers', 'report_reviews'].includes(key)) return 'report';
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
    report_reviews: { path: "/main/reports/reviews", title: "Báo cáo đánh giá" },
  };

  // Dynamic menu items based on user role
  const getMenuItems = () => {
    const allMenuItems = [
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
      { key: "staffs", icon: <TeamOutlined />, label: "Nhân viên", roles: ['OWNER', 'MANAGER'] },
      { key: "accounts", icon: <SafetyOutlined />, label: "Tài khoản", roles: ['OWNER', 'MANAGER'] },
      {
        key: "report",
        icon: <BarChartOutlined />,
        label: "Báo cáo",
        roles: ['OWNER', 'MANAGER'],
        children: [
          { key: "report_sales", label: "Báo cáo bán hàng" },
          { key: "report_customers", label: "Báo cáo khách hàng" },
          { key: "report_reviews", label: "Báo cáo đánh giá" },
        ],
      },
    ];

    // Filter menu items based on user role
    const userRole = user?.role;

    return allMenuItems.filter(item => {
      // If item doesn't have roles restriction, show to everyone
      if (!item.roles) return true;
      // If item has roles restriction, check if user has the role
      return item.roles.includes(userRole);
    });
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
        className="h-[calc(100%-6rem)] overflow-y-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
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
          items={getMenuItems()}
        />
      </div>
    </Sider>
  );
};

export default AppSidebar;


