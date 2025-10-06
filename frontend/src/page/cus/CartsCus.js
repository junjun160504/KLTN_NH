import React, { useEffect, useState } from "react";
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
import { useSelector } from "react-redux";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CustomerCartPage() {
  const order = useSelector((state) => state.cart.order);

  const [cart, setCart] = useState([]);
  useEffect(() => {
    if (order && order.foodOrderList) {
      const updatedCart = order.foodOrderList.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.quantity,
        img: item.image_url || "https://source.unsplash.com/80x80/?food",
      }));
      setCart(updatedCart);
    }
  }, [order]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
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
    setCart(cart.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
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
    <Layout style={{ minHeight: "100vh", background: "#fafafa", overflowX: "hidden" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />
        <Title
          level={3}
          style={{
            margin: 0,
            fontSize: 20,
            color: "#226533",
            fontWeight: "bold",
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          Giỏ hàng của bạn{" "}
          <span style={{ color: "orangered" }}>({cartCount})</span>
        </Title>

        <Tag color="green" style={{ borderRadius: 12, flexShrink: 0 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{
          padding: "12px",
          paddingTop: 72,
          paddingBottom: 200,
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {/* Chọn tất cả */}
        <div style={{ marginBottom: 12 }}>
          <Checkbox
            checked={selectedItems.length === cart.length && cart.length > 0}
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
              maxWidth: "100%",
            }}
          >
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onChange={(e) => toggleSelect(item.id, e.target.checked)}
              style={{ marginRight: 8, flexShrink: 0 }}
            />
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                marginRight: 10,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                strong
                style={{
                  display: "block",
                  width: "180px",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {item.name}
              </Text>
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
              style={{ flexShrink: 0 }}
            />
          </div>
        ))}
      </Content>

      {/* -------- TỔNG KẾT -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 70,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "1px solid #eee",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
          maxWidth: "100%",
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
          onClick={() => setIsModalVisible(true)}
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
              navigate("/cus/menus");
            }}
          >
            Order tiếp
          </Button>
          <Button
            onClick={() => {
              setIsModalVisible(false);
              navigate("/cus/bills");
            }}
          >
            Xem đơn hàng
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
