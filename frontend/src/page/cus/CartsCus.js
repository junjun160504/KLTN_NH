import React, { useState } from "react";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Typography,
  Tag,
  Button,
  InputNumber,
  Space,
  message,
  Checkbox,
  Modal,
} from "antd";
import { DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
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
  ]);

  const [selectedItems, setSelectedItems] = useState(cart.map((i) => i.id));
  const [isModalVisible, setIsModalVisible] = useState(false); // ✅ popup
  const navigate = useNavigate();

  // ✅ tổng số lượng trong giỏ
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

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
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCart(cart.filter((item) => !selectedItems.includes(item.id))); // ❌ xóa món đã tick
    setSelectedItems([]); // reset tick
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
          position: "fixed", // cố định header
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title
          level={5}
          style={{
            margin: 0,
            fontSize: 20,
            color: "#226533",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Giỏ hàng của bạn{" "}
          <span style={{ color: "orangered" }}>({cartCount})</span>
        </Title>

        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{ padding: "12px", paddingTop: "60px", paddingBottom: "220px" }}
      >
        {/* Chọn tất cả */}
        <div style={{ marginBottom: 12 }}>
          <Checkbox
            checked={selectedItems.length === cart.length}
            indeterminate={
              selectedItems.length > 0 && selectedItems.length < cart.length
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
      </Content>

      {/* -------- TỔNG KẾT (cố định) -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 70, // nằm trên CustomerFooterNav
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "1px solid #eee",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
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

        <Button
          type="primary"
          block
          size="large"
          style={{
            background: "#226533",
            fontWeight: "bold",
            borderRadius: 8,
          }}
          disabled={selectedItems.length === 0}
          onClick={() => setIsModalVisible(true)} // ✅ bật popup
        >
          Đặt hàng ngay
        </Button>
      </div>

      {/* -------- FOOTER NAV -------- */}
      <CustomerFooterNav cartCount={cartCount} />

      {/* -------- POPUP -------- */}
      <Modal
        open={isModalVisible}
        title="🎉 Đặt hàng thành công"
        onCancel={handleCloseModal}
        footer={null}
        centered
      >
        <p>
          Đơn hàng của bạn đã được gửi đến nhà hàng.
          Hãy quay lại với chúng tôi khi muốn thanh toán nhé.
        </p>
        <p>Bạn có muốn order thêm không?</p>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setIsModalVisible(false);
              navigate("/cus/menus"); // 👉 đi đến menu order thêm
            }}
          >
            Order tiếp
          </Button>
          <Button onClick={() => {
            setIsModalVisible(false);
            navigate("/cus/homes"); // 👉 quay về màn chính
          }}>
            Về màn chính
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
