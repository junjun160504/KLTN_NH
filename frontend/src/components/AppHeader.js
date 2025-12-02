import React, { useState } from "react";
import { Layout, Button, Badge, Dropdown } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";
import UserProfile from "./UserProfile";

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, pageTitle }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();

  // Handle user logout
  const handleLogout = () => {
    logout();
    navigate("/main/auth");
  };

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
            className="mr-5"
            style={{
              fontSize: 12,
              height: 20,
              maxWidth: 24,
            }}
            count={unreadCount}
            overflowCount={9}
          >
            <BellOutlined
              style={{
                fontSize: 24,
                marginRight: 0,
                color: "#226533",
                cursor: "pointer",
              }}
            />
          </Badge>
        </Dropdown>

        {/* User Profile Dropdown */}
        {user && <UserProfile user={user} onLogout={handleLogout} />}
      </div>
    </Header>
  );
};

export default AppHeader;
