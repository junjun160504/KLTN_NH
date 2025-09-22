import  { useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Carousel,
  Modal,
} from "antd";
import {
  GiftOutlined,
  DollarOutlined,
  UserOutlined,
  StarOutlined,
  MenuOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect } from "react";
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function HomecsPage() {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { tableId } = useParams();
  console.log("Table ID from URL:", tableId);
  useEffect(() => {
    if (tableId) {
      // lưu tableId vào sessionStorage
      sessionStorage.setItem("tableId", tableId);
    }
  }, [tableId]);
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
    "/assets/images/Banner1.jpg",
    "/assets/images/Banner2.png",
    "/assets/images/Banner.jpg",
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
          height: "auto",
          lineHeight: "normal",
        }}
      >
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          style={{ height: 100, marginBottom: 6 }}
        />

        <Title
          level={4}
          style={{ margin: 0, fontWeight: "bold", color: "#226533", fontSize: 30 }}
        >
          Nhà hàng Phương Nam
        </Title>

        <Text style={{ fontSize: 18, color: "#666" }}>
          Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng
        </Text>

        <br />

        <Text strong style={{ fontSize: 20 }}>
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
          <Carousel autoplay autoplaySpeed={3000}>
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
              fontSize: 18,
              color: "#1677ff",
              onClick: () => navigate("/cus/loyaltys"),
            },
            {
              icon: <DollarOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
              text: "Thanh toán",
              bg: "#f6ffed",
              fontSize: 18,
              color: "#52c41a",
              onClick: () => navigate("/cus/bills"),
            },
            {
              icon: <UserOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
              text: "Gọi nhân viên",
              bg: "#f9f0ff",
              fontSize: 18,
              color: "#722ed1",
              onClick: () => setIsModalVisible(true),
            },
            {
              icon: <StarOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
              text: "Đánh giá",
              bg: "#fff7e6",
              fontSize: 18,
              color: "#fa8c16",
              onClick: () => navigate("/cus/reviews"),
            },
          ].map((item, i) => (
            <Col xs={12} key={i}>
              <Card
                hoverable
                style={{
                  textAlign: "center",
                  background: item.bg,
                  borderRadius: 12,
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                onClick={item.onClick}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {item.icon}
                  <Text
                    style={{
                      fontSize: item.fontSize, 
                      color: item.color || "#333",
                      marginTop: 6,
                      fontWeight: 500,
                      textAlign: "center",
                      whiteSpace: "normal",   // cho phép xuống dòng
                      wordWrap: "break-word", // tự động xuống dòng khi dài
                      maxWidth: 95,           // giới hạn độ rộng để text xuống dòng
                    }}
                  >
                    {item.text}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Nút chat bot */}
        <Button
          type="primary"
          shape="circle"
          icon={<WechatOutlined style={{ fontSize: 24 }} />}
          size="large"
          onClick={() => navigate("/cus/chatbot")}
          style={{
            position: "fixed",
            right: 20,
            bottom: 80,   // đặt cao hơn Footer chút
            zIndex: 1000,
            width: 60,
            height: 60,
            backgroundColor: "#226533",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        />
      </Content>

      {/* -------- FOOTER -------- */}
      <Footer style={{ background: "#fff", padding: "12px 16px" }}>
        <Button
          type="primary"
          size="large"
          shape="round"
          icon={<MenuOutlined style={{ fontSize: 24 }} />}
          block
          onClick={() => navigate("/cus/menus")}
          style={{
            height: 50,
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 25,
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          Xem Menu - Gọi món
        </Button>
      </Footer>

      {/* -------- MODAL -------- */}
      <Modal
        open={isModalVisible}
        title="Thông báo"
        onCancel={() => setIsModalVisible(false)}
        centered
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        <p>Nhân viên sẽ tới ngay, vui lòng đợi chút.</p>
        
      </Modal>
    </Layout>
  );
}
