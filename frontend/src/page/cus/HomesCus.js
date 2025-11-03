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
  Input,
  Form,
  App,
} from "antd";
import {
  GiftOutlined,
  UserOutlined,
  WechatOutlined,
  ShoppingOutlined,
  EnvironmentFilled,
  PhoneOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect } from "react";
import axios from "axios";
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function HomecsPage() {
  const navigate = useNavigate();
  const { modal, message } = App.useApp(); // ✅ Use App hook for modal and message
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Loyalty Modal states
  const [isLoyaltyModalVisible, setIsLoyaltyModalVisible] = useState(false);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(false);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null); // ✅ Store customer info
  const [form] = Form.useForm();

  // ✅ Check if customer already registered on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('loyalty_customer');
    if (savedCustomer) {
      try {
        setLoyaltyCustomer(JSON.parse(savedCustomer));
      } catch (error) {
        console.error('Error parsing loyalty customer:', error);
        localStorage.removeItem('loyalty_customer');
      }
    }
  }, []);

  const { table_id } = useParams();
  console.log("Table ID from URL:", table_id);
  useEffect(() => {
    if (table_id) {
      // lưu table_id vào sessionStorage
      sessionStorage.setItem("table_id", table_id);
    }
  }, [table_id]);

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
        message.success("Gọi nhân viên thành công!");
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error calling staff:", error);
      message.error(
        error.response?.data?.error || "Có lỗi xảy ra. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle Loyalty Registration
  const handleLoyaltySubmit = async () => {
    try {
      // Validate form
      const values = await form.validateFields();
      const phone = values.phone.trim();

      setIsLoyaltyLoading(true);

      // Call API to register customer
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/customers`, {
        phone: phone,
      });

      if (response.status === 201 || response.status === 200) {
        const customerData = response.data.data;

        // Save to localStorage for future use
        const customerInfo = {
          id: customerData.id,
          phone: customerData.phone,
          loyalty_points: customerData.loyalty_points || 0,
        };
        localStorage.setItem('loyalty_customer', JSON.stringify(customerInfo));
        setLoyaltyCustomer(customerInfo); // ✅ Update state

        message.success({
          content: response.status === 201
            ? 'Đăng ký thành công!'
            : 'Số điện thoại đã được đăng ký!',
          duration: 3,
        });

        // Close modal and reset form
        setIsLoyaltyModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error("Error registering loyalty:", error);

      if (error.name === 'ValidationError') {
        // Form validation error - handled by Ant Design
        return;
      }

      message.error({
        content: 'Có lỗi xảy ra. Vui lòng thử lại.',
        duration: 3,
      });
    } finally {
      setIsLoyaltyLoading(false);
    }
  };

  // ✅ Handle clicking on Loyalty Card
  const handleLoyaltyCardClick = async () => {
    if (loyaltyCustomer) {
      // Already registered - fetch latest info from API
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/customers/me/${loyaltyCustomer.phone}`
        );

        if (response.status === 200) {
          const latestData = response.data.data;

          // Update localStorage with latest data
          const updatedCustomer = {
            id: latestData.id,
            phone: latestData.phone,
            loyalty_points: latestData.points || 0,
          };
          localStorage.setItem('loyalty_customer', JSON.stringify(updatedCustomer));
          setLoyaltyCustomer(updatedCustomer);

          // Show info modal with latest data
          modal.info({
            title: (
              <div className="flex items-center gap-2">
                <StarFilled className="text-purple-500" />
                <span>Thông tin tích điểm</span>
              </div>
            ),
            icon: null,
            content: (
              <div className="mt-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">Số điện thoại:</span>
                    <span className="font-bold text-gray-800">{latestData.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Điểm hiện tại:</span>
                    <span className="font-bold text-purple-600 text-xl">
                      {latestData.points || 0} 💎
                    </span>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-gray-600 m-0">
                    💡 <strong>1000 điểm</strong> cho mỗi <strong>1000₫</strong> chi tiêu
                  </p>
                </div>
              </div>
            ),
            okText: 'Đóng',
            centered: true,
            width: 400,
          });
        }
      } catch (error) {
        console.error('Error fetching customer info:', error);

        if (error.response?.status === 404) {
          // Customer not found - clear localStorage and show registration
          localStorage.removeItem('loyalty_customer');
          setLoyaltyCustomer(null);
          message.warning('Không tìm thấy thông tin tài khoản. Vui lòng đăng ký lại.');
          setIsLoyaltyModalVisible(true);
        } else {
          message.error('Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    } else {
      // Not registered yet - show registration modal
      setIsLoyaltyModalVisible(true);
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
              onClick={handleLoyaltyCardClick}
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

      {/* ========== LOYALTY POINTS MODAL - Simple Mobile-First Design ========== */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <StarFilled className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 m-0">Tích điểm thưởng</h3>
              <p className="text-xs text-gray-500 m-0">Nhập SĐT để nhận ưu đãi</p>
            </div>
          </div>
        }
        open={isLoyaltyModalVisible}
        onCancel={() => {
          setIsLoyaltyModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={420}
        centered
        className="japanese-modal"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLoyaltySubmit}
          className="mt-4"
        >
          {/* Phone Input */}
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              {
                pattern: /^(0[3|5|7|8|9])[0-9]{8}$/,
                message: 'Số điện thoại không hợp lệ (VD: 0912345678)'
              }
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-purple-500" />}
              placeholder="Nhập số điện thoại (10 số)"
              size="large"
              maxLength={10}
              className="rounded-lg"
            />
          </Form.Item>

          {/* Info Box */}
          <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100">
            <p className="text-xs text-gray-600 m-0">
              💎 <strong>1 điểm</strong> cho mỗi <strong>10.000₫</strong> chi tiêu
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="large"
              onClick={() => {
                setIsLoyaltyModalVisible(false);
                form.resetFields();
              }}
              className="flex-1 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoyaltyLoading}
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 border-0"
            >
              Đăng ký
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
