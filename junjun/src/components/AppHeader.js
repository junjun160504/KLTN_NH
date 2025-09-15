import React, { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Space } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, pageTitle, userMenu }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Lắng nghe thay đổi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // breakpoint mobile
    };
    handleResize(); // chạy 1 lần khi mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "fixed",
        top: 0,
        right: 0,
        left: collapsed ? 80 : 220,
        zIndex: 90,
        height: 64,
        borderBottom: "1px solid #eee",
      }}
    >
      {/* Bên trái: Toggle + Tiêu đề */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: 20, width: 40, height: 40 }}
        />
        <span
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#226533",
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Bên phải: User + Notification */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <BellOutlined
          style={{ fontSize: 22, marginRight: 20, color: "#226533" }}
        />

        <Dropdown menu={userMenu}>
          <Button type="text" style={{ fontSize: 16, color: "#333" }}>
            <Space>
              <UserOutlined />
              {/* Nếu màn hình to thì hiện tên, nhỏ thì chỉ icon */}
              {!isMobile && "ThuyDung (Quản lý)"}
              {!isMobile && <DownOutlined />}
            </Space>
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
