import { useState, useEffect, useCallback } from "react";
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
  Form,
  App,
} from "antd";
import {
  GiftOutlined,
  UserOutlined,
  WechatOutlined,
  ShoppingOutlined,
  EnvironmentFilled,
  StarFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useQRHandler } from "../../hooks/useQRHandler"; // ✅ Import QR handler
import { useSession } from "../../contexts/SessionContext"; // ✅ Import session context
import LoyaltyRegistrationModal from "../../components/LoyaltyRegistrationModal";
import { updateSessionCustomer, saveCustomerInfo } from "../../utils/sessionUtils"; // 🎯 Import session utilities
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function HomecsPage() {
  const navigate = useNavigate();
  const { modal, message } = App.useApp(); // ✅ Use App hook for modal and message
  const { session } = useSession(); // ✅ Get session from context
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState(null); // ✅ State for actual table number
  const [callStaffMessage, setCallStaffMessage] = useState(""); // ✅ State for call staff message

  // ✅ Fetch table number from database
  const fetchTableNumber = useCallback(async () => {
    try {
      const qrSession = JSON.parse(localStorage.getItem("qr_session")) || {};
      const tableId = qrSession.table_id;

      if (tableId) {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/tables/${tableId}`
        );

        if (response.status === 200 && response.data.data) {
          setTableNumber(response.data.data.table_number);
        }
      }
    } catch (error) {
      console.error("Error fetching table number:", error);
      // Keep default "N/A" if error occurs
    }
  }, []);

  // ✅ Fetch table number when component mounts
  useEffect(() => {
    fetchTableNumber();
  }, [fetchTableNumber]);

  // ✅ QR Handler - Auto process QR params when scanning QR code
  // Use useCallback to prevent recreating functions on every render
  const handleQRSuccess = useCallback((sessionData) => {
    message.success(`Đã quét QR thành công!`);

    // ✅ Clear loyalty customer info when scanning new QR (new session)
    // This allows new customer to register without being locked to previous customer's info
    localStorage.removeItem('loyalty_customer');
    setLoyaltyCustomer(null);
    console.log('🔄 Cleared loyalty customer info for new session');

    // ✅ Clear restaurant review from old session
    // Pattern: restaurant_review_session_* (will be recreated with new session_id)
    const restaurantReviewKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('restaurant_review_session_')
    );
    restaurantReviewKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 Cleared old restaurant review: ${key}`);
    });

    // ✅ Note: qr_session is automatically overwritten by useQRHandler with new session data
    // No need to manually remove old session - it gets replaced automatically

    fetchTableNumber();
    // ✅ Fetch table number again after QR scan
  }, [message, fetchTableNumber]);

  const handleQRError = useCallback((error) => {
    console.error('❌ QR Error in HomesCus:', error);
    message.error('QR Code không hợp lệ hoặc đã hết hạn');
  }, [message]);

  const { isProcessing: isQRProcessing, qrError } = useQRHandler({
    redirectPath: '/cus/homes', // Stay on home page after processing
    autoRedirect: false, // Don't redirect, just process QR
    onSuccess: handleQRSuccess,
    onError: handleQRError
  });

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
        message: callStaffMessage.trim() || null, // ✅ Gửi message từ input (nếu có)
      });

      if (response.status === 201) {
        message.success("Gọi nhân viên thành công!");
        setIsModalVisible(false);
        setCallStaffMessage(""); // ✅ Reset message sau khi gọi thành công
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
  const handleLoyaltySubmit = async (values) => {
    try {
      const phone = values.phone.trim();
      const name = values.name ? values.name.trim() : null;

      setIsLoyaltyLoading(true);

      // Call API to register customer
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/customers`, {
        phone: phone,
        name: name, // ✅ Include name if provided
      });

      if (response.status === 201 || response.status === 200) {
        const customerData = response.data.data;

        // 🎯 Save customer info using utility function
        const customerInfo = saveCustomerInfo(customerData);
        setLoyaltyCustomer(customerInfo);

        // 🎯 UPDATE qr_session với customer_id using utility function
        await updateSessionCustomer(customerData.id);

        message.success({
          content: response.status === 201
            ? 'Đăng ký thành công!'
            : 'Ghi nhận thông tin thành công!',
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
            name: latestData.name || null,
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
                  {latestData.name && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Tên khách hàng:</span>
                      <span className="font-bold text-gray-800">{latestData.name}</span>
                    </div>
                  )}
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
                    💡 <strong>1 điểm</strong> cho mỗi <strong>100,000₫</strong> chi tiêu (đơn tối thiểu 300k) | <strong>1 điểm</strong> = <strong>3,000₫</strong> giảm (tối thiểu 30 điểm)
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
            Số 2, ngõ 69 Chùa Láng, Hà Nội
          </Text>
        </div>

        <Text strong style={{ fontSize: 16, color: "#333" }}>
          {greeting}
          {tableNumber && session?.status === 'ACTIVE' && (
            <>
              {" • Bàn "}
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
            </>
          )}
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
        onCancel={() => {
          setIsModalVisible(false);
          setCallStaffMessage(""); // ✅ Clear message khi đóng modal
        }}
        centered
        width={360}
        footer={[
          <Button
            key="cancel"
            size="large"
            onClick={() => {
              setIsModalVisible(false);
              setCallStaffMessage(""); // ✅ Clear message khi hủy
            }}
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
        <div style={{ padding: "12px 0" }}>
          {/* ✅ Input để nhập nội dung gọi nhân viên */}
          <Form.Item style={{ marginBottom: 16 }}>
            <textarea
              value={callStaffMessage}
              onChange={(e) => setCallStaffMessage(e.target.value)}
              placeholder="Ví dụ: Cần thêm tô, muốn gọi thêm món..."
              maxLength={200}
              rows={3}
              style={{
                width: "92%",
                padding: "10px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid #d9d9d9",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ textAlign: "right", fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
              {callStaffMessage.length}/200
            </div>
          </Form.Item>

          <div
            style={{
              color: "#52c41a",
              fontSize: 13,
              background: "#f6ffed",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #b7eb8f",
              textAlign: "center",
            }}
          >
            ✨ Nhân viên sẽ nhận được thông báo ngay lập tức
          </div>
        </div>
      </Modal>

      {/* ========== LOYALTY REGISTRATION MODAL ========== */}
      <LoyaltyRegistrationModal
        visible={isLoyaltyModalVisible}
        onCancel={() => {
          setIsLoyaltyModalVisible(false);
          form.resetFields();
        }}
        onSubmit={handleLoyaltySubmit}
        loading={isLoyaltyLoading}
        form={form}
      />
    </Layout>
  );
}
