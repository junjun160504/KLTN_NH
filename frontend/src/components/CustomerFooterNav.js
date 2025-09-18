import React from "react";
import { Button, Space, Badge } from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

export default function CustomerFooterNav({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Màu active cho icon
  const getActiveColor = (path) =>
    location.pathname === path ? "orange" : "#226533";

  return (
    <div
      style={{
        background: "#fff",
        padding: "8px 16px",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Space
        style={{
          width: "100%",
          justifyContent: "space-around",
          display: "flex",
        }}
      >
        {/* Menu */}
        <Button
          type="primary"
          shape="circle"
          icon={<AppstoreOutlined />}
          style={{ background: getActiveColor("/cus/menus") }}
          onClick={() => navigate("/cus/menus")}
        />

        {/* Chatbot */}
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          style={{ background: getActiveColor("/cus/chatbot") }}
          onClick={() => navigate("/cus/chatbot")}
        />

        {/* Trang chủ */}
        <Button
          type="primary"
          shape="circle"
          icon={<HomeOutlined />}
          style={{ background: getActiveColor("/cus/homes") }}
          onClick={() => navigate("/cus/homes")}
        />

        {/* Giỏ hàng + Badge */}
        <Button
          type="primary"
          shape="circle"
          style={{ background: getActiveColor("/cus/carts") }}
          onClick={() => navigate("/cus/carts")}
        >
          <Badge
            count={cartCount}
            offset={[0, 5]}
            style={{
              backgroundColor: "orange",
              fontWeight: "bold",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
            }}
          >
            <ShoppingCartOutlined style={{ fontSize: 18, color: "white" }} />
          </Badge>
        </Button>

        {/* Đơn hàng */}
        <Button
          type="primary"
          shape="circle"
          icon={<FileTextOutlined />}
          style={{ background: getActiveColor("/cus/bills") }}
          onClick={() => navigate("/cus/bills")}
        />
      </Space>
    </div>
  );
}
