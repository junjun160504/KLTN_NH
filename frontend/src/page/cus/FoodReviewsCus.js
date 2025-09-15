import React, { useState } from "react";
import {
  Layout,
  Typography,
  Button,
  Rate,
  Input,
  List,
  Avatar,
  Space,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export default function CustomerFoodReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Demo danh sách món đã gọi
  const [foods, setFoods] = useState([
    {
      id: 1,
      name: "Phở Bò Tái",
      img: "https://source.unsplash.com/400x300/?pho,vietnamese",
      quantity: 2,
      rating: 0,
      note: "",
    },
    {
      id: 2,
      name: "Cơm Tấm Sườn Nướng",
      img: "https://source.unsplash.com/400x300/?comtam,vietnam",
      quantity: 1,
      rating: 0,
      note: "",
    },
    {
      id: 3,
      name: "Cà Phê Sữa Đá",
      img: "https://source.unsplash.com/400x300/?coffee,vietnam",
      quantity: 3,
      rating: 0,
      note: "",
    },
  ]);

  const handleRateChange = (id, value) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rating: value } : f))
    );
  };

  const handleNoteChange = (id, value) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, note: value } : f))
    );
  };

  const handleSubmit = () => {
    const reviewed = foods.filter((f) => f.rating > 0 || f.note.trim() !== "");
    if (reviewed.length === 0) {
      message.warning("Vui lòng đánh giá ít nhất 1 món ăn!");
      return;
    }
    console.log("Gửi đánh giá:", reviewed);
    message.success("Cảm ơn bạn đã đánh giá món ăn!");
    navigate("/cus/review"); // 👉 Sau khi xong thì chuyển sang trang đánh giá tổng thể
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
          Đánh giá món ăn
        </Title>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "16px", paddingBottom: "80px" }}>
        <List
          itemLayout="vertical"
          dataSource={foods}
          renderItem={(food) => (
            <List.Item
              key={food.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="square"
                    size={64}
                    src={food.img}
                    style={{ borderRadius: 8 }}
                  />
                }
                title={
                  <span>
                    {food.name} <span style={{ color: "#888" }}>×{food.quantity}</span>
                  </span>
                }
                description={
                  <div>
                    <Rate
                      value={food.rating}
                      onChange={(value) => handleRateChange(food.id, value)}
                    />
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập nhận xét..."
                      value={food.note}
                      onChange={(e) => handleNoteChange(food.id, e.target.value)}
                      style={{ marginTop: 8, borderRadius: 8 }}
                    />
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <Button type="primary" block shape="round" size="large" onClick={handleSubmit}>
          Gửi đánh giá món ăn
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
            style={{ background: getActiveColor("/cus/homes_cs") }}
            onClick={() => navigate("/cus/homes_cs")}
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
            style={{ background: getActiveColor("/cus/cart") }}
            onClick={() => navigate("/cus/cart")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<FileTextOutlined />}
            style={{ background: getActiveColor("/cus/bill") }}
            onClick={() => navigate("/cus/bill")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<AppstoreOutlined />}
            style={{ background: getActiveColor("/cus/menu") }}
            onClick={() => navigate("/cus/menu")}
          />
        </Space>
      </Footer>
    </Layout>
  );
}
