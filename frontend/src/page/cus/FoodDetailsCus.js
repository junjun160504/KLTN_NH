import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layout,
  Typography,
  Rate,
  Button,
  Skeleton,
  Empty,
  Modal,
  Input,
  Tag,
  App,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import CustomerFooterNav from "../../components/CustomerFooterNav";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// Helper function: Mask phone number (show first 3 and last 3 digits)
const maskPhone = (phone) => {
  if (!phone || phone.length < 10) return null;
  return `${phone.slice(0, 3)}xxxx${phone.slice(-3)}`;
};

// Helper function: Generate random customer ID
const generateCustomerId = (reviewId) => {
  return `Khách hàng #${String(reviewId).padStart(4, '0')}`;
};

export default function FoodDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { message } = App.useApp(); // ✅ Use App hook for message

  // Redux cart
  const order = useSelector((state) => state.cart.order);
  const cartCount = order?.foodOrderList?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // State
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch menu item detail
  useEffect(() => {
    const fetchMenuDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${REACT_APP_API_URL}/menu/cus/menus/item/${id}`
        );
        setMenuItem(response.data.data);
      } catch (error) {
        console.error("Error fetching menu detail:", error);
        message.error("Không thể tải thông tin món ăn!");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuDetail();
    window.scrollTo(0, 0);
  }, [id, message]); // ✅ Add message to dependencies

  // Handle add to cart
  const handleAddToCart = () => {
    if (!menuItem) return;

    // Get existing order from sessionStorage
    const savedOrder = JSON.parse(sessionStorage.getItem("order")) || {
      orderId: null,
      foodOrderList: [],
    };

    // Check if item already exists in cart
    const existingItemIndex = savedOrder.foodOrderList.findIndex(
      (item) => item.id === menuItem.id && item.note === note
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists with same note
      savedOrder.foodOrderList[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      savedOrder.foodOrderList.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity,
        note: note || "",
        image_url: menuItem.image_url || "https://source.unsplash.com/80x80/?food",
      });
    }

    // Save to sessionStorage
    sessionStorage.setItem("order", JSON.stringify(savedOrder));

    // Dispatch to Redux
    dispatch(addToCart(savedOrder));

    message.success({
      content: `Đã thêm vào giỏ hàng!`,
      duration: 2,
    });

    setShowAddToCartModal(false);
    setQuantity(1);
    setNote("");
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#fff" }}>
        <Skeleton.Image
          active
          style={{ width: "100%", height: 360 }}
        />
        <div style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </Layout>
    );
  }

  // Render empty state
  if (!menuItem) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ padding: 16, paddingTop: 100 }}>
          <Empty description="Món ăn không tồn tại" />
          <Button
            type="primary"
            block
            onClick={() => navigate("/cus/menus")}
            style={{ marginTop: 16 }}
          >
            Quay lại Menu
          </Button>
        </div>
      </Layout>
    );
  }

  const { reviews } = menuItem;
  const hasReviews = reviews && reviews.total > 0;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* ========== FLOATING HEADER ========== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          zIndex: 1000,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#333" }} />}
          onClick={() => navigate(-1)}
          style={{ width: 40, height: 40 }}
        />

        <Title level={5} style={{ margin: 0, color: "#226533", fontWeight: 600 }}>
          Chi tiết món
        </Title>

        <div style={{ width: 40 }}></div>
      </div>

      {/* ========== CONTENT ========== */}
      <Content style={{ paddingTop: 64, paddingBottom: 130 }}>
        {/* ===== HERO IMAGE - FULL WIDTH ===== */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 280,
            background: "linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)",
            overflow: "hidden",
          }}
        >
          <img
            src={menuItem.image_url || "https://via.placeholder.com/400x280?text=No+Image"}
            alt={menuItem.name}
            onLoad={() => setImageLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.5s ease-in-out",
            }}
          />

          {/* Availability Badge */}
          {!menuItem.is_available && (
            <div
              style={{
                position: "absolute",
                top: 70,
                left: 16,
                background: "rgba(255, 77, 79, 0.95)",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 12px rgba(255, 77, 79, 0.4)",
              }}
            >
              Hết món
            </div>
          )}
        </div>

        {/* ===== INFO SECTION ===== */}
        <div
          style={{
            background: "#fff",
            padding: "20px 16px",
          }}
        >
          {/* Category Tag */}
          {menuItem.category && (
            <Tag
              style={{
                border: "none",
                background: "#e6f7ed",
                color: "#226533",
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              {menuItem.category.name}
            </Tag>
          )}

          {/* Name */}
          <Title
            level={3}
            style={{
              margin: "0 0 8px 0",
              fontSize: 22,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.3,
            }}
          >
            {menuItem.name}
          </Title>

          {/* Description */}
          {menuItem.description && (
            <div className="mb-3">
              <p
                className={`text-sm text-gray-600 text-justify leading-relaxed ${isDescriptionExpanded ? "" : "line-clamp-3"
                  }`}
              >
                {menuItem.description}
              </p>
              {menuItem.description.length > 100 && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-gray-500 focus:no-underline text-xs font-medium hover:underline border-none bg-transparent p-0"
                  >
                    {isDescriptionExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stats Row: Rating & Reviews */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {hasReviews ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Rate
                    disabled
                    value={reviews.average_rating}
                    allowHalf
                    style={{ fontSize: 14, color: "#faad14" }}
                  />
                </div>
                <Text style={{ fontSize: 15, color: "#333", fontWeight: 600 }}>
                  {reviews.average_rating}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  ({reviews.total} đánh giá)
                </Text>
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Chưa có đánh giá
              </Text>
            )}
          </div>

          {/* Price & Quantity Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 0,
            }}
          >
            {/* Price */}
            <Text
              strong
              style={{
                fontSize: 22,
                color: "#226533",
                fontWeight: 700,
              }}
            >
              {Number(menuItem.price).toLocaleString('vi-VN')}đ
            </Text>

            {/* Quantity Selector */}
            {menuItem.is_available && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#f5f5f5",
                  padding: "6px 12px",
                  borderRadius: 20,
                }}
              >
                <Button
                  type="text"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    minWidth: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: quantity <= 1 ? "#d9d9d9" : "#226533",
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                >
                  −
                </Button>
                <Text strong style={{ fontSize: 16, minWidth: 24, textAlign: "center", color: "#226533" }}>
                  {quantity}
                </Text>
                <Button
                  type="text"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    minWidth: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#226533",
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                >
                  +
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ===== DIVIDER ===== */}
        <div
          style={{
            height: 8,
            background: "#f5f5f5",
          }}
        />

        {/* ===== COMMENTS SECTION ===== */}
        <div
          style={{
            background: "#fff",
            padding: "16px",
          }}
        >
          <Title
            level={5}
            style={{
              margin: "0 0 16px 0",
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            Bình luận
          </Title>

          {/* Reviews List */}
          {hasReviews && reviews.recent_reviews && reviews.recent_reviews.length > 0 ? (
            reviews.recent_reviews.map((review, index) => (
              <div
                key={review.id}
                style={{
                  padding: "16px 0",
                  borderBottom: index < reviews.recent_reviews.length - 1 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#f56a00",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserOutlined style={{ color: "#fff", fontSize: 18 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>
                      {review.customer_phone
                        ? maskPhone(review.customer_phone)
                        : generateCustomerId(review.id)
                      }
                    </Text>
                    <Rate
                      disabled
                      value={review.rating}
                      style={{ fontSize: 14, color: "#faad14" }}
                    />
                  </div>
                </div>

                {review.comment && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#666",
                      lineHeight: 1.6,
                      display: "block",
                      marginLeft: 52,
                    }}
                  >
                    {review.comment}
                  </Text>
                )}

                {review.images && review.images.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      marginLeft: 52,
                    }}
                  >
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="review"
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ))}
                  </div>
                )}

                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    display: "block",
                    marginTop: 8,
                    marginLeft: 52,
                  }}
                >
                  {new Date(review.created_at).toLocaleDateString("vi-VN")}
                </Text>
              </div>
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có bình luận nào"
              style={{ margin: "20px 0" }}
            />
          )}
        </div>
      </Content>

      {/* ========== FIXED BOTTOM ACTION ========== */}
      <div
        style={{
          position: "fixed",
          bottom: 60,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "2px solid #f0f0f0",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          zIndex: 999,
        }}
      >
        <Button
          type="primary"
          size="large"
          disabled={!menuItem.is_available}
          onClick={() => setShowAddToCartModal(true)}
          block
          style={{
            height: 44,
            fontSize: 15,
            fontWeight: 600,
            background: menuItem.is_available
              ? "linear-gradient(135deg, #226533 0%, #2d8e47 100%)"
              : "#d9d9d9",
            border: "none",
            borderRadius: 10,
            boxShadow: menuItem.is_available
              ? "0 4px 12px rgba(34, 101, 51, 0.3)"
              : "none",
          }}
        >
          {menuItem.is_available ? "🛒 Thêm vào giỏ" : "Hết món"}
        </Button>
      </div>

      {/* Customer Footer Navigation */}
      <CustomerFooterNav cartCount={cartCount} />

      {/* ========== ADD TO CART MODAL ========== */}
      <Modal
        title={null}
        open={showAddToCartModal}
        onCancel={() => {
          setShowAddToCartModal(false);
          setQuantity(1);
          setNote("");
        }}
        footer={null}
        centered
        width="90%"
        style={{ maxWidth: 400 }}
      >
        <div style={{ padding: "8px 0" }}>
          <Title level={4} style={{ marginBottom: 16, fontSize: 18 }}>
            Thêm vào giỏ hàng
          </Title>

          {/* Product Info */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <img
              src={menuItem.image_url}
              alt={menuItem.name}
              style={{
                width: 70,
                height: 70,
                objectFit: "cover",
                borderRadius: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            />
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                {menuItem.name}
              </Text>
              <Text
                strong
                style={{
                  fontSize: 16,
                  color: "#226533",
                  fontWeight: 700,
                }}
              >
                {Number(menuItem.price).toLocaleString('vi-VN')}đ
              </Text>
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={{ marginBottom: 16 }}>
            <Text style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              Số lượng
            </Text>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: "#f5f7fa",
                padding: "4px 6px",
                borderRadius: 8,
                border: "1px solid #e8e8e8",
                width: "fit-content",
              }}
            >
              <Button
                size="small"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{
                  width: 26,
                  height: 26,
                  padding: 0,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "#fff",
                  color: quantity <= 1 ? "#d9d9d9" : "#ff4d4f",
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                −
              </Button>
              <div
                style={{
                  minWidth: 36,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#226533",
                  padding: "0 8px",
                }}
              >
                {quantity}
              </div>
              <Button
                size="small"
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: 26,
                  height: 26,
                  padding: 0,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "#fff",
                  color: "#226533",
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                +
              </Button>
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 20 }}>
            <Text style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              Ghi chú (tùy chọn)
            </Text>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít đường, không đá..."
              rows={3}
              maxLength={200}
              showCount
              style={{ borderRadius: 8, fontSize: 12 }}
            />
          </div>

          {/* Total & Add Button */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                padding: "12px 16px",
                background: "#f5f7fa",
                borderRadius: 8,
              }}
            >
              <Text strong style={{ fontSize: 14 }}>Tổng cộng</Text>
              <Text
                strong
                style={{
                  fontSize: 18,
                  color: "#226533",
                  fontWeight: 700,
                }}
              >
                {Number(menuItem.price * quantity).toLocaleString('vi-VN')}đ
              </Text>
            </div>

            <Button
              type="primary"
              size="large"
              block
              onClick={handleAddToCart}
              style={{
                height: 44,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 10,
                background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(34, 101, 51, 0.3)",
              }}
            >
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
