import React, { useState } from "react";
import {
  Layout,
  Typography,
  Button,
  Input,
  Space,
  Tag,
} from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export default function CustomerChatbotPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?" },
  ]);
  const [input, setInput] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleSend = () => {
    if (!input.trim()) return;
    // thêm tin nhắn của user
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");

    // giả lập bot trả lời
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Cảm ơn bạn đã nhắn! Nhân viên sẽ hỗ trợ ngay." },
      ]);
    }, 1000);
  };

  const getActiveColor = (path) =>
    location.pathname === path ? "orange" : "#226533";

  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title level={5} style={{ margin: 0 }}>
          Chatbot hỗ trợ
        </Title>
        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{
          padding: "12px",
          paddingBottom: "100px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  msg.from === "user" ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: msg.from === "user" ? "#226533" : "#f0f0f0",
                  color: msg.from === "user" ? "white" : "black",
                  padding: "8px 12px",
                  borderRadius: 16,
                  maxWidth: "75%",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
        </Space.Compact>
      </Content>

      {/* -------- FOOTER NAV -------- */}
      <Footer
        style={{
          background: "#fff",
          padding: "8px 16px",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Space
          style={{
            width: "100%",
            justifyContent: "space-around",
            display: "flex",
          }}
        >
          <Button
            type="primary"
            shape="circle"
            icon={<HomeOutlined />}
            style={{ background: getActiveColor("/cus/homes") }}
            onClick={() => navigate("/cus/homes")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<MessageOutlined />}
            style={{ background: getActiveColor("/cus/chatbot") }}
            onClick={() => navigate("/cus/chatbot")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<ShoppingCartOutlined />}
            style={{ background: getActiveColor("/cus/carts") }}
            onClick={() => navigate("/cus/carts")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<FileTextOutlined />}
            style={{ background: getActiveColor("/cus/bills") }}
            onClick={() => navigate("/cus/bills")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<AppstoreOutlined />}
            style={{ background: getActiveColor("/cus/menus") }}
            onClick={() => navigate("/cus/menus")}
          />
        </Space>
      </Footer>
    </Layout>
  );
}
