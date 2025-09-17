import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Input,
  Button,
  Typography,
  Tag,
  Card,
  Row,
  Col,
  Space,
} from "antd";
import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CustomerMenuPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [cartCount, setCartCount] = useState(5); // ✅ Demo giỏ hàng có 5 sản phẩm
  const [searchText, setSearchText] = useState("");

  // ✅ Lời chào theo giờ
  const hour = new Date().getHours();
  let greeting = "Chào buổi tối";
  if (hour < 12) greeting = "Chào buổi sáng";
  else if (hour < 18) greeting = "Chào buổi trưa";
  else greeting = "Chào buổi chiều";

  // ✅ Danh mục
  const categories = [
    "Tất cả",
    "Món chính",
    "Đồ uống",
    "Tráng miệng",
    "Khuyến mãi",
  ];

  // ✅ Dữ liệu món ăn mẫu
  const foods = [
    {
      id: 1,
      name: "Phở Bò Tái",
      price: 65000,
      desc: "Phở bò tái truyền thống với nước dùng đậm đà",
      img: "https://source.unsplash.com/400x300/?pho,vietnamese",
      category: "Món chính",
    },
    {
      id: 2,
      name: "Bánh Mì Thịt Nướng",
      price: 35000,
      desc: "Bánh mì giòn với thịt nướng thơm ngon",
      img: "https://source.unsplash.com/400x300/?banhmi,vietnam",
      category: "Món chính",
    },
    {
      id: 3,
      name: "Cơm Tấm Sườn Nướng",
      price: 55000,
      desc: "Cơm tấm với sườn nướng và trứng",
      img: "https://source.unsplash.com/400x300/?comtam,vietnam",
      category: "Món chính",
    },
    {
      id: 4,
      name: "Cà Phê Sữa Đá",
      price: 25000,
      desc: "Cà phê truyền thống Việt Nam thơm ngon",
      img: "https://source.unsplash.com/400x300/?coffee,vietnam",
      category: "Đồ uống",
    },
  ];

  // ✅ Lọc món ăn theo category + tìm kiếm
  const filteredFoods = foods.filter((f) => {
    const matchCategory =
      selectedCategory === "Tất cả" || f.category === selectedCategory;
    const matchSearch = f.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

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
        <Text style={{ fontSize: 13, color: "#666", display: "block" }}>
          Số 13 Mai Hắc Đế, phường Nguyễn Du, quận Hai Bà Trưng
        </Text>
        <Text style={{ fontSize: 13, color: "#666" }}>
          {greeting} Quý khách • Bàn:{" "}
          <Tag color="green" style={{ fontSize: 12, borderRadius: 12 }}>
            C8
          </Tag>
        </Text>
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
        <Space
          size={[8, 8]}
          wrap
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {categories.map((cat) => (
            <Button
              key={cat}
              type={selectedCategory === cat ? "primary" : "default"}
              shape="round"
              size="small"
              onClick={() => setSelectedCategory(cat)}
              
            >
              {cat}
            </Button>
          ))}
        </Space>

        {/* Danh sách món ăn */}
        <Row gutter={[12, 12]}>
          {filteredFoods.map((food) => (
            <Col xs={24} sm={12} key={food.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={food.name}
                    src={food.img}
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
                  {food.price.toLocaleString()}đ
                </Text>
                <p style={{ fontSize: 12, color: "#666", margin: "4px 0 8px" }}>
                  {food.desc}
                </p>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  block
                  shape="round"
                  onClick={(e) => {
                    e.stopPropagation(); // tránh trigger click card
                    setCartCount(cartCount + 1);
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
