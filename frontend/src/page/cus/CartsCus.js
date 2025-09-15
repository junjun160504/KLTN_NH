import React, { useState } from "react";
import {
  Layout,
  Typography,
  Tag,
  Button,
  InputNumber,
  Space,
  Divider,
  message,
  Checkbox,
} from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function CustomerCartPage() {
  const [cart, setCart] = useState([
    {
      id: 1,
      name: "Phở Bò Tái",
      price: 65000,
      qty: 2,
      img: "https://source.unsplash.com/80x80/?pho,vietnamese",
    },
    {
      id: 2,
      name: "Bánh Mì Thịt Nướng",
      price: 25000,
      qty: 1,
      img: "https://source.unsplash.com/80x80/?banhmi,vietnam",
    },
    {
      id: 3,
      name: "Gỏi Cuốn Tôm",
      price: 45000,
      qty: 3,
      img: "https://source.unsplash.com/80x80/?springroll,vietnam",
    },
    {
      id: 4,
      name: "Bún Bò Huế",
      price: 75000,
      qty: 1,
      img: "https://source.unsplash.com/80x80/?bunbohue,vietnam",
    },
    {
      id: 5,
      name: "Cơm Tấm Sườn Nướng",
      price: 65000,
      qty: 2,
      img: "https://source.unsplash.com/80x80/?comtam,vietnam",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState(cart.map((i) => i.id)); // mặc định chọn tất cả

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ tổng số lượng trong giỏ (tất cả)
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // ✅ tổng số lượng món được chọn
  const totalSelectedQty = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, item) => sum + item.qty, 0);

  // ✅ tổng tiền các món được chọn
  const totalPrice = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, item) => sum + item.price * item.qty, 0);

  const updateQty = (id, qty) => {
    if (qty <= 0) return;
    setCart(cart.map((item) => (item.id === id ? { ...item, qty } : item)));
  };

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    setSelectedItems(selectedItems.filter((sid) => sid !== id));
    message.success("Đã xoá món khỏi giỏ hàng");
  };

  const toggleSelect = (id, checked) => {
    if (checked) setSelectedItems([...selectedItems, id]);
    else setSelectedItems(selectedItems.filter((sid) => sid !== id));
  };

  const toggleSelectAll = (checked) => {
    if (checked) setSelectedItems(cart.map((i) => i.id));
    else setSelectedItems([]);
  };

  const getActiveColor = (path) =>
    location.pathname === path ? "orange" : "#226533";

  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title level={5} style={{ margin: 0 }}>
          Giỏ hàng của bạn ({totalQty})
        </Title>
        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "12px", paddingBottom: "120px" }}>
        {/* Chọn tất cả */}
        <div style={{ marginBottom: 12 }}>
          <Checkbox
            checked={selectedItems.length === cart.length}
            indeterminate={
              selectedItems.length > 0 &&
              selectedItems.length < cart.length
            }
            onChange={(e) => toggleSelectAll(e.target.checked)}
          >
            Chọn tất cả
          </Checkbox>
        </div>

        {cart.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onChange={(e) => toggleSelect(item.id, e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                marginRight: 10,
              }}
            />
            <div style={{ flex: 1 }}>
              <Text strong>{item.name}</Text>
              <br />
              <Text type="secondary">{item.price.toLocaleString()} VND</Text>
              <div style={{ marginTop: 5 }}>
                <Space>
                  <Button
                    size="small"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                  >
                    -
                  </Button>
                  <InputNumber
                    min={1}
                    value={item.qty}
                    size="small"
                    style={{ width: 50 }}
                    onChange={(val) => updateQty(item.id, val)}
                  />
                  <Button
                    size="small"
                    onClick={() => updateQty(item.id, item.qty + 1)}
                  >
                    +
                  </Button>
                </Space>
              </div>
            </div>
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              onClick={() => removeItem(item.id)}
            />
          </div>
        ))}

        {/* Điểm tích luỹ */}
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            padding: 8,
            marginBottom: 12,
          }}
        >
          <Text strong>Điểm tích luỹ: </Text> 120 điểm (SDT: 09xx xxx xxx)
        </div>

        <Divider />

        {/* Tổng số món ăn */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text strong>Số món ăn đã chọn:</Text>
          <Text strong style={{ color: "#226533" }}>
            {totalSelectedQty} món
          </Text>
        </div>

        {/* Tổng cộng */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text strong>Tổng cộng:</Text>
          <Text strong style={{ color: "orangered", fontSize: 16 }}>
            {totalPrice.toLocaleString()} VND
          </Text>
        </div>

        {/* Thời gian dự kiến */}
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          ⏱ Thời gian dự kiến: ~20 phút
        </Text>

        {/* Nút đặt hàng */}
        <Button
          type="primary"
          block
          size="large"
          disabled={selectedItems.length === 0}
          onClick={() =>
            navigate("/cus/bills", {
              state: {
                selectedItems: cart.filter((i) =>
                  selectedItems.includes(i.id)
                ),
              },
            })
          }
        >
          Đặt hàng ngay
        </Button>
      </Content>

      {/* -------- FOOTER NAV -------- */}
      <Footer
        style={{
          background: "#fff",
          padding: "8px 16px",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
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
            style={{ background: getActiveColor("/cus/homes") }}
            onClick={() => navigate("/cus/homes")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<MessageOutlined />}
            style={{ background: getActiveColor("/cus/chatbot") }}
            onClick={() => navigate("/cus/chatbot")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<ShoppingCartOutlined />}
            style={{ background: getActiveColor("/cus/carts") }}
            onClick={() => navigate("/cus/carts")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<FileTextOutlined />}
            style={{ background: getActiveColor("/cus/bill") }}
            onClick={() => navigate("/cus/bill")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<AppstoreOutlined />}
            style={{ background: getActiveColor("/cus/menu") }}
            onClick={() => navigate("/cus/menu")}
          />
        </Space>
      </Footer>
    </Layout>
  );
}
