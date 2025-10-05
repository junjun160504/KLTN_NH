import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Tag,
  Button,
  Divider,
  Modal,
  message,
  Progress,
  Skeleton,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  SmileOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CoffeeOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerFooterNav from "../../components/CustomerFooterNav";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export default function CustomerBillPage() {
  const navigate = useNavigate();

  // ✅ State
  const [orders, setOrders] = useState([]); // Danh sách đơn hàng
  const [orderItems, setOrderItems] = useState([]); // Tất cả items từ các orders
  const [loading, setLoading] = useState(true);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isThankYouVisible, setIsThankYouVisible] = useState(false);

  // ✅ Fetch orders khi component mount
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Auto refresh mỗi 30s để cập nhật trạng thái
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fetch danh sách orders theo qr_session_id
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Lấy qr_session_id từ localStorage
      const sessionData = localStorage.getItem("qr_session");
      if (!sessionData) {
        message.warning("Không tìm thấy phiên đặt bàn. Vui lòng quét QR!");
        navigate("/cus/homes");
        return;
      }

      const { session_id: qr_session_id } = JSON.parse(sessionData);

      // Gọi API lấy orders theo session
      const response = await axios.get(
        `${REACT_APP_API_URL}/orders/session/${qr_session_id}`
      );

      const fetchedOrders = response.data.data || [];
      setOrders(fetchedOrders);

      // Flatten tất cả items từ các orders
      const allItems = fetchedOrders.flatMap((order) =>
        (order.items || []).map((item) => ({
          ...item,
          orderId: order.id,
          orderStatus: order.status,
          orderCreatedAt: order.created_at,
        }))
      );
      setOrderItems(allItems);

    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 404) {
        // Chưa có order nào
        setOrders([]);
        setOrderItems([]);
      } else {
        message.error("Không thể tải đơn hàng. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tính toán
  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  // Group items by order status (trạng thái của đơn hàng)
  const newOrders = orders.filter(o => o.status === "NEW");
  const inProgressOrders = orders.filter(o => o.status === "IN_PROGRESS");
  const doneOrders = orders.filter(o => o.status === "DONE");

  // ✅ Status config cho ORDER (không phải item)
  const statusConfig = {
    NEW: {
      label: "Đang chờ",
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: <ClockCircleOutlined className="text-blue-500" />,
      progress: 0,
    },
    IN_PROGRESS: {
      label: "Đang làm",
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: <FireOutlined className="text-orange-500" />,
      progress: 50,
    },
    DONE: {
      label: "Hoàn thành",
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: <CheckCircleOutlined className="text-green-500" />,
      progress: 100,
    },
    PAID: {
      label: "Đã thanh toán",
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: <CheckCircleOutlined className="text-purple-500" />,
      progress: 100,
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: <ClockCircleOutlined className="text-red-500" />,
      progress: 0,
    },
  };

  // ✅ Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  // ✅ Handler thanh toán
  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/mock-qr.png";
    link.download = "vietqr.png";
    link.click();
    setIsPaymentModalVisible(false);
    setIsThankYouVisible(true);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* ========== HEADER ========== */}
      <Header
        className="transition-all duration-300"
        style={{
          background: "#fff",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ color: "#333", fontSize: 18 }} />}
          onClick={() => navigate(-1)}
        />
        <div className="text-center">
          <Title level={5} style={{ margin: 0, color: "#226533", fontWeight: 600 }}>
            Chi tiết đơn hàng
          </Title>
        </div>
        <Button
          type="text"
          icon={<SyncOutlined style={{ color: "#226533", fontSize: 18 }} />}
          onClick={fetchOrders}
          loading={loading}
        />
      </Header>

      {/* ========== CONTENT ========== */}
      <Content
        style={{
          padding: "12px",
          paddingTop: "76px",
          paddingBottom: "190px",
        }}
      >
        {/* ===== STATUS TABS ===== */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div
            className="flex-shrink-0 rounded-full bg-blue-50 border border-blue-200 transition-all cursor-pointer hover:shadow-md"
            style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <ClockCircleOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            <div>
              <Text style={{ fontSize: 11, color: "#666", display: "block" }}>Đang chờ</Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1890ff", lineHeight: 1 }}>{newOrders.length}</div>
            </div>
          </div>

          <div
            className="flex-shrink-0 rounded-full bg-orange-50 border border-orange-200 transition-all cursor-pointer hover:shadow-md"
            style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <FireOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
            <div>
              <Text style={{ fontSize: 11, color: "#666", display: "block" }}>Đang làm</Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fa8c16", lineHeight: 1 }}>{inProgressOrders.length}</div>
            </div>
          </div>

          <div
            className="flex-shrink-0 rounded-full bg-green-50 border border-green-200 transition-all cursor-pointer hover:shadow-md"
            style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <div>
              <Text style={{ fontSize: 11, color: "#666", display: "block" }}>Hoàn thành</Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#52c41a", lineHeight: 1 }}>{doneOrders.length}</div>
            </div>
          </div>
        </div>

        {/* ===== ORDERS LIST ===== */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} active avatar paragraph={{ rows: 1 }} />
            ))}
          </div>
        ) : orderItems.length === 0 ? (
          <Empty
            description="Chưa có món nào trong đơn hàng"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div style={{ marginBottom: 16 }}>
            {orderItems.map((item) => {
              const config = statusConfig[item.orderStatus]; // Lấy config theo ORDER status
              return (
                <div
                  key={item.id}
                  className={`${config.bgColor} border ${config.borderColor} rounded-xl transition-all duration-300 hover:shadow-md`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: 12,
                    padding: 12,
                  }}
                >
                  {/* Progress Bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: 3,
                      width: `${config.progress}%`,
                      background:
                        item.orderStatus === "NEW"
                          ? "#1890ff"
                          : item.orderStatus === "IN_PROGRESS"
                            ? "#fa8c16"
                            : "#52c41a",
                      transition: "width 0.5s ease",
                    }}
                  />

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* Image with Status Icon */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={item.image_url || "https://via.placeholder.com/70"}
                        alt={item.menu_item_name}
                        className="rounded-lg shadow-sm"
                        style={{
                          width: 70,
                          height: 70,
                          objectFit: "cover",
                        }}
                      />
                      {/* Status Icon - Top Left Corner of Image */}
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          left: -6,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(255,255,255,0.95)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          zIndex: 1,
                        }}
                      >
                        {config.icon}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14, display: "block", marginRight: 8 }}>
                          {item.menu_item_name}
                        </Text>
                        <Tag color={config.color} style={{ borderRadius: 8, fontSize: 11, padding: "0 6px", flexShrink: 0 }}>
                          {config.label}
                        </Tag>
                      </div>

                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                        {formatTime(item.orderCreatedAt)} • x{item.quantity}
                      </Text>

                      {item.note && (
                        <div
                          style={{
                            marginTop: 4,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(0,0,0,0.03)",
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: "#666" }}>
                            💬 {item.note}
                          </Text>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 12, color: "#999" }}>
                          {item.unit_price.toLocaleString()}đ × {item.quantity}
                        </Text>
                        <Text
                          strong
                          style={{
                            fontSize: 16,
                            color: "#226533",
                            fontWeight: 700,
                          }}
                        >
                          {(item.unit_price * item.quantity).toLocaleString()}đ
                        </Text>
                      </div>

                      {/* Progress for IN_PROGRESS */}
                      {item.orderStatus === "IN_PROGRESS" && (
                        <Progress
                          percent={50}
                          size="small"
                          strokeColor="#fa8c16"
                          showInfo={false}
                          style={{ marginTop: 6 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Content>

      {/* ========== FIXED FOOTER PAYMENT ========== */}
      {orderItems.length > 0 && (
        <div
          className="animate-slide-up"
          style={{
            position: "fixed",
            bottom: 60,
            left: 0,
            right: 0,
            background: "#fff",
            padding: "10px 16px",
            borderTop: "2px solid #f0f0f0",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
            zIndex: 1000,
          }}
        >
          {/* Compact Summary in One Row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
            {/* Left: Total Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <Text strong style={{ fontSize: 16, color: "#226533" }}>
                  {totalPrice.toLocaleString()}đ
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({totalQty} món)
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Giảm giá: -0đ
              </Text>
            </div>

            {/* Right: Payment Button */}
            <Button
              type="primary"
              size="large"
              style={{
                fontSize: 15,
                fontWeight: 600,
                height: 44,
                paddingLeft: 24,
                paddingRight: 24,
                background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(34, 101, 51, 0.3)",
                flexShrink: 0,
              }}
              onClick={() => setIsPaymentModalVisible(true)}
            >
              💳 Thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* ========== MODAL THANH TOÁN ========== */}
      <Modal
        title={
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 600 }}>
            Chọn phương thức thanh toán
          </div>
        }
        centered
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ padding: "8px 0" }}>
          {/* Tổng tiền */}
          <div
            className="mb-4 p-4 rounded-xl text-center"
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "#fff",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
              Tổng thanh toán
            </Text>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
              {totalPrice.toLocaleString()}đ
            </div>
          </div>

          {/* Tiền mặt */}
          <Button
            type="primary"
            size="large"
            block
            className="mb-3 hover:scale-105 transition-transform"
            style={{
              height: 56,
              fontSize: 16,
              fontWeight: 600,
              background: "#226533",
              borderRadius: 12,
            }}
            onClick={() => {
              setIsPaymentModalVisible(false);
              message.success("Nhân viên sẽ tới trong vài phút để hỗ trợ!");
              setTimeout(() => setIsThankYouVisible(true), 500);
            }}
          >
            💵 Thanh toán tiền mặt
          </Button>

          <Divider>hoặc</Divider>

          {/* VietQR */}
          <div
            className="text-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all"
            style={{ background: "#fafafa" }}
          >
            <CoffeeOutlined style={{ fontSize: 48, color: "#226533", marginBottom: 12 }} />
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: 16 }}>
              Quét mã VietQR
            </Text>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16 }}>
              Quét mã để thanh toán nhanh chóng
            </Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
              style={{
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Tải mã QR
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== MODAL CẢM ƠN ========== */}
      <Modal
        centered
        open={isThankYouVisible}
        onCancel={() => setIsThankYouVisible(false)}
        footer={null}
        width={360}
      >
        <div style={{ textAlign: "center", padding: "24px 8px" }}>
          <div
            className="animate-bounce"
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SmileOutlined style={{ fontSize: 40, color: "#fff" }} />
          </div>

          <Title level={3} style={{ marginBottom: 8, color: "#226533" }}>
            Cảm ơn bạn! 🎉
          </Title>
          <Text style={{ fontSize: 15, color: "#666", display: "block", marginBottom: 24 }}>
            Cảm ơn bạn đã lựa chọn <b style={{ color: "#226533" }}>Phương Nam</b>
            <br />
            Hãy đánh giá để chúng tôi phục vụ tốt hơn nhé! ⭐
          </Text>

          <div className="flex gap-3">
            <Button
              type="primary"
              size="large"
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                border: "none",
                borderRadius: 12,
              }}
              onClick={() => navigate("/cus/reviews")}
            >
              ⭐ Đánh giá ngay
            </Button>
            <Button
              size="large"
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
              }}
              onClick={() => navigate("/cus/homes")}
            >
              🏠 Về trang chủ
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== FOOTER NAV ========== */}
      <CustomerFooterNav cartCount={totalQty} />
    </Layout>
  );
}
