import React from "react";
import {
  Layout,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  message,
} from "antd";
import {
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function CustomerBillPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Nhận danh sách món đã chọn từ giỏ hàng
  const selectedItems = location.state?.selectedItems || [];

  // ✅ Tổng số lượng món
  const totalQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  // ✅ Tổng tiền
  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

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
          Hóa đơn hiện tại
        </Title>
        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "12px", paddingBottom: "100px" }}>
        {selectedItems.length === 0 ? (
          <Text type="secondary">Chưa có món nào trong hóa đơn.</Text>
        ) : (
          <>
            {selectedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
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
                  <Text type="secondary">
                    {item.qty} x {item.price.toLocaleString()} VND
                  </Text>
                </div>
                <Text strong style={{ color: "orangered" }}>
                  {(item.qty * item.price).toLocaleString()} VND
                </Text>
              </div>
            ))}

            <Divider />

            {/* Tổng số món */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text strong>Số món:</Text>
              <Text strong style={{ color: "#226533" }}>
                {totalQty} món
              </Text>
            </div>

            {/* Tổng tiền */}
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
              onClick={() => message.success("Đã gửi yêu cầu thanh toán!")}
            >
              Thanh toán
            </Button>
          </>
        )}
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
            style={{ background: getActiveColor("/cus/bills") }}
            onClick={() => navigate("/cus/bills")}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<AppstoreOutlined />}
            style={{ background: getActiveColor("/cus/menus") }}
            onClick={() => navigate("/cus/menus")}
          />
        </Space>
      </Footer>
    </Layout>
  );
}
