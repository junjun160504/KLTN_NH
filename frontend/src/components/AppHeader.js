import React, { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Space, List, Typography, Badge } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = ({ collapsed, setCollapsed, pageTitle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Đơn hàng #123 đã được thanh toán", read: false },
    { id: 2, message: "Nguyên liệu mới đã nhập kho", read: true },
    { id: 3, message: "Có 1 đánh giá mới từ khách hàng", read: false },
  ]);

  const navigate = useNavigate();

  // Menu user
  const handleMenuClick = ({ key }) => {
    if (key === "1") {
      console.log("Mở hồ sơ cá nhân...");
    }
    if (key === "2") {
      localStorage.removeItem("token");
      sessionStorage.clear();
      navigate("/main/auth");
    }
  };

  const userMenu = {
    items: [
      { key: "1", label: "Hồ sơ cá nhân" },
      { key: "2", label: "Đăng xuất" },
    ],
    onClick: handleMenuClick,
  };

  // Lắng nghe thay đổi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menu thông báo
  const notificationMenu = (
    <div style={{ width: 360, maxHeight: 400, overflowY: "auto" }}>
      {notifications.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center", color: "#888" }}>
          Không có thông báo nào
        </div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                background: item.read ? "#fff" : "#e6f7e6",
                cursor: "pointer",
                padding: "12px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === item.id ? { ...n, read: true } : n
                  )
                )
              }
            >
              <Text strong={!item.read}>{item.message}</Text>
            </List.Item>
          )}
        />
      )}
    </div>
  );

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
        <span style={{ fontSize: 20, fontWeight: "bold", color: "#226533" }}>
          {pageTitle}
        </span>
      </div>

      {/* Bên phải: Notifications + User */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown dropdownRender={() => notificationMenu} trigger={["click"]}>
          <Badge
            count={notifications.filter((n) => !n.read).length}
            overflowCount={9}
          >
            <BellOutlined
              style={{
                fontSize: 22,
                marginRight: 20,
                color: "#226533",
                cursor: "pointer",
              }}
            />
          </Badge>
        </Dropdown>

        <Dropdown menu={userMenu}>
          <Button type="text" style={{ fontSize: 16, color: "#333" }}>
            <Space>
              <UserOutlined />
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
