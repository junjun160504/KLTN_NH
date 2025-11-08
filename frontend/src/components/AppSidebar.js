import React, { useState } from "react";
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
  const [openKeys, setOpenKeys] = useState([]);

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
    report_products: { path: "/main/reports/products", title: "Báo cáo sản phẩm" },
    report_customers: { path: "/main/reports/customers", title: "Báo cáo khách hàng" },
    report_chatbot: { path: "/main/reports/chatbots", title: "Báo cáo Chatbot" },
  };

  const toggleSubmenu = (key) => {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
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
      <div className="h-[calc(100%-6rem)] overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[currentPageKey]}
          openKeys={openKeys}
          onClick={(e) => {
            navigate(menuConfig[e.key].path);
            if (setPageTitle) setPageTitle(menuConfig[e.key].title);
          }}
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
              onTitleClick: () => toggleSubmenu("products"),
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
                { key: "report_products", label: "Báo cáo sản phẩm" },
                { key: "report_customers", label: "Báo cáo khách hàng" },
                { key: "report_chatbot", label: "Báo cáo Chatbot" },
              ],
              onTitleClick: () => toggleSubmenu("report"),
            },
          ]}
        />
      </div>
    </Sider>
  );
};

export default AppSidebar;


