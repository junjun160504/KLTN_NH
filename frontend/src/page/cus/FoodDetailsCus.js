import { useNavigate, useParams } from "react-router-dom";
import {
  Layout,
  Typography,
  Card,
  Space,
  Rate,
  Avatar,
  List,
  Button,
  FloatButton,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  WechatOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import CustomerFooterNav from "../../components/CustomerFooterNav";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function FoodDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ Mock data món ăn
  const foods = [
    {
      id: "1",
      name: "Phở Bò Tái",
      price: 65000,
      desc: "Phở bò tái truyền thống với nước dùng đậm đà",
      img: "https://source.unsplash.com/400x300/?pho,vietnamese",
    },
    {
      id: "2",
      name: "Cơm Tấm Sườn Nướng",
      price: 55000,
      desc: "Cơm tấm với sườn nướng và trứng",
      img: "https://source.unsplash.com/400x300/?comtam,vietnam",
    },
  ];

  const food = foods.find((f) => f.id === id) || foods[0];

  // ✅ Mock data đánh giá
  const reviews = [
    {
      id: 1,
      rating: 5,
      comment: "Rất ngon, phục vụ nhanh!",
      phone: "0905123456",
    },
    {
      id: 2,
      rating: 4,
      comment: "Món ăn ổn, hơi ít thịt.",
      phone: "0987654321",
    },
  ];

  // ✅ Mask số điện thoại: KH - 09*****345
  const maskPhone = (phone) =>
    `KH - ${phone.slice(0, 2)}*****${phone.slice(-3)}`;

  // ✅ Xử lý thêm vào giỏ
  const handleAddToCart = () => {
    message.success({
      content: `Đã thêm ${food.name} vào giỏ hàng!`,
      duration: 2,
    });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Header */}
      <Header
        style={{
          background: "#fff",
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ArrowLeftOutlined
          onClick={() => navigate("/cus/menus")}
          style={{
            position: "absolute",
            left: 16,
            fontSize: 18,
            cursor: "pointer",
            color: "#226533",
          }}
        />
        <Title
          level={5}
          style={{ margin: 0, color: "#226533", fontWeight: "bold", fontSize: 20 }}
        >
          Chi tiết món ăn
        </Title>
      </Header>

      {/* Content */}
      <Content style={{ padding: 16, paddingBottom: 90 }}>
        <Card
          cover={
            <img
              alt={food.name}
              src={food.img}
              style={{ height: 220, objectFit: "cover" }}
            />
          }
          style={{ borderRadius: 12 }}
        >
          <Title level={4}>{food.name}</Title>
          <Text strong style={{ color: "#d4380d", fontSize: 18 }}>
            {food.price.toLocaleString()}đ
          </Text>

          {/* Nút đặt món */}
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            block
            shape="round"
            style={{ marginTop: 12 }}
            onClick={handleAddToCart}
          >
            Thêm vào giỏ hàng
          </Button>

          {/* Phần mô tả (cách xa button hơn) */}
          <p style={{ marginTop: 16, color: "#292727ff" }}>{food.desc}</p>
        </Card>

        {/* Đánh giá */}
        <div style={{ marginTop: 20 }}>
          <Title level={5} style={{ color: "#226533" }}>
            Đánh giá món ăn
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Rate disabled defaultValue={review.rating} />
                      <Text>{maskPhone(review.phone)}</Text>
                    </Space>
                  }
                  description={review.comment}
                />
              </List.Item>
            )}
          />
        </div>
      </Content>

      {/* Floating chat button */}
      <FloatButton
        icon={<WechatOutlined />}
        type="primary"
        style={{ backgroundColor: "#226533", bottom: 100 }}
        onClick={() =>
          navigate("/cus/chatbot", {
            state: {
              message: `Bạn muốn có thêm thông tin gì về món ${food.name}?`,
            },
          })
        }
      />

      {/* Footer nav */}
      <CustomerFooterNav cartCount={3} />
    </Layout>
  );
}
