import React from "react";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  UserOutlined,
  TeamOutlined,
  RobotOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

const AppSidebar = ({ collapsed, currentPageKey, setPageTitle }) => {
  const navigate = useNavigate();

  // map key -> path
  const keyToPath = {
    homes: "/main/homes",
    orders: "/main/orders",
    categorys: "/main/categorys",
    customers: "/main/customers",
    staffs: "/main/staffs",
    chatbot: "/main/chatbot",
    report: "/main/report",
  };

  // map key -> title
  const keyToTitle = {
    homes: "Tổng quan",
    orders: "Đơn hàng",
    categorys: "Thực đơn",
    customers: "Khách hàng",
    staff: "Nhân viên",
    chatbot: "Chatbot",
    report: "Báo cáo",
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
        selectedKeys={[currentPageKey]} // 👈 highlight menu theo trang
        onClick={(e) => {
          navigate(keyToPath[e.key]); // điều hướng
          if (setPageTitle) setPageTitle(keyToTitle[e.key]); // cập nhật title
        }}
        items={[
          { key: "homes", icon: <AppstoreOutlined />, label: "Tổng quan" },
          { key: "orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
          { key: "categorys", icon: <CoffeeOutlined />, label: "Thực đơn" },
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