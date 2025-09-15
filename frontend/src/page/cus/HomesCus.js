import React from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Carousel,
} from "antd";
import {
  GiftOutlined,
  DollarOutlined,
  UserOutlined,
  StarOutlined,
  MenuOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function HomecsPage() {
  // Tính chào theo giờ
  const hour = new Date().getHours();
  let greeting = "Chào buổi tối Quý khách";
  if (hour < 12) {
    greeting = "Chào buổi sáng Quý khách";
  } else if (hour < 18) {
    greeting = "Chào buổi trưa Quý khách";
  } else {
    greeting = "Chào buổi chiều Quý khách";
  }

  const tableNumber = 8;

  const banners = [
    "https://source.unsplash.com/600x300/?restaurant,vietnamese",
    "https://source.unsplash.com/600x300/?vietnamese,food",
    "https://source.unsplash.com/600x300/?noodles,vietnam",
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          textAlign: "center",
          padding: "12px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          height: "auto", // ⚠️ rất quan trọng để không che mất text
          lineHeight: "normal",
        }}
      >
        {/* Logo */}
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          style={{ height: 80, marginBottom: 6 }}
        />

        {/* Tên nhà hàng */}
        <Title level={4} style={{ margin: 0, fontWeight: "bold", color: "#226533" }}>
          Nhà hàng Phương Nam
        </Title>

        {/* Địa chỉ */}
        <Text style={{ fontSize: 14, color: "#666" }}>
          Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng
        </Text>

        <br />

        {/* Chào + bàn số */}
        <Text strong style={{ fontSize: 15 }}>
          {greeting} • Bàn{" "}
          <Tag
            color="green"
            style={{
              fontWeight: "bold",
              fontSize: 16,
              borderRadius: "12px",
              padding: "2px 10px",
            }}
          >
            {tableNumber}
          </Tag>
        </Text>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "16px" }}>
        {/* Banner */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Carousel autoplay>
            {banners.map((img, index) => (
              <div key={index}>
                <img
                  src={img}
                  alt={`banner-${index}`}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </Carousel>
        </Card>

        {/* Actions */}
        <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
          {[
            {
              icon: <GiftOutlined style={{ fontSize: 28, color: "#1677ff" }} />,
              text: "Tích điểm",
              bg: "#e6f4ff",
              onClick: () => alert("Nhập số điện thoại tích điểm"),
            },
            {
              icon: <DollarOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
              text: "Thanh toán",
              bg: "#f6ffed",
              onClick: () => alert("Thanh toán"),
            },
            {
              icon: <UserOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
              text: "Gọi nhân viên",
              bg: "#f9f0ff",
              onClick: () => alert("Gọi nhân viên"),
            },
            {
              icon: <StarOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
              text: "Đánh giá",
              bg: "#fff7e6",
              onClick: () => alert("Đánh giá"),
            },
          ].map((item, i) => (
            <Col xs={12} key={i}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  background: item.bg,
                  borderRadius: 12,
                  minHeight: 100,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                onClick={item.onClick}
              >
                {item.icon}
                <Text style={{ fontSize: 13, marginTop: 6 }}>{item.text}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      {/* -------- FOOTER -------- */}
      <Footer style={{ background: "#fff", padding: "12px 16px" }}>
        <Button
          type="primary"
          size="large"
          shape="round"
          icon={<MenuOutlined />}
          block
          style={{
            height: 50,
            fontSize: 16,
            borderRadius: 25,
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          Xem Menu - Gọi món
        </Button>
      </Footer>
    </Layout>
  );
}
