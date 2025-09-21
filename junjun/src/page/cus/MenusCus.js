import React, { useState, useEffect } from "react";
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
    Badge,
} from "antd";
import {
    SearchOutlined,
    ShoppingCartOutlined,
    HomeOutlined,
    MessageOutlined,
    AppstoreOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMenuItems } from '../../api/menu';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function CustomerMenuPage() {
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [cartCount, setCartCount] = useState(0);
    const [foods, setFoods] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    const hour = new Date().getHours();
    let greeting = "Chào buổi tối";
    if (hour < 12) greeting = "Chào buổi sáng";
    else if (hour < 18) greeting = "Chào buổi trưa";
    else greeting = "Chào buổi chiều";

    const categoryMap = {
        "monchinh": "Món chính",
        "do_uong": "Đồ uống",
        "trangmieng": "Tráng miệng",
        "khuyenmai": "Khuyến mãi"
    };

    const categories = ["Tất cả", "Món chính", "Đồ uống", "Tráng miệng", "Khuyến mãi"];

    useEffect(() => {
        fetchMenuItems()
            .then(res => {
                const raw = res.data?.data || res.data; // phòng trường hợp trả ra {data: [...]}
                if (Array.isArray(raw)) {
                    const mapped = raw.map(f => ({
                        id: f.id,
                        name: f.name,
                        price: Number(f.price),
                        desc: f.description,
                        img: f.image_url,
                        category: categoryMap[f.category] || "Khác"
                    }));
                    setFoods(mapped);
                } else {
                    console.error("❌ Dữ liệu không đúng định dạng:", res.data);
                }
            })
            .catch(err => console.error("Lỗi khi gọi API menu:", err));
    }, []);

    const filteredFoods =
        selectedCategory === "Tất cả"
            ? foods
            : foods.filter((f) => f.category === selectedCategory);

    const getActiveColor = (path) =>
        location.pathname === path ? "orange" : "#226533";

    return (
        <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
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
                <Title level={5} style={{ margin: 0, fontWeight: "bold", color: "#226533" }}>
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

            <Content style={{ padding: "12px", paddingBottom: "90px" }}>
                <Input
                    placeholder="Tìm món ăn, đồ uống..."
                    prefix={<SearchOutlined />}
                    style={{ borderRadius: 20, marginBottom: 12, height: 40 }}
                />

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
                                    onClick={() => setCartCount(cartCount + 1)}
                                >
                                    Thêm vào giỏ
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Content>

            <Footer
                style={{
                    background: "#fff",
                    padding: "8px 16px",
                    boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                <Space
                    style={{
                        width: "100%",
                        justifyContent: "space-around",
                        display: "flex",
                    }}
                >
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<HomeOutlined />}
                        style={{ background: getActiveColor("/customers/homes_cs") }}
                        onClick={() => navigate("/customers/homes_cs")}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<MessageOutlined />}
                        style={{ background: getActiveColor("/customers/chatbot") }}
                        onClick={() => navigate("/customers/chatbot")}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        style={{ background: getActiveColor("/customers/orders") }}
                        onClick={() => navigate("/customers/orders")}
                    >
                        <Badge
                            count={cartCount}
                            offset={[0, 5]}
                            style={{
                                backgroundColor: "orange",
                                fontWeight: "bold",
                                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                            }}
                        >
                            <ShoppingCartOutlined style={{ fontSize: 18, color: "white" }} />
                        </Badge>
                    </Button>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<FileTextOutlined />}
                        style={{ background: getActiveColor("/customers/bill") }}
                        onClick={() => navigate("/customers/bill")}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<AppstoreOutlined />}
                        style={{ background: getActiveColor("/customers/menu") }}
                        onClick={() => navigate("/customers/menu")}
                    />
                </Space>
            </Footer>
        </Layout>
    );
}
