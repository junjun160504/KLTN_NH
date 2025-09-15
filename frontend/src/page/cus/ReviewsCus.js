import React, { useState } from "react";
import {
  Layout,
  Typography,
  Button,
  Rate,
  Input,
  Space,
  Tag,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
 // StarOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CustomerReviewPage() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = () => {
    if (rating === 0) {
      message.warning("Vui lòng chọn số sao đánh giá!");
      return;
    }
    message.success("Cảm ơn bạn đã đánh giá!");
    // 👉 Tại đây có thể gửi feedback lên server
    navigate("/cus/homes_cs"); // quay về trang chính sau khi gửi
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginRight: 8 }}
        />
        <Title level={5} style={{ margin: 0 }}>
          Đánh giá dịch vụ
        </Title>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "16px", paddingBottom: "80px" }}>
        <Title level={4} style={{ textAlign: "center", marginBottom: 12 }}>
          Cảm ơn bạn đã dùng bữa tại Nhà hàng Phương Nam
        </Title>
        <Text style={{ display: "block", textAlign: "center", marginBottom: 20 }}>
          Bàn <Tag color="green">C8</Tag>
        </Text>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Text strong>Vui lòng đánh giá trải nghiệm của bạn:</Text>
          <br />
          <Rate
            allowHalf
            value={rating}
            onChange={(value) => setRating(value)}
            style={{ fontSize: 28, marginTop: 8 }}
          />
        </div>

        <TextArea
          rows={4}
          placeholder="Nhập nhận xét của bạn..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ borderRadius: 8, marginBottom: 20 }}
        />

        <Button type="primary" block shape="round" size="large" onClick={handleSubmit}>
          Gửi đánh giá
        </Button>
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
