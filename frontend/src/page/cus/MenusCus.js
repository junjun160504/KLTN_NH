import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import { useSession } from "../../contexts/SessionContext";
import {
  Layout,
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
  App
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
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
  const { session } = useSession();
  const { message } = App.useApp(); // ✅ Use hook instead of static method

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState(() => {
    // ✅ Initialize from sessionStorage if available
    const cachedFoods = sessionStorage.getItem('menu_foods_cache');
    return cachedFoods ? JSON.parse(cachedFoods) : [];
  });
  const [categories, setCategories] = useState(() => {
    // ✅ Initialize from sessionStorage if available
    const cachedCategories = sessionStorage.getItem('menu_categories_cache');
    return cachedCategories ? JSON.parse(cachedCategories) : [];
  });
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ GET items - Wrapped in useCallback to prevent re-creation
  const callApiMenuCus = useCallback(async (url, skipCache = false, isBackground = false) => {
    try {
      // Only show loading skeleton if not background fetch
      if (!isBackground) {
        setLoading(true);
      }
      const response = await axios.get(url);
      console.log("API GET menu/cus/menus", response.data);
      const foodsData = response.data.data;

      // ✅ Smart comparison: Only update state if data changed
      const cachedFoods = sessionStorage.getItem('menu_foods_cache');
      const hasDataChanged = !cachedFoods || JSON.stringify(foodsData) !== cachedFoods;

      if (hasDataChanged) {
        console.log('🔄 Menu data changed, updating state');
        setFoods(foodsData);

        // Cache only "all items" (not search results)
        if (!skipCache && url.includes('/menus/all')) {
          sessionStorage.setItem('menu_foods_cache', JSON.stringify(foodsData));
          sessionStorage.setItem('menu_cache_timestamp', Date.now().toString());
        }
      } else {
        console.log('✅ Menu data unchanged, skipping re-render');
        // Still update timestamp to keep cache fresh
        if (!skipCache && url.includes('/menus/all')) {
          sessionStorage.setItem('menu_cache_timestamp', Date.now().toString());
        }
      }
    } catch (err) {
      console.error("API GET error:", err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ GET categories - Wrapped in useCallback
  const callApiMenuCategoriesCus = useCallback(async (url, isBackground = false) => {
    try {
      const response = await axios.get(url);
      console.log("API GET menu/cus/menus/categories:", response.data);
      const categoriesData = response.data.data;

      // ✅ Smart comparison: Only update state if data changed
      const cachedCategories = sessionStorage.getItem('menu_categories_cache');
      const hasDataChanged = !cachedCategories || JSON.stringify(categoriesData) !== cachedCategories;

      if (hasDataChanged) {
        console.log('🔄 Categories data changed, updating state');
        setCategories(categoriesData);
        sessionStorage.setItem('menu_categories_cache', JSON.stringify(categoriesData));
      } else {
        console.log('✅ Categories data unchanged, skipping re-render');
      }
    } catch (err) {
      console.error("API GET error:", err);
    }
  }, []);

  // ✅ GET items by category - Wrapped in useCallback
  const callApiMenuByCategory = useCallback(async (id) => {
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
  }, []);

  // ✅ Search with debounce - Use useRef for latest selectedCategory
  const selectedCategoryRef = useRef(selectedCategory);
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // Search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim() !== "") {
        setIsSearching(true);
        setSelectedCategory("all"); // Reset category when searching
        callApiMenuCus(
          `${REACT_APP_API_URL}/menu/cus/menus/${encodeURIComponent(searchText.trim())}`,
          true // ✅ Skip cache for search results
        );
      } else {
        // Khi xóa search text, trở về hiển thị tất cả hoặc category đã chọn
        setIsSearching(false);
        const currentCategory = selectedCategoryRef.current;
        if (currentCategory === "all") {
          // ✅ Load from cache if available
          const cachedFoods = sessionStorage.getItem('menu_foods_cache');
          if (cachedFoods) {
            setFoods(JSON.parse(cachedFoods));
          } else {
            callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`);
          }
        } else {
          callApiMenuByCategory(currentCategory);
        }
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(delayDebounce);
  }, [searchText, callApiMenuCus, callApiMenuByCategory]);

  // ✅ Load all items when category is "all" - Wrapped in useCallback
  const loadAllItems = useCallback(async () => {
    try {
      setLoading(true);
      setSearchText(""); // Clear search
      setIsSearching(false);
      await callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`, true); // Skip cache for manual refresh
    } catch (err) {
      console.error("Load all items error:", err);
    }
  }, [callApiMenuCus]);

  // ✅ Check if cache is valid (less than 5 minutes old)
  const isCacheValid = useCallback(() => {
    const timestamp = sessionStorage.getItem('menu_cache_timestamp');
    if (!timestamp) return false;

    const cacheAge = Date.now() - parseInt(timestamp);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    return cacheAge < CACHE_DURATION;
  }, []);

  // ✅ Initial load - Always fetch to check for updates, but use cache for instant display
  useEffect(() => {
    const cachedFoods = sessionStorage.getItem('menu_foods_cache');
    const cachedCategories = sessionStorage.getItem('menu_categories_cache');

    // Strategy:
    // 1. If cache exists, display it immediately (instant UX)
    // 2. Always call API in background to check for updates
    // 3. Only re-render if data actually changed (smart comparison in API functions)

    if (cachedFoods && cachedCategories && isCacheValid()) {
      console.log('✅ Displaying cached data, checking for updates in background...');
      // Cache already loaded via state initialization
      // Now silently check for updates (isBackground = true -> no loading skeleton)
      callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`, false, true);
      callApiMenuCategoriesCus(`${REACT_APP_API_URL}/menu/cus/menus/categories`, true);
    } else {
      console.log('🔄 No valid cache, fetching fresh data with loading');
      callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`, false, false);
      callApiMenuCategoriesCus(`${REACT_APP_API_URL}/menu/cus/menus/categories`, false);
    }
  }, [callApiMenuCus, callApiMenuCategoriesCus, isCacheValid]);

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
    // Lấy tableId từ SessionContext thay vì sessionStorage
    const tableId = session?.table_id;

    if (!tableId) {
      message.warning({
        content: 'Vui lòng quét QR trước khi đặt món',
        duration: 3,
      });
      return;
    }

    const order = JSON.parse(sessionStorage.getItem("order")) || { orderId: tableId, foodOrderList: [] };

    // ✅ Chuẩn hóa: Check món đã có trong giỏ chưa (cùng ID và note rỗng)
    const existingItemIndex = order.foodOrderList.findIndex(
      (item) => item.id === food.id && (item.note === "" || item.note === undefined || item.note === null)
    );

    if (existingItemIndex !== -1) {
      // ✅ Món đã tồn tại → Tăng số lượng
      order.foodOrderList[existingItemIndex].quantity += 1;
    } else {
      // ✅ Món chưa có → Thêm mới với cấu trúc chuẩn
      order.foodOrderList.push({
        id: food.id,
        name: food.name,
        price: food.price,
        quantity: 1,
        note: "", // ✅ Luôn có field note (rỗng khi thêm từ MenusCus)
        image_url: food.image_url || "https://via.placeholder.com/80x80?text=No+Image",
      });
    }

    // Lưu vào sessionStorage
    sessionStorage.setItem("order", JSON.stringify({ orderId: tableId, foodOrderList: order.foodOrderList }));

    // Cập nhật Redux state
    dispatch(addToCart(order));

    message.success(`Đã thêm vào giỏ hàng`, 2)
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
          <Row gutter={[0, 12]}>
            {foods.map((food) => (
              <Col xs={24} key={food.id}>
                <Card
                  hoverable
                  className="food-card-horizontal"
                  onClick={() => navigate(`/food/${food.id}`, { state: food })}
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #f0f0f0",
                    transition: "all 0.2s ease",
                    overflow: "hidden",
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ display: "flex", position: "relative" }}>
                    {/* ===== IMAGE LEFT ===== */}
                    <div style={{
                      position: "relative",
                      width: 120,
                      height: 120,
                      flexShrink: 0,
                    }}>
                      <img
                        alt={food.name}
                        src={food.image_url || "/assets/images/no-image.png"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {/* Rating Badge - Top Left */}
                      {food.average_rating && (
                        <div style={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          background: "rgba(0, 0, 0, 0.7)",
                          backdropFilter: "blur(4px)",
                          color: "#ffd700",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}>
                          ⭐ {Number(food.average_rating).toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* ===== CONTENT RIGHT ===== */}
                    <div style={{
                      flex: 1,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 100,
                    }}>
                      {/* Top Section - Title and Description */}
                      <div>
                        <Title
                          level={5}
                          style={{
                            margin: 0,
                            marginBottom: 4,
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            lineHeight: "1.3",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {food.name}
                        </Title>

                        {/* Description */}
                        {food.description && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#999",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: 4,
                              maxHeight: "33.6px", // 12px * 1.4 * 2 = 33.6px for exactly 2 lines
                              wordBreak: "break-word",
                            }}
                          >
                            {food.description}
                          </Text>
                        )}
                      </div>

                      {/* Bottom Section */}
                      <div>
                        {/* Price and badges row */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text
                              strong
                              style={{
                                color: "#ee4d2d",
                                fontSize: 16,
                                fontWeight: 700,
                              }}
                            >
                              {Number(food.price).toLocaleString()}đ
                            </Text>
                          </div>

                          {/* Badges */}
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {food.is_featured && (
                              <span style={{
                                background: "#fff4e6",
                                color: "#ff8c00",
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: "600",
                                border: "1px solid #ffd591",
                              }}>
                                HOT
                              </span>
                            )}
                            {food.discount_percent && (
                              <span style={{
                                background: "#fff1f0",
                                color: "#ee4d2d",
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: "600",
                                border: "1px solid #ffccc7",
                              }}>
                                Giảm {food.discount_percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add to cart button - Bottom Right Corner */}
                    <div style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                    }}>
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined style={{ fontSize: 16 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCart(food);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          background: "#226533",
                          border: "none",
                          boxShadow: "0 2px 8px rgba(34, 101, 51, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>

      {/* Footer giỏ hàng */}
      <CustomerFooterNav />
    </Layout>
  );
}
