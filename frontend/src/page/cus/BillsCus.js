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
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import { useSession } from "../../contexts/SessionContext";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// 🎨 Practical UI - Design Tokens
const DESIGN_TOKENS = {
  // Spacing Scale (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  // Typography Scale
  fontSize: {
    xs: 10,
    sm: 11,
    base: 13,
    md: 14,
    lg: 15,
    xl: 16,
  },
  // Color Palette - Minimal
  colors: {
    primary: '#226533',
    primaryLight: '#2d8e47',
    text: '#333',
    textSecondary: '#666',
    textTertiary: '#999',
    border: '#e8e8e8',
    borderLight: '#f0f0f0',
    background: '#f5f7fa',
    white: '#fff',
    // Semantic colors
    success: '#52c41a',
    warning: '#fa8c16',
    error: '#ff4d4f',
    info: '#1890ff',
  },
  // Border Radius
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    full: 9999,
  },
  // Touch Targets (min 44x44px for accessibility)
  touchTarget: {
    min: 44,
    button: 32,
    icon: 24,
  },
};

// ✅ Format giá tiền theo chuẩn VN: 500000 => 500.000
const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN');
};

// ✅ Status config - Simplified for Practical UI
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
    label: "Đang phục vụ",
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
  const { message, modal } = App.useApp(); // ✅ Use hook for notification, message, and modal
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

  // ✅ Update item quantity in NEW order
  const handleUpdateQuantity = async (orderId, itemId, newQuantity) => {
    if (newQuantity < 1) {
      message.warning('Số lượng phải lớn hơn 0');
      return;
    }

    try {
      await axios.put(`${REACT_APP_API_URL}/orders/${orderId}/items/${itemId}`, {
        quantity: newQuantity
      });

      message.success('Cập nhật số lượng thành công');
      fetchOrders(true); // Silent refresh
    } catch (error) {
      console.error('Error updating quantity:', error);
      message.error('Không thể cập nhật số lượng. Vui lòng thử lại!');
    }
  };

  // ✅ Delete item from NEW order
  const handleDeleteItem = async (orderId, itemId, itemName) => {
    modal.confirm({
      title: 'Xác nhận xóa món',
      content: `Bạn có chắc muốn xóa "${itemName}" khỏi đơn hàng?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.delete(`${REACT_APP_API_URL}/orders/${orderId}/items/${itemId}`);

          message.success('Đã xóa món thành công');
          fetchOrders(true); // Silent refresh
        } catch (error) {
          console.error('Error deleting item:', error);
          message.error('Không thể xóa món. Vui lòng thử lại!');
        }
      }
    });
  };

  // ✅ Cancel entire NEW order
  const handleCancelOrder = async (orderId) => {
    console.log('🔴 handleCancelOrder called with orderId:', orderId);

    modal.confirm({
      title: 'Xác nhận hủy đơn',
      content: 'Bạn có chắc muốn hủy toàn bộ đơn hàng này?',
      okText: 'Hủy đơn',
      cancelText: 'Quay lại',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          console.log('📤 Calling API to cancel order:', orderId);
          const response = await axios.put(`${REACT_APP_API_URL}/orders/${orderId}/cancel`, {
            reason: 'Khách hàng hủy đơn' // Optional reason
          });
          console.log('✅ Cancel order response:', response.data);

          message.success('Đã hủy đơn hàng thành công');
          fetchOrders(true); // Silent refresh
        } catch (error) {
          console.error('❌ Error cancelling order:', error);
          console.error('Error details:', error.response?.data);
          message.error(error.response?.data?.message || 'Không thể hủy đơn. Vui lòng thử lại!');
        }
      }
    });
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

  // ✅ Lọc chỉ lấy các đơn đã được xác nhận (không phải NEW)
  const confirmedOrders = useMemo(() =>
    unpaidOrders.filter(order => order.status !== 'NEW'),
    [unpaidOrders]
  );

  const totalQty = useMemo(() =>
    confirmedOrders.reduce((sum, order) => sum + (order.totalItems || 0), 0),
    [confirmedOrders]
  );

  const totalPrice = useMemo(() =>
    confirmedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
    [confirmedOrders]
  );

  // ✅ Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Layout className="min-h-screen" style={{ background: DESIGN_TOKENS.colors.background }}>
      {/* ========== HEADER ========== */}
      <Header
        className="fixed top-0 left-0 right-0 z-[1000] transition-all duration-300"
        style={{
          background: DESIGN_TOKENS.colors.white,
          padding: `0 ${DESIGN_TOKENS.spacing.lg}px`,
          height: 64,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center justify-between h-full">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center"
            style={{ fontSize: DESIGN_TOKENS.fontSize.xl }}
          />
          <Title
            level={5}
            className="m-0 font-semibold"
            style={{ color: DESIGN_TOKENS.colors.primary }}
          >
            Chi tiết đơn hàng
          </Title>
          <Button
            type="text"
            icon={<SyncOutlined />}
            onClick={() => fetchOrders(false)}
            loading={loading}
            disabled={!session || !session.session_id}
            className="w-11 h-11 flex items-center justify-center"
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xl,
              color: DESIGN_TOKENS.colors.primary
            }}
          />
        </div>
      </Header>

      {/* ========== CONTENT ========== */}
      <Content className="pt-[72px] pb-[180px] px-1">
        {/* ===== CHECK IF NO SESSION - SHOW EMPTY STATE ===== */}
        {!session || !session.session_id ? (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-5">
            <Result
              icon={<QrcodeOutlined style={{ fontSize: 80, color: DESIGN_TOKENS.colors.primary }} />}
              title="Chưa quét QR Code"
              subTitle="Vui lòng quét QR Code trên bàn để xem đơn hàng của bạn"
              extra={[
                <Button
                  key="home"
                  type="primary"
                  size="large"
                  onClick={() => navigate('/cus/homes')}
                  className="h-11 font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary} 0%, ${DESIGN_TOKENS.colors.primaryLight} 100%)`,
                    border: "none",
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    fontSize: DESIGN_TOKENS.fontSize.lg,
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
              <div className="mb-4">
                {/* Render each ORDER as a card */}
                {orderItems.map((order) => {
                  const config = STATUS_CONFIG[order.status];
                  const isExpanded = expandedOrders[order.id];

                  return (
                    <div
                      key={order.id}
                      className="mb-3 bg-white rounded-lg overflow-hidden shadow-sm"
                      style={{
                        border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
                        opacity: order.status === 'PAID' ? 0.7 : 1,
                      }}
                    >
                      {/* Order Header - Redesigned for Mobile */}
                      <div
                        className="flex items-start justify-between gap-2"
                        style={{
                          padding: `${DESIGN_TOKENS.spacing.md}px ${DESIGN_TOKENS.spacing.md}px`,
                          backgroundColor: DESIGN_TOKENS.colors.white,
                          borderBottom: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
                        }}
                      >
                        {/* Left: Icon + Order Info + Status */}
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Status Icon */}
                          <div className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 18 }}>
                            {config.icon}
                          </div>

                          {/* Order Info Stack */}
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            {/* Order Number + Status Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text
                                strong
                                className="leading-tight"
                                style={{
                                  fontSize: DESIGN_TOKENS.fontSize.md,
                                  color: DESIGN_TOKENS.colors.text
                                }}
                              >
                                Đơn hàng #{order.id}
                              </Text>
                              <Tag
                                color={config.color}
                                className="m-0 font-medium"
                                style={{
                                  borderRadius: DESIGN_TOKENS.radius.sm,
                                  fontSize: DESIGN_TOKENS.fontSize.xs,
                                  padding: "1px 6px",
                                  lineHeight: "18px",
                                }}
                              >
                                {config.label}
                              </Tag>
                            </div>
                          </div>
                        </div>

                        {/* Right: Time + Action Buttons */}
                        {order.status === 'NEW' && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Text
                              type="secondary"
                              style={{ fontSize: DESIGN_TOKENS.fontSize.xs }}
                            >
                              {formatTime(order.created_at)}
                            </Text>
                            <Button
                              type="text"
                              danger
                              size="small"
                              onClick={() => handleCancelOrder(order.id)}
                              className="flex items-center justify-center hover:bg-red-50"
                              style={{
                                padding: '4px 8px',
                                fontSize: DESIGN_TOKENS.fontSize.sm,
                                fontWeight: 500,
                                height: 'auto',
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        )}

                        {/* Right: Review Button for IN_PROGRESS and PAID orders */}
                        {(order.status === 'IN_PROGRESS' || order.status === 'PAID') && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => navigate('/cus/reviews', {
                                state: { orderIds: [order.id] }
                              })}
                              className="flex items-center justify-center"
                              style={{
                                padding: '4px 10px',
                                fontSize: DESIGN_TOKENS.fontSize.xs,
                                fontWeight: 500,
                                height: 'auto',
                                background: order.status === 'PAID'
                                  ? `linear-gradient(135deg, ${DESIGN_TOKENS.colors.success} 0%, #73d13d 100%)`
                                  : `linear-gradient(135deg, ${DESIGN_TOKENS.colors.warning} 0%, #ff9800 100%)`,
                                border: 'none',
                                borderRadius: DESIGN_TOKENS.radius.sm,
                                boxShadow: order.status === 'PAID'
                                  ? '0 2px 6px rgba(82, 196, 26, 0.25)'
                                  : '0 2px 6px rgba(250, 140, 22, 0.25)',
                              }}
                            >
                              Đánh giá
                            </Button>
                          </div>
                        )}
                      </div>                      {/* Order Items List - New 3-Column Layout */}
                      <div style={{ padding: `${DESIGN_TOKENS.spacing.sm}px ${DESIGN_TOKENS.spacing.md}px` }}>
                        {[...(order.items || [])].reverse()
                          .slice(0, isExpanded ? order.items.length : 1)
                          .map((item, index, array) => (
                            <div
                              key={item.id}
                              className="relative" // For absolute positioned note
                              style={{
                                // Add extra paddingBottom if note exists
                                paddingBottom: index < array.length - 1 ? (item.note ? 32 : DESIGN_TOKENS.spacing.sm) : (item.note ? 32 : 0),
                                marginBottom: index < array.length - 1 ? DESIGN_TOKENS.spacing.sm : 0,
                                borderBottom: index < array.length - 1 ? `1px dashed ${DESIGN_TOKENS.colors.borderLight}` : "none",
                              }}
                            >
                              <div className="flex gap-2.5">
                                {/* Left Column: Item Image */}
                                <img
                                  src={item.image_url || "https://via.placeholder.com/70"}
                                  alt={item.menu_item_name}
                                  className="flex-shrink-0 object-cover"
                                  style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: DESIGN_TOKENS.radius.md,
                                    border: `1px solid ${DESIGN_TOKENS.colors.border}`,
                                  }}
                                />

                                {/* Middle Column: Name & Unit Price */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                  <Text
                                    strong
                                    className="line-clamp-2"
                                    style={{
                                      fontSize: DESIGN_TOKENS.fontSize.md,
                                      lineHeight: "1.4",
                                      color: DESIGN_TOKENS.colors.text,
                                    }}
                                  >
                                    {item.menu_item_name}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: DESIGN_TOKENS.fontSize.sm }}
                                  >
                                    {formatPrice(item.unit_price)}đ
                                  </Text>
                                </div>

                                {/* Right Column: Total Price & Quantity Controls */}
                                <div className="flex flex-col items-end justify-center gap-2">
                                  <Text
                                    strong
                                    className="font-semibold"
                                    style={{
                                      fontSize: DESIGN_TOKENS.fontSize.lg,
                                      color: DESIGN_TOKENS.colors.primary,
                                    }}
                                  >
                                    {formatPrice(item.unit_price * item.quantity)}đ
                                  </Text>
                                  {order.status === 'NEW' ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<MinusOutlined />}
                                        onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                        className="flex items-center justify-center"
                                        style={{
                                          width: 24,
                                          height: 24,
                                          fontSize: 12,
                                          padding: 0,
                                          color: item.quantity <= 1 ? '#d9d9d9' : DESIGN_TOKENS.colors.text,
                                        }}
                                      />
                                      <Text
                                        strong
                                        style={{
                                          minWidth: 24,
                                          fontSize: DESIGN_TOKENS.fontSize.base,
                                          color: DESIGN_TOKENS.colors.text,
                                          textAlign: 'center',
                                        }}
                                      >
                                        {item.quantity}
                                      </Text>
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity + 1)}
                                        className="flex items-center justify-center"
                                        style={{
                                          width: 24,
                                          height: 24,
                                          fontSize: 12,
                                          padding: 0,
                                          color: DESIGN_TOKENS.colors.text,
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: DESIGN_TOKENS.fontSize.sm, height: 24, display: 'flex', alignItems: 'center' }}
                                    >
                                      x {item.quantity}
                                    </Text>
                                  )}
                                </div>
                              </div>

                              {/* Note (if exists) - Positioned absolutely at the bottom */}
                              {item.note && (
                                <div
                                  className="absolute bottom-0 left-0 w-full"
                                  style={{ paddingLeft: 70 + DESIGN_TOKENS.spacing.sm }} // Align with info columns
                                >
                                  <div
                                    className="inline-block"
                                    style={{
                                      padding: `2px ${DESIGN_TOKENS.spacing.sm}px`,
                                      borderRadius: DESIGN_TOKENS.radius.sm,
                                      background: "#ffffffff",
                                    }}
                                  >
                                    <Text style={{ fontSize: DESIGN_TOKENS.fontSize.xs, color: "#6e6751ff" }}>
                                      💬 {item.note}
                                    </Text>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                        {/* Show More / Show Less Button */}
                        {order.items && order.items.length > 1 && (
                          <div
                            onClick={() => toggleOrderExpand(order.id)}
                            className="flex items-center justify-center gap-1 text-center font-medium cursor-pointer"
                            style={{
                              marginTop: DESIGN_TOKENS.spacing.sm,
                              padding: `${DESIGN_TOKENS.spacing.sm}px 0`,
                              color: DESIGN_TOKENS.colors.primary,
                              fontSize: DESIGN_TOKENS.fontSize.md,
                              borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
                            }}
                          >
                            <span style={{ fontSize: DESIGN_TOKENS.fontSize.xs }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                            <span>
                              {isExpanded ? "Thu gọn" : "Xem thêm"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Order Footer - Clean & Minimal */}
                      <div
                        className="flex justify-between items-center"
                        style={{
                          padding: `${DESIGN_TOKENS.spacing.sm}px ${DESIGN_TOKENS.spacing.md}px`,
                          background: "#fafafa",
                          borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{ fontSize: DESIGN_TOKENS.fontSize.sm }}
                        >
                          {order.totalItems} món
                        </Text>
                        <div className="flex items-baseline gap-1">
                          <Text
                            type="secondary"
                            style={{ fontSize: DESIGN_TOKENS.fontSize.sm }}
                          >
                            Tổng:
                          </Text>
                          <Text
                            strong
                            className="font-semibold"
                            style={{
                              fontSize: DESIGN_TOKENS.fontSize.lg,
                              color: DESIGN_TOKENS.colors.primary,
                            }}
                          >
                            {formatPrice(order.totalPrice)}đ
                          </Text>
                        </div>
                      </div>

                      {/* Progress Bar - Minimal indicator */}
                      <div
                        className="h-0.5 transition-all duration-500"
                        style={{
                          width: `${config.progress}%`,
                          background:
                            order.status === "NEW" ? DESIGN_TOKENS.colors.info :
                              order.status === "IN_PROGRESS" ? DESIGN_TOKENS.colors.warning :
                                DESIGN_TOKENS.colors.success,
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
      {/* Chỉ hiển thị khi có đơn đã xác nhận chưa thanh toán */}
      {confirmedOrders.length > 0 && (
        <div
          className="fixed bottom-[60px] left-0 right-0 z-[1000] bg-white animate-slide-up"
          style={{
            padding: `${DESIGN_TOKENS.spacing.sm}px ${DESIGN_TOKENS.spacing.md}px`,
            borderTop: `2px solid ${DESIGN_TOKENS.colors.borderLight}`,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: Total Info */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <Text
                  strong
                  className="font-semibold"
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.xl,
                    color: DESIGN_TOKENS.colors.primary
                  }}
                >
                  {formatPrice(totalPrice)}đ
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: DESIGN_TOKENS.fontSize.md }}
                >
                  ({totalQty} món)
                </Text>
              </div>
            </div>

            {/* Right: Payment Button */}
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/cus/payment', {
                state: {
                  totalPrice,
                  unpaidOrders: confirmedOrders
                }
              })}
              className="flex-shrink-0 font-semibold"
              style={{
                fontSize: DESIGN_TOKENS.fontSize.lg,
                height: DESIGN_TOKENS.touchTarget.min,
                paddingLeft: DESIGN_TOKENS.spacing.lg,
                paddingRight: DESIGN_TOKENS.spacing.lg,
                background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary} 0%, ${DESIGN_TOKENS.colors.primaryLight} 100%)`,
                border: "none",
                borderRadius: DESIGN_TOKENS.radius.xl,
                boxShadow: `0 4px 12px rgba(34, 101, 51, 0.3)`,
              }}
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
        <div className="text-center" style={{ padding: `${DESIGN_TOKENS.spacing.lg}px ${DESIGN_TOKENS.spacing.sm}px` }}>
          <div
            className="animate-bounce mx-auto flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: DESIGN_TOKENS.radius.full,
            }}
          >
            <SmileOutlined style={{ fontSize: 40, color: DESIGN_TOKENS.colors.white }} />
          </div>

          <Title
            level={3}
            className="mb-2"
            style={{ color: DESIGN_TOKENS.colors.primary }}
          >
            Cảm ơn bạn! 🎉
          </Title>
          <Text
            className="block mb-6"
            style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              color: DESIGN_TOKENS.colors.textSecondary
            }}
          >
            Cảm ơn bạn đã lựa chọn <b style={{ color: DESIGN_TOKENS.colors.primary }}>Phương Nam</b>
            <br />
            Hãy đánh giá để chúng tôi phục vụ tốt hơn nhé! ⭐
          </Text>

          <div className="flex gap-3">
            <Button
              type="primary"
              size="large"
              block
              onClick={() => {
                // ✅ Pass all confirmed order IDs for review
                const confirmedOrderIds = confirmedOrders.map(o => o.id);
                navigate("/cus/reviews", {
                  state: { orderIds: confirmedOrderIds }
                });
              }}
              className="font-semibold"
              style={{
                height: 48,
                fontSize: DESIGN_TOKENS.fontSize.xl,
                background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary} 0%, ${DESIGN_TOKENS.colors.primaryLight} 100%)`,
                border: "none",
                borderRadius: DESIGN_TOKENS.radius.lg,
              }}
            >
              ⭐ Đánh giá ngay
            </Button>
            <Button
              size="large"
              block
              onClick={() => navigate("/cus/homes")}
              className="font-semibold"
              style={{
                height: 48,
                fontSize: DESIGN_TOKENS.fontSize.xl,
                borderRadius: DESIGN_TOKENS.radius.lg,
              }}
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
