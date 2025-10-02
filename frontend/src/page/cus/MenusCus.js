import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import QRProcessingStatus from "../../components/QRProcessingStatus";
import { useQRHandler } from "../../hooks/useQRHandler";
import { useSession } from "../../contexts/SessionContext";
import {
  Layout,
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
  notification
} from "antd";
import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import axios from "axios";
import Slider from "react-slick";
import { addToCart } from "../../redux/slices/cartSlice";
import { useDispatch } from "react-redux";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// CSS-in-JS styles for better performance
const styles = {
  loadingCard: {
    borderRadius: 16,
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
    minHeight: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
  }
};
export default function CustomerMenuPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { session, isAuthenticated } = useSession();

  // QR Handler cho auto-processing QR parameters
  const { isProcessing, qrError } = useQRHandler({
    redirectPath: '/cus/homes',
    autoRedirect: false, // Stay on menu page after QR processing
    onSuccess: (sessionData) => {
      notification.success({
        message: 'QR Code thành công!',
        description: `Chào mừng đến ${sessionData.table_number}`,
        duration: 3
      });
    },
    onError: (error) => {
      notification.error({
        message: 'Lỗi QR Code',
        description: error.message || 'Không thể xử lý QR Code',
        duration: 5
      });
    }
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State để track scroll
  // GET items
  async function callApiMenuCus(url) {
    try {
      setLoading(true);
      const response = await axios.get(url);
      console.log("API GET menu/cus/menus", response.data);
      setFoods(response.data.data);
    } catch (err) {
      console.error("API GET error:", err);
      setFoods([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  // GET categories
  async function callApiMenuCategoriesCus(url) {
    try {
      const response = await axios.get(url);
      console.log("API GET menu/cus/menus/categories:", response.data);
      setCategories(response.data.data);
    } catch (err) {
      console.error("API GET error:", err);
    }
  }

  // Search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim() !== "") {
        setIsSearching(true);
        setSelectedCategory("all"); // Reset category when searching
        callApiMenuCus(
          `${REACT_APP_API_URL}/menu/cus/menus/${encodeURIComponent(searchText.trim())}`
        );
      } else {
        // Khi xóa search text, trở về hiển thị tất cả hoặc category đã chọn
        setIsSearching(false);
        if (selectedCategory === "all") {
          callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`);
        } else {
          callApiMenuByCategory(selectedCategory);
        }
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(delayDebounce);
  }, [searchText]);
  //GET items by category
  async function callApiMenuByCategory(id) {
    try {
      setLoading(true);
      setSearchText(""); // Clear search when selecting category
      setIsSearching(false);
      const response = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/category/${id}`);
      setFoods(response.data.data);
    } catch (err) {
      console.error("API GET error:", err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }

  // Load all items when category is "all"
  async function loadAllItems() {
    try {
      setLoading(true);
      setSearchText(""); // Clear search
      setIsSearching(false);
      await callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`);
    } catch (err) {
      console.error("Load all items error:", err);
    }
  }
  useEffect(() => {
    callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`);
    callApiMenuCategoriesCus(`${REACT_APP_API_URL}/menu/cus/menus/categories`);
  }, []);

  // Track scroll để làm sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 80); // Fixed khi scroll > 80px
    };

    // Throttle scroll event để tối ưu performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  const handleSetCart = (food) => {
    const tableId = JSON.parse(sessionStorage.getItem("tableId"));
    const order = JSON.parse(sessionStorage.getItem("order")) || { orderId: tableId, foodOrderList: [] };
    if (tableId) {
      if (order.foodOrderList.some(item => item.id === food.id)) {
        // nếu đã có món trong giỏ, tăng số lượng
        order.foodOrderList = order.foodOrderList.map(item => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {

        // nếu chưa có món trong giỏ, thêm mới
        order.foodOrderList.push({ ...food, quantity: 1 });
      }
      sessionStorage.setItem("order", JSON.stringify({ orderId: tableId, foodOrderList: order.foodOrderList }));
    }
    dispatch(addToCart(order));
  }
  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* -------- STICKY HEADER -------- */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isScrolled ? "rgba(255, 255, 255, 0.95)" : "#fff",
          backdropFilter: isScrolled ? "blur(10px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(10px)" : "none", // Safari support
          boxShadow: isScrolled ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
          transition: "all 0.3s ease",
          borderBottom: isScrolled ? "1px solid rgba(34, 101, 51, 0.1)" : "none",
        }}
      >
        {/* Logo Header */}
        <Header
          style={{
            background: "transparent",
            textAlign: "center",
            padding: isScrolled ? "8px" : "12px 8px",
            height: "auto",
            lineHeight: "normal",
            transition: "padding 0.3s ease",
          }}
        >
          <img
            src="/assets/images/Logo.png"
            alt="logo"
            style={{
              height: isScrolled ? 40 : 50,
              marginBottom: isScrolled ? 2 : 4,
              transition: "height 0.3s ease, margin 0.3s ease"
            }}
          />
          <Title
            level={5}
            style={{
              margin: 0,
              fontWeight: "bold",
              color: "#226533",
              fontSize: isScrolled ? 14 : 16,
              transition: "font-size 0.3s ease"
            }}
          >
            Nhà hàng Phương Nam
          </Title>
        </Header>

        {/* Search Bar - Always in sticky header */}
        <div style={{ padding: "0 12px 12px 12px" }}>
          <Input
            placeholder={isSearching ? "Đang tìm kiếm..." : "Tìm món ăn, đồ uống..."}
            prefix={<SearchOutlined style={{ color: isSearching ? "#226533" : "#7f8c8d" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              borderRadius: 24,
              height: isScrolled ? 40 : 44,
              fontSize: 16,
              border: `2px solid ${isSearching ? "#226533" : "#ecf0f1"}`,
              boxShadow: isSearching
                ? "0 4px 12px rgba(34, 101, 51, 0.15)"
                : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#226533";
              e.target.style.boxShadow = "0 4px 12px rgba(34, 101, 51, 0.15)";
            }}
            onBlur={(e) => {
              if (!isSearching) {
                e.target.style.borderColor = "#ecf0f1";
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }
            }}
            suffix={
              searchText && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => setSearchText("")}
                  style={{
                    color: "#7f8c8d",
                    minWidth: "auto",
                    padding: "0 4px"
                  }}
                >
                  ✕
                </Button>
              )
            }
          />
        </div>
      </div>

      {/* -------- CONTENT với top padding để không bị che -------- */}
      <Content style={{
        padding: "12px",
        paddingBottom: "90px",
        paddingTop: isScrolled ? "120px" : "140px", // Responsive padding based on scroll
        transition: "padding-top 0.3s ease"
      }}>

        {/* Bộ lọc category */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12, color: "#2c3e50" }}>
            Danh mục món ăn
          </Title>
          <Slider
            dots={false}
            infinite={false}
            variableWidth={true}
            swipeToSlide={true}
            arrows={false}
          >
            {/* Button "Tất cả" */}
            <div style={{ padding: "0 6px" }}>
              <Button
                type={selectedCategory === "all" ? "primary" : "default"}
                shape="round"
                size="middle"
                onClick={() => {
                  setSelectedCategory("all");
                  loadAllItems();
                }}
                style={{
                  whiteSpace: "nowrap",
                  padding: "0 20px",
                  height: "36px",
                  fontSize: "14px",
                  fontWeight: selectedCategory === "all" ? "600" : "400",
                  background: selectedCategory === "all"
                    ? "linear-gradient(135deg, #226533, #2d8f47)"
                    : "#fff",
                  borderColor: selectedCategory === "all" ? "transparent" : "#d9d9d9",
                  boxShadow: selectedCategory === "all"
                    ? "0 2px 8px rgba(34, 101, 51, 0.2)"
                    : "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                Tất cả
              </Button>
            </div>

            {/* Categories từ API */}
            {categories.map((cat) => (
              <div key={cat.id} style={{ padding: "0 6px" }}>
                <Button
                  type={selectedCategory === cat.id ? "primary" : "default"}
                  shape="round"
                  size="middle"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    callApiMenuByCategory(cat.id);
                  }}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0 20px",
                    height: "36px",
                    fontSize: "14px",
                    fontWeight: selectedCategory === cat.id ? "600" : "400",
                    background: selectedCategory === cat.id
                      ? "linear-gradient(135deg, #226533, #2d8f47)"
                      : "#fff",
                    borderColor: selectedCategory === cat.id ? "transparent" : "#d9d9d9",
                    boxShadow: selectedCategory === cat.id
                      ? "0 2px 8px rgba(34, 101, 51, 0.2)"
                      : "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {cat.name}
                </Button>
              </div>
            ))}
          </Slider>
        </div>

        {/* Danh sách món ăn */}
        {loading ? (
          // Loading skeleton
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={i}>
                <Card loading style={styles.loadingCard} />
              </Col>
            ))}
          </Row>
        ) : foods.length === 0 ? (
          // Empty state with different messages for search vs general
          <div style={styles.emptyState}>
            <Title level={4} style={{ color: "#95a5a6" }}>
              {isSearching || searchText.trim() !== ""
                ? `Không tìm thấy món ăn với từ khóa "${searchText}"`
                : "Không có món ăn nào"
              }
            </Title>
            <Text style={{ color: "#7f8c8d" }}>
              {isSearching || searchText.trim() !== ""
                ? "Hãy thử tìm kiếm với từ khóa khác"
                : "Hãy chọn danh mục khác hoặc liên hệ nhà hàng"
              }
            </Text>
            {(isSearching || searchText.trim() !== "") && (
              <Button
                type="link"
                onClick={() => setSearchText("")}
                style={{
                  marginTop: 12,
                  color: "#226533",
                  fontWeight: "500"
                }}
              >
                Xóa tìm kiếm và xem tất cả món
              </Button>
            )}
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {foods.map((food) => (
              <Col xs={24} md={12} lg={8} xl={6} key={food.id}>
                <Card
                  hoverable
                  className="food-card"
                  cover={
                    <div style={{ position: "relative", overflow: "hidden" }}>
                      <img
                        alt={food.name}
                        src={food.image_url || "/assets/images/no-image.png"}
                        style={{
                          width: "100%",
                          height: 180,
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                          borderRadius: "8px 8px 0 0",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = "scale(1)";
                        }}
                      />
                      {/* Badge giảm giá hoặc hot */}
                      {food.is_featured && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "linear-gradient(45deg, #ff6b6b, #ee5a52)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          }}
                        >
                          HOT
                        </div>
                      )}
                    </div>
                  }
                  onClick={() => navigate(`/food/${food.id}`, { state: food })}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                  }}
                  bodyStyle={{ padding: "16px" }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Title
                      level={5}
                      style={{
                        marginBottom: 6,
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#2c3e50",
                        lineHeight: "1.3",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {food.name}
                    </Title>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                      gap: 8
                    }}>
                      <Text
                        strong
                        style={{
                          color: "#e74c3c",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {Number(food.price).toLocaleString()}đ
                      </Text>
                      {/* Hiển thị giá gốc nếu có giảm giá */}
                      {food.original_price && food.original_price > food.price && (
                        <Text
                          delete
                          style={{
                            color: "#95a5a6",
                            fontSize: 14
                          }}
                        >
                          {Number(food.original_price).toLocaleString()}đ
                        </Text>
                      )}
                    </div>

                    <Text
                      style={{
                        fontSize: 13,
                        color: "#7f8c8d",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: 36,
                      }}
                    >
                      {food.description || "Món ăn ngon, được nhiều khách hàng yêu thích"}
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    block
                    size="middle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCart(food);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #226533, #2d8f47)",
                      border: "none",
                      borderRadius: 12,
                      height: 42,
                      fontWeight: 600,
                      fontSize: 14,
                      boxShadow: "0 4px 12px rgba(34, 101, 51, 0.25)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 6px 16px rgba(34, 101, 51, 0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(34, 101, 51, 0.25)";
                    }}
                  >
                    Thêm vào giỏ
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>

      {/* QR Processing Status */}
      {(isProcessing || qrError) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <QRProcessingStatus
            isProcessing={isProcessing}
            error={qrError}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Footer giỏ hàng */}
      <CustomerFooterNav />
    </Layout>
  );
}
