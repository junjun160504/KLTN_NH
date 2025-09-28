import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
} from "antd";
import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import axios from "axios";
import Slider from "react-slick";
import { addToCart } from "../../redux/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
export default function CustomerMenuPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("1");
  const [cartCount, setCartCount] = useState(5); // ✅ Demo giỏ hàng có 5 sản phẩm
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const dispatch = useDispatch();
  // GET items

  async function callApiMenuCus(url) {
    try {
      const response = await axios.get(url);
      console.log("API GET menu/cus/menus", response.data);
      setFoods(response.data.data);
    } catch (err) {
      console.error("API GET error:", err);
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
  useEffect(() => {
    if (searchText.trim() !== "") {
      callApiMenuCus(
        `${REACT_APP_API_URL}/menu/cus/menus/${encodeURIComponent(searchText)}`
      );
    }
  }, [searchText])
  //GET items by category
  async function callApiMenuByCategory(id) {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/category/${id}`);
      setFoods(response.data.data);
    } catch (err) {
      console.error("API GET error:", err);
    }
  }
  useEffect(() => {
    callApiMenuCus(`${REACT_APP_API_URL}/menu/cus/menus/all`);
    callApiMenuCategoriesCus(`${REACT_APP_API_URL}/menu/cus/menus/categories`);

  }, []);

  // ✅ Lọc món ăn theo category + tìm kiếm
  const filteredFoods = []
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
          style={{ height: 50, marginBottom: 4 }}
        />
        <Title
          level={5}
          style={{ margin: 0, fontWeight: "bold", color: "#226533" }}
        >
          Nhà hàng Phương Nam
        </Title>

      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "12px", paddingBottom: "90px" }}>
        {/* Ô tìm kiếm */}
        <Input
          placeholder="Tìm món ăn, đồ uống..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            borderRadius: 20,
            marginBottom: 12,
            height: 40,
          }}
        />

        {/* Bộ lọc category */}
        <div style={{ marginBottom: 20 }}>
          <Slider
            dots={false}
            infinite={false}
            variableWidth={true}
            swipeToSlide={true}
            arrows={false}
          >
            {categories.map((cat) => (
              <div key={cat.id} style={{ padding: "0 6px" }}>
                <Button
                  type={selectedCategory == cat.id ? "primary" : "default"}
                  shape="round"
                  size="middle"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    callApiMenuByCategory(cat.id); // gọi API lọc theo category
                  }}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0 16px",
                    height: "32px",
                  }}
                >
                  {cat.name}
                </Button>
              </div>
            ))}
          </Slider>
        </div>

        {/* Danh sách món ăn */}
        <Row gutter={[12, 12]}>
          {foods.map((food) => (
            <Col xs={24} sm={12} key={food.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={food.name}
                    src={food.image_url || "/assets/images/no-image.png"}
                    style={{
                      height: 150,
                      objectFit: "cover",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                }
                onClick={() => navigate(`/food/${food.id}`, { state: food })}
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <Title level={5} style={{ marginBottom: 0 }}>
                  {food.name}
                </Title>
                <Text strong style={{ color: "#d4380d" }}>
                  {Number(food.price).toLocaleString()}đ
                </Text>
                <p style={{ fontSize: 12, color: "#666", margin: "4px 0 8px" }}>
                  {food.description}
                </p>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  block
                  shape="round"
                  onClick={(e) => {
                    e.stopPropagation(); // tránh trigger click card
                    handleSetCart(food);
                  }}
                >
                  Thêm vào giỏ
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      {/* Footer giỏ hàng */}
      <CustomerFooterNav cartCount={cartCount} />
    </Layout>
  );
}
