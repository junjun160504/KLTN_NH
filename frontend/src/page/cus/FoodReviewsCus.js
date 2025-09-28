import React, { useState } from "react";
import {
  Layout,
  Typography,
  Button,
  Rate,
  Input,
  List,
  Avatar,
  Modal,
  message,
  Tag,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CustomerReviewAllPage() {
  const navigate = useNavigate();

  // ✅ Demo món ăn
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

  // ✅ Đánh giá nhà hàng
  const [storeRating, setStoreRating] = useState(0);
  const [storeFeedback, setStoreFeedback] = useState("");

  // ✅ Popup cảm ơn
  const [thankYouVisible, setThankYouVisible] = useState(false);

  const handleRateFood = (id, value) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rating: value } : f))
    );
  };

  const handleNoteFood = (id, value) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, note: value } : f))
    );
  };

  const handleSubmit = () => {
    const reviewedFoods = foods.filter(
      (f) => f.rating > 0 || f.note.trim() !== ""
    );

    if (
      reviewedFoods.length === 0 &&
      storeRating === 0 &&
      storeFeedback.trim() === ""
    ) {
      message.warning("Bạn hãy đánh giá chúng tôi nhé!");
      return;
    }

    console.log("Đánh giá món ăn:", reviewedFoods);
    console.log("Đánh giá nhà hàng:", {
      rating: storeRating,
      feedback: storeFeedback,
    });

    setThankYouVisible(true); // 👉 mở popup cảm ơn
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
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title
          level={5}
          style={{ margin: 0, fontWeight: "bold", color: "#226533" }}
        >
          Đánh giá sau bữa ăn
        </Title>
        <div style={{ width: 40 }} /> {/* giữ cân đối với nút back */}
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "16px", paddingBottom: "100px" }}>
        {/* ---- ĐÁNH GIÁ MÓN ĂN ---- */}
        <Title level={4} style={{ marginBottom: 16, color: "#226533" }}>
          Đánh giá món ăn của bạn
        </Title>
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
                    {food.name}{" "}
                    <span style={{ color: "#888" }}>×{food.quantity}</span>
                  </span>
                }
                description={
                  <div>
                    <Rate
                      value={food.rating}
                      onChange={(value) => handleRateFood(food.id, value)}
                    />
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập nhận xét..."
                      value={food.note}
                      onChange={(e) => handleNoteFood(food.id, e.target.value)}
                      style={{ marginTop: 8, borderRadius: 8 }}
                    />
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {/* ---- ĐÁNH GIÁ NHÀ HÀNG ---- */}
        <Title
          level={4}
          style={{ marginBottom: 12, marginTop: 24, color: "#226533" }}
        >
          Đánh giá nhà hàng
        </Title>
        <Text style={{ display: "block", marginBottom: 8 }}>
          Bàn <Tag color="green">C8</Tag>
        </Text>
        <Rate
          value={storeRating}
          onChange={(value) => setStoreRating(value)}
          style={{ fontSize: 28, marginBottom: 12 }}
        />
        <TextArea
          rows={4}
          placeholder="Nhập nhận xét về nhà hàng..."
          value={storeFeedback}
          onChange={(e) => setStoreFeedback(e.target.value)}
          style={{ borderRadius: 8, marginBottom: 20 }}
        />
      </Content>

      {/* -------- FOOTER (NÚT GỬI) -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "1px solid #eee",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          type="primary"
          block
          shape="round"
          size="large"
          onClick={handleSubmit}
          style={{ background: "#226533", fontWeight: "bold" }}
        >
          Gửi đánh giá
        </Button>
      </div>

      {/* -------- POPUP CẢM ƠN -------- */}
      <Modal
        open={thankYouVisible}
        onCancel={() => {
          setThankYouVisible(false);
          navigate("/cus/homes_cs");
        }}
        footer={null}
        centered
      >
        <div style={{ textAlign: "center", padding: "12px" }}>
          <Title level={4} style={{ color: "#226533" }}>
            🎉 Cảm ơn bạn đã đánh giá!
          </Title>
          <Text>Hẹn gặp lại bạn trong lần tới 💚</Text>
        </div>
      </Modal>
    </Layout>
  );
}
