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
    categorys: { path: "/main/categorys", title: "Thực đơn" },
    tables: { path: "/main/tables", title: "Bàn" },
    customers: { path: "/main/customers", title: "Khách hàng" },
    staffs: { path: "/main/staffs", title: "Nhân viên" },
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
      style={{
        background: "#fff",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          style={{ height: collapsed ? 40 : 80 }}
        />
      </div>

      {/* Menu có scroll */}
      <div
        style={{
          height: "calc(100% - 100px)", // trừ chiều cao logo
          overflowY: "auto",
        }}
      >
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
            { key: "orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
            {
              key: "category",
              icon: <WindowsOutlined />,
              label: "Danh mục",
              children: [
                { key: "categorys", icon: <CoffeeOutlined />, label: "Thực đơn" },
                { key: "tables", icon: <TableOutlined />, label: "Bàn" },
              ],
              onTitleClick: () => toggleSubmenu("category"),
            },
            { key: "customers", icon: <UserOutlined />, label: "Khách hàng" },
            { key: "staffs", icon: <TeamOutlined />, label: "Nhân viên" },
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


