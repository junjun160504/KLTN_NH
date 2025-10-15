import { useState } from "react";
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
  message,
} from "antd";
import {
  GiftOutlined,
  UserOutlined,
  WechatOutlined,
  ShoppingOutlined,
  EnvironmentFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect } from "react";
import axios from "axios";
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function HomecsPage() {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { tableId } = useParams();
  console.log("Table ID from URL:", tableId);
  useEffect(() => {
    if (tableId) {
      // lưu tableId vào sessionStorage
      sessionStorage.setItem("tableId", tableId);
    }
  }, [tableId]);

  // Gọi nhân viên
  const handleCallStaff = async () => {
    try {
      setIsLoading(true);

      // Lấy qr_session_id từ localStorage
      const qrSession = JSON.parse(localStorage.getItem("qr_session")) || {};
      const qrSessionId = qrSession.session_id;

      if (!qrSessionId) {
        message.error("Không tìm thấy thông tin phiên QR. Vui lòng quét mã QR lại.");
        setIsModalVisible(false);
        return;
      }

      // Gọi API - Chỉ tạo notification, không lưu vào table riêng
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/call-staff`, {
        qr_session_id: qrSessionId,
        message: null, // có thể thêm input để user nhập message nếu muốn
      });

      if (response.status === 201) {
        message.success("Đã gọi nhân viên thành công! Nhân viên sẽ tới ngay.");
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error calling staff:", error);
      message.error(
        error.response?.data?.error || "Có lỗi xảy ra khi gọi nhân viên. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Tính chào theo giờ
  const hour = new Date().getHours();
  let greeting = "Chào buổi tối Quý khách";
  if (hour < 10) {
    greeting = "Chào buổi sáng Quý khách";
  } else if (hour < 13) {
    greeting = "Chào buổi trưa Quý khách";
  } else if (hour < 18) {
    greeting = "Chào buổi chiều Quý khách";
  }

  const qrSession = JSON.parse(localStorage.getItem("qr_session")) || {};
  const tableNumber = qrSession.table_id || "N/A";

  const banners = [
    "/assets/images/Banner1.jpg",
    "/assets/images/Banner2.png",
    "/assets/images/Banner.jpg",
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          textAlign: "center",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          height: "auto",
          lineHeight: "normal",
        }}
      >
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          style={{ height: 90, marginBottom: 8 }}
        />

        <Title
          level={3}
          style={{
            margin: "0 0 8px 0",
            fontWeight: "bold",
            color: "#226533",
            fontSize: 26,
          }}
        >
          Nhà hàng Phương Nam
        </Title>

        <div style={{ marginBottom: 12 }}>
          <EnvironmentFilled style={{ color: "#ff4d4f", marginRight: 4 }} />
          <Text style={{ fontSize: 14, color: "#666" }}>
            Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng
          </Text>
        </div>

        <Text strong style={{ fontSize: 16, color: "#333" }}>
          {greeting} • Bàn{" "}
          <Tag
            color="green"
            style={{
              fontWeight: "bold",
              fontSize: 15,
              borderRadius: "8px",
              padding: "4px 12px",
            }}
          >
            {tableNumber}
          </Tag>
        </Text>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "20px 16px", paddingBottom: "90px" }}>
        {/* Banner - Carousel tự động chuyển ảnh */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: 24,
            border: "none",
          }}
        >
          <Carousel
            autoplay
            autoplaySpeed={3500}
            effect="fade"
            dots={true}
            dotPosition="bottom"
          >
            {banners.map((img, index) => (
              <div key={index}>
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    backgroundImage: `url(${img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            ))}
          </Carousel>
        </Card>

        {/* Actions - 2 card với border radius đẹp */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12}>
            <Card
              hoverable
              style={{
                textAlign: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 16,
                border: "none",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                transition: "all 0.3s ease",
                height: "100%",
              }}
              bodyStyle={{
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 140,
              }}
              onClick={() => navigate("/cus/loyaltys")}
            >
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <GiftOutlined style={{ fontSize: 30, color: "#fff" }} />
              </div>
              <Text
                style={{
                  fontSize: 16,
                  color: "#fff",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Tích điểm thưởng
              </Text>
            </Card>
          </Col>

          <Col xs={12}>
            <Card
              hoverable
              style={{
                textAlign: "center",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                borderRadius: 16,
                border: "none",
                boxShadow: "0 4px 12px rgba(240, 147, 251, 0.4)",
                transition: "all 0.3s ease",
                height: "100%",
              }}
              bodyStyle={{
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 140,
              }}
              onClick={() => setIsModalVisible(true)}
            >
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <UserOutlined style={{ fontSize: 30, color: "#fff" }} />
              </div>
              <Text
                style={{
                  fontSize: 16,
                  color: "#fff",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Gọi nhân viên
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Nút chat bot - FIX icon méo */}
        <div
          onClick={() => navigate("/cus/chatbot")}
          style={{
            position: "fixed",
            right: 20,
            bottom: 100,
            zIndex: 1000,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #226533 0%, #2d8a45 100%)",
            boxShadow: "0 4px 16px rgba(34, 101, 51, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "3px solid #fff",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <WechatOutlined style={{ fontSize: 28, color: "#fff" }} />
        </div>
      </Content>

      {/* -------- FOOTER -------- */}
      <Footer
        style={{
          background: "#fff",
          padding: "16px",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
        }}
      >
        <Button
          type="primary"
          size="large"
          block
          onClick={() => navigate("/cus/menus")}
          style={{
            height: 52,
            fontSize: 17,
            fontWeight: "bold",
            borderRadius: 26,
            background: "linear-gradient(135deg, #226533 0%, #2d8a45 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(34, 101, 51, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShoppingOutlined style={{ fontSize: 20, marginRight: 8 }} />
          Xem Menu - Gọi món
        </Button>
      </Footer>

      {/* -------- MODAL -------- */}
      <Modal
        open={isModalVisible}
        title={
          <div
            style={{
              textAlign: "center",
              fontSize: 20,
              fontWeight: "bold",
              color: "#226533",
            }}
          >
            🔔 Gọi nhân viên
          </div>
        }
        onCancel={() => setIsModalVisible(false)}
        centered
        width={360}
        footer={[
          <Button
            key="cancel"
            size="large"
            onClick={() => setIsModalVisible(false)}
            style={{
              borderRadius: 8,
              height: 44,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            size="large"
            loading={isLoading}
            onClick={handleCallStaff}
            style={{
              background: "linear-gradient(135deg, #226533 0%, #2d8a45 100%)",
              borderRadius: 8,
              border: "none",
              fontWeight: "bold",
              height: 44,
            }}
          >
            Xác nhận gọi
          </Button>,
        ]}
      >
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 16, color: "#333" }}>
            Bạn có chắc chắn muốn gọi nhân viên không?
          </p>
          <div
            style={{
              color: "#52c41a",
              fontSize: 14,
              background: "#f6ffed",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #b7eb8f",
            }}
          >
            ✨ Nhân viên sẽ được thông báo và tới bàn của bạn ngay lập tức
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
