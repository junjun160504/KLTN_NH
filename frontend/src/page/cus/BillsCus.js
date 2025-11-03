import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Layout,
  Typography,
  Tag,
  Button,
  Modal,
  Skeleton,
  Empty,
  App,
  Result,
} from "antd";
import {
  ArrowLeftOutlined,
  SmileOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
  SyncOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import { useSession } from "../../contexts/SessionContext";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// ✅ Format giá tiền theo chuẩn VN: 500000 => 500.000
const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN');
};

// ✅ Status config cho ORDER (không phải item) - Move ra ngoài để tránh re-create
const STATUS_CONFIG = {
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

export default function CustomerBillPage() {
  const navigate = useNavigate();
  const { session } = useSession(); // ✅ Get session from context
  const { message } = App.useApp(); // ✅ Use hook for notification and message
  const hasShownWarning = useRef(false); // ✅ Track if warning shown (doesn't trigger re-render)

  // ✅ State
  const [orderItems, setOrderItems] = useState([]); // Tất cả items từ các orders
  const [loading, setLoading] = useState(true);
  const [isThankYouVisible, setIsThankYouVisible] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({}); // Track which orders are expanded

  // Toggle expand/collapse for an order
  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // ✅ Check if customer has scanned QR - Only show notification once
  useEffect(() => {
    if ((!session || !session.session_id) && !hasShownWarning.current) {
      // Show notification if no session
      message.error({
        content: 'Vui lòng quét QR trước khi xem đơn hàng',
        duration: 3,
      });
      hasShownWarning.current = true; // Mark as shown (no re-render)
    }
  }, [session, message]);

  // ✅ Fetch danh sách orders theo qr_session_id
  // @param {boolean} silent - Nếu true, không hiển thị loading skeleton
  // Wrap trong useCallback để tránh re-create function mỗi render
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      // Chỉ set loading khi không phải silent refresh
      if (!silent) {
        setLoading(true);
      }

      // Lấy qr_session_id từ localStorage
      const sessionData = localStorage.getItem("qr_session");
      if (!sessionData) {
        message.warning("Không tìm thấy phiên đặt bàn. Vui lòng quét QR!");
        // navigate("/cus/homes");
        return;
      }

      const { session_id: qr_session_id } = JSON.parse(sessionData);

      // Gọi API lấy orders theo session
      const response = await axios.get(
        `${REACT_APP_API_URL}/orders/session/${qr_session_id}`
      );

      const fetchedOrders = response.data.data || [];

      // Transform orders để thêm computed fields
      const transformedOrders = fetchedOrders.map(order => ({
        ...order,
        totalItems: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        totalPrice: order.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
      }));

      setOrderItems(transformedOrders);

    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 404) {
        // Chưa có order nào
        setOrderItems([]);
      } else {
        // Chỉ hiển thị error message khi không phải silent refresh
        if (!silent) {
          message.error("Không thể tải đơn hàng. Vui lòng thử lại!");
        }
      }
    } finally {
      // Chỉ set loading = false khi không phải silent
      if (!silent) {
        setLoading(false);
      }
    }
  }, [navigate, message]); // Dependencies: navigate, message

  // ✅ Fetch orders khi component mount - Only if session exists
  useEffect(() => {
    if (session && session.session_id) {
      fetchOrders();
    } else {
      setLoading(false); // Stop loading if no session
    }
  }, [fetchOrders, session]);

  // ✅ Auto refresh mỗi 30s để cập nhật trạng thái (silent mode) - Only if session exists
  useEffect(() => {
    if (!session || !session.session_id) {
      return; // Don't start interval if no session
    }

    const interval = setInterval(() => {
      fetchOrders(true); // Silent refresh - không hiển thị loading
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchOrders, session]);

  // ✅ Tính toán tổng - CHỈ các đơn CHƯA thanh toán (status !== 'PAID')
  // Dùng useMemo để tránh tính toán lại không cần thiết
  const unpaidOrders = useMemo(() =>
    orderItems.filter(order => order.status !== 'PAID'),
    [orderItems]
  );

  const totalQty = useMemo(() =>
    unpaidOrders.reduce((sum, order) => sum + (order.totalItems || 0), 0),
    [unpaidOrders]
  );

  const totalPrice = useMemo(() =>
    unpaidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
    [unpaidOrders]
  );

  // ✅ Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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
          onClick={() => fetchOrders(false)} // Manual refresh - hiển thị loading
          loading={loading}
          disabled={!session || !session.session_id} // Disable if no session
        />
      </Header>

      {/* ========== CONTENT ========== */}
      <Content
        style={{
          padding: "1px",
          paddingTop: "72px",
          paddingBottom: "180px",
        }}
      >
        {/* ===== CHECK IF NO SESSION - SHOW EMPTY STATE ===== */}
        {!session || !session.session_id ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 200px)',
            padding: '20px'
          }}>
            <Result
              icon={<QrcodeOutlined style={{ fontSize: 80, color: '#226533' }} />}
              title="Chưa quét QR Code"
              subTitle="Vui lòng quét QR Code trên bàn để xem đơn hàng của bạn"
              extra={[
                <Button
                  key="home"
                  type="primary"
                  size="large"
                  onClick={() => navigate('/cus/homes')}
                  style={{
                    background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                    border: "none",
                    borderRadius: 8,
                    height: 44,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Về trang chủ
                </Button>,
              ]}
            />
          </div>
        ) : (
          <>
            {/* ===== ORDERS LIST ===== */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} active paragraph={{ rows: 3 }} />
                ))}
              </div>
            ) : orderItems.length === 0 ? (
              <Empty
                description="Chưa có đơn hàng nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div style={{ marginBottom: 16 }}>
                {/* Render each ORDER as a card */}
                {orderItems.map((order) => {
                  const config = STATUS_CONFIG[order.status];
                  const isExpanded = expandedOrders[order.id];

                  return (
                    <div
                      key={order.id}
                      style={{
                        marginBottom: 12,
                        background: "#fff",
                        borderRadius: 8,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                        opacity: order.status === 'PAID' ? 0.8 : 1, // Mờ đi nếu đã thanh toán
                      }}
                    >
                      {/* Order Header - Compact & Clean */}
                      <div
                        style={{
                          padding: "10px 12px",
                          background: config.bgColor.replace("bg-", "").replace("-50", ""),
                          backgroundColor:
                            order.status === "NEW" ? "#e6f7ff" :
                              order.status === "IN_PROGRESS" ? "#fff7e6" :
                                order.status === "DONE" ? "#f6ffed" :
                                  order.status === "PAID" ? "#f9f0ff" : "#fff1f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {/* Status Icon */}
                          <div
                            style={{
                              fontSize: 16,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {config.icon}
                          </div>

                          {/* Order Info */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Text strong style={{ fontSize: 13, color: "#333", lineHeight: 1 }}>
                              Đơn hàng #{order.id}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1 }}>
                              {formatTime(order.created_at)}
                            </Text>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Tag
                          color={config.color}
                          style={{
                            borderRadius: 4,
                            fontSize: 10,
                            padding: "2px 6px",
                            margin: 0,
                            fontWeight: 500,
                          }}
                        >
                          {config.label}
                        </Tag>
                      </div>

                      {/* Order Items List - Optimized for Mobile */}
                      <div style={{ padding: "10px 12px" }}>
                        {/* Reverse items array to show newest first */}
                        {[...(order.items || [])].reverse()
                          .slice(0, isExpanded ? order.items.length : 1)
                          .map((item, index, array) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                gap: 10,
                                paddingBottom: index < array.length - 1 ? 10 : 0,
                                marginBottom: index < array.length - 1 ? 10 : 0,
                                borderBottom: index < array.length - 1 ? "1px dashed #f0f0f0" : "none",
                              }}
                            >
                              {/* Item Image - Smaller for mobile */}
                              <img
                                src={item.image_url || "https://via.placeholder.com/70"}
                                alt={item.menu_item_name}
                                style={{
                                  width: 70,
                                  height: 70,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  border: "1px solid #e8e8e8",
                                  flexShrink: 0,
                                }}
                              />

                              {/* Item Info - Vertical Layout */}
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                {/* Item Name - 2 lines max */}
                                <Text
                                  strong
                                  style={{
                                    fontSize: 13,
                                    lineHeight: "18px",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    color: "#333",
                                  }}
                                >
                                  {item.menu_item_name}
                                </Text>

                                {/* Price Row - Compact (MOVED UP) */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* Unit Price */}
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {formatPrice(item.unit_price)}đ
                                  </Text>

                                  {/* Quantity & Total */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      x{item.quantity}
                                    </Text>
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 14,
                                        color: "#226533",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {formatPrice(item.unit_price * item.quantity)}đ
                                    </Text>
                                  </div>
                                </div>

                                {/* Note (if exists) - Compact (MOVED DOWN) */}
                                {item.note && (
                                  <div
                                    style={{
                                      padding: "3px 6px",
                                      borderRadius: 3,
                                      background: "#f5f5f5",
                                      display: "inline-block",
                                      alignSelf: "flex-start",
                                    }}
                                  >
                                    <Text style={{ fontSize: 10, color: "#666" }}>
                                      💬 {item.note}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                        {/* Show More / Show Less Button - Compact */}
                        {order.items && order.items.length > 1 && (
                          <div
                            onClick={() => toggleOrderExpand(order.id)}
                            style={{
                              marginTop: 8,
                              padding: "6px 0",
                              textAlign: "center",
                              color: "#226533",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              borderTop: "1px solid #f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <span style={{ fontSize: 10 }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                            <span>
                              {isExpanded
                                ? "Thu gọn"
                                // : `Xem thêm ${order.items.length - 1} món`
                                : `Xem thêm`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Order Footer - Compact Total */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "#fafafa",
                          borderTop: "1px solid #f0f0f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {order.totalItems} món
                        </Text>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Tổng:
                          </Text>
                          <Text
                            strong
                            style={{
                              fontSize: 15,
                              color: "#226533",
                              fontWeight: 600,
                            }}
                          >
                            {formatPrice(order.totalPrice)}đ
                          </Text>
                        </div>
                      </div>

                      {/* Progress Bar - Thin indicator at bottom */}
                      <div
                        style={{
                          height: 2,
                          width: `${config.progress}%`,
                          background:
                            order.status === "NEW"
                              ? "#1890ff"
                              : order.status === "IN_PROGRESS"
                                ? "#fa8c16"
                                : "#52c41a",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Content>

      {/* ========== FIXED FOOTER PAYMENT ========== */}
      {/* Chỉ hiển thị khi có đơn chưa thanh toán */}
      {unpaidOrders.length > 0 && (
        <div
          className="animate-slide-up"
          style={{
            position: "fixed",
            bottom: 60,
            left: 0,
            right: 0,
            background: "#fff",
            padding: "10px 12px",
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
                  {formatPrice(totalPrice)}đ
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
                paddingLeft: 16,
                paddingRight: 16,
                background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(34, 101, 51, 0.3)",
                flexShrink: 0,
              }}
              onClick={() => navigate('/cus/payment', {
                state: {
                  totalPrice,
                  unpaidOrders
                }
              })}
            >
              💳 Thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* ========== MODAL THANH TOÁN - Đã thay bằng trang mới /cus/payment ========== */}
      {/* Giữ lại code cũ để tham khảo, có thể xóa sau */}

      {/* ========== MODAL CẢM ƠN ========== */}
      <Modal
        centered
        open={isThankYouVisible}
        onCancel={() => setIsThankYouVisible(false)}
        footer={null}
        width={360}
      >
        <div style={{ textAlign: "center", padding: "16px 8px" }}>
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
