import React, { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Space, Badge } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, pageTitle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

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
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <Dropdown
          popupRender={() => (
            <NotificationDropdown onClose={() => setDropdownVisible(false)} />
          )}
          trigger={["click"]}
          open={dropdownVisible}
          onOpenChange={setDropdownVisible}
          placement="bottomRight"
          getPopupContainer={(trigger) => trigger.parentElement}
        >
          <Badge
            count={unreadCount}
            overflowCount={99}
            offset={[-4, 4]}
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
