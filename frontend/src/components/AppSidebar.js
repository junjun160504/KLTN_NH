import React, { useState } from "react";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  UserOutlined,
  TeamOutlined,
  RobotOutlined,
  BarChartOutlined,
  TableOutlined,
  WindowsOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

const AppSidebar = ({ collapsed, currentPageKey, setPageTitle }) => {
  const navigate = useNavigate();

  // trạng thái submenu
  const [openKeys, setOpenKeys] = useState([]);

  // map key -> path
  const keyToPath = {
    homes: "/main/homes",
    orders: "/main/orders",
    categorys: "/main/categorys", // Thực đơn
    tables: "/main/tables",       // Bàn
    customers: "/main/customers",
    staffs: "/main/staffs",
    chatbot: "/main/chatbot",
    report: "/main/reports",
  };

  // map key -> title
  const keyToTitle = {
    homes: "Tổng quan",
    orders: "Đơn hàng",
    categorys: "Thực đơn",
    tables: "Bàn",
    customers: "Khách hàng",
    staffs: "Nhân viên",
    chatbot: "Chatbot",
    report: "Báo cáo",
  };

  // toggle header submenu
  const toggleSubmenu = (key) => {
    if (openKeys.includes(key)) {
      setOpenKeys(openKeys.filter((k) => k !== key)); // đang mở thì đóng
    } else {
      setOpenKeys([...openKeys, key]); // đang đóng thì mở
    }
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

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[currentPageKey]}
        openKeys={openKeys} // luôn lấy từ state
        onClick={(e) => {
          navigate(keyToPath[e.key]);
          if (setPageTitle) setPageTitle(keyToTitle[e.key]);
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
            onTitleClick: () => toggleSubmenu("category"), // 👈 tự toggle
          },
          { key: "customers", icon: <UserOutlined />, label: "Khách hàng" },
          { key: "staffs", icon: <TeamOutlined />, label: "Nhân viên" },
          { key: "chatbot", icon: <RobotOutlined />, label: "Chatbot" },
          { key: "report", icon: <BarChartOutlined />, label: "Báo cáo" },
        ]}
      />
    </Sider>
  );
};

export default AppSidebar;
