import React, { useState, useRef, useEffect } from "react";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Typography,
  Button,
  Input,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function CustomerChatbotPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?" },
  ]);
  const [input, setInput] = useState("");
  const [cartCount] = useState(5); // ✅ demo giỏ hàng

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // ✅ Auto scroll khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Gửi tin nhắn
  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");

    // Giả lập bot trả lời
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Đang xử lý yêu cầu: " + input },
      ]);
    }, 1000);
  };

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
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title
          level={5}
          style={{
            margin: 0,
            color: "#226533",
            fontWeight: "bold",
            fontSize: 20,
          }}
        >
          Chatbot
        </Title>
        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT (KHUNG CHAT) -------- */}
      <Content
        style={{
          padding: "12px",
          paddingTop: "60px", // chừa chỗ cho header
          paddingBottom: "220px", // ✅ chừa chỗ cho gợi ý + input + footer nav
        }}
      >
        <div
          style={{
            height: "calc(100vh - 230px)", // ✅ khung chat fix chiều cao
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
                  fontSize: 16,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </Content>

      {/* -------- GỢI Ý CÂU HỎI -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 120,
          left: 0,
          right: 0,
          padding: "8px 12px",
          background: "#fff",
          borderTop: "1px solid #eee",
          display: "flex",
          overflowX: "auto",
          whiteSpace: "nowrap",
          gap: 8,
          zIndex: 1000,
        }}
      >
        {[
          "Món mới gần đây?",
          "Món đặc trưng của nhà hàng?",
          "Set đồ ăn cho 2 người?",
          "Món nào ít cay?",
        ].map((suggestion, i) => (
          <Button
            key={i}
            size="medium"
            onClick={() => {
              setMessages((prev) => [
                ...prev,
                { from: "user", text: suggestion },
              ]);
              setTimeout(() => {
                setMessages((prev) => [
                  ...prev,
                  { from: "bot", text: "Đang xử lý yêu cầu: " + suggestion },
                ]);
              }, 800);
            }}
          >
            {suggestion}
          </Button>
        ))}
      </div>

      {/* -------- Ô nhập tin nhắn (cố định) -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 70, // ✅ ngay trên FooterNav
          left: 0,
          right: 0,
          padding: "8px 12px",
          background: "#fff",
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 8,
          zIndex: 1000,
        }}
      >
        <Input
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
      </div>

      {/* -------- FOOTER NAV -------- */}
      <CustomerFooterNav cartCount={cartCount} />
    </Layout>
  );
}
