import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Tag,
  Button,
  Divider,
  Modal,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerFooterNav from "../../components/CustomerFooterNav";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CustomerBillPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ State chứa tất cả các món đã order (cộng dồn nhiều lần)
  const [orders, setOrders] = useState([]);

  // ✅ Modal thanh toán
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  // ✅ Modal cảm ơn
  const [isThankYouVisible, setIsThankYouVisible] = useState(false);

  // ✅ Mock điểm tích luỹ
  const [userPoint] = useState(25);
  const redeemValue = userPoint * 5000;

  // ✅ Merge order mới vào bill
  useEffect(() => {
    const newItems = location.state?.selectedItems || [];
    if (newItems.length > 0) {
      setOrders((prevOrders) => {
        const merged = [...prevOrders];
        newItems.forEach((newItem) => {
          const existing = merged.find((o) => o.id === newItem.id);
          if (existing) {
            existing.qty += newItem.qty;
          } else {
            merged.push(newItem);
          }
        });
        return merged;
      });
    }
  }, [location.state]);

  // ✅ Tổng số lượng
  const totalQty = orders.reduce((sum, item) => sum + item.qty, 0);
  // ✅ Tổng tiền
  const totalPrice = orders.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  // ✅ Handler lưu QR
  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/mock-qr.png"; // thay bằng ảnh QR thật
    link.download = "vietqr.png";
    link.click();

    setIsPaymentModalVisible(false);
    setIsThankYouVisible(true); // mở popup cảm ơn
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
          position: "fixed",
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
          style={{ margin: 0, fontWeight: "bold", fontSize: 20, color: "#226533" }}
        >
          Hóa đơn hiện tại
        </Title>
        <Tag color="green" style={{ borderRadius: 12 }}>
          Bàn C8
        </Tag>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{
          padding: "12px",
          paddingTop: "60px",
          paddingBottom: "180px",
        }}
      >
        {orders.length === 0 ? (
          <Text type="secondary">Chưa có món nào trong hóa đơn.</Text>
        ) : (
          <>
            {orders.map((item, idx) => (
              <div
                key={idx}
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
          </>
        )}
      </Content>

      {/* -------- FIXED TỔNG + THANH TOÁN -------- */}
      {orders.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            left: 0,
            right: 0,
            background: "#fff",
            padding: "12px 16px",
            borderTop: "1px solid #eee",
            boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
            zIndex: 1000,
          }}
        >
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Text strong>Số món:</Text>
            <Text strong style={{ color: "#226533" }}>{totalQty} món</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Text strong>Tổng cộng:</Text>
            <Text strong style={{ color: "orangered", fontSize: 16 }}>
              {totalPrice.toLocaleString()} VND
            </Text>
          </div>

          {/* Nếu có tích điểm */}
          {userPoint > 0 && (
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 8,
                padding: 8,
                marginBottom: 12,
              }}
            >
              <Text strong>Điểm tích luỹ: </Text>
              {userPoint} điểm ={" "}
              <Text strong style={{ color: "#226533" }}>
                {redeemValue.toLocaleString()} VND
              </Text>
            </div>
          )}

          <Button
            type="primary"
            block
            size="large"
            style={{
              fontSize: 18,
              fontWeight: "bold",
              height: 42,
              background: "#226533",
            }}
            onClick={() => setIsPaymentModalVisible(true)}
          >
            Thanh toán
          </Button>
        </div>
      )}

      {/* -------- MODAL THANH TOÁN -------- */}
      <Modal
        title="Chọn phương thức thanh toán"
        centered
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button
            type="primary"
            style={{ background: "#226533" }}
            onClick={() => {
              setIsPaymentModalVisible(false);
              message.success("Nhân viên sẽ tới trong vài phút để hỗ trợ!");
              setTimeout(() => setIsThankYouVisible(true), 500);
            }}
          >
            💵 Thanh toán tiền mặt
          </Button>

          <div style={{ textAlign: "center", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <img src="/mock-qr.png" alt="VietQR" style={{ width: 180, marginBottom: 10 }} />
            <Text strong>{totalPrice.toLocaleString()} VND</Text>
            <br />
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
              style={{ marginTop: 10 }}
            >
              Lưu QR
            </Button>
          </div>
        </div>
      </Modal>

      {/* -------- MODAL CẢM ƠN -------- */}
      <Modal
        title="🎉 Cảm ơn bạn!"
        centered
        open={isThankYouVisible}
        onCancel={() => setIsThankYouVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: "center", padding: 16 }}>
          <SmileOutlined style={{ fontSize: 40, color: "#226533", marginBottom: 12 }} />
          <p>
            Cảm ơn bạn đã lựa chọn <b>Phương Nam</b> 💚
          </p>
          <p>Hãy đánh giá để chúng tôi phục vụ tốt hơn nhé!</p>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <Button type="primary" block onClick={() => navigate("/cus/reviews")}>
              Đánh giá ngay
            </Button>
            <Button block onClick={() => navigate("/cus/homes")}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </Modal>

      {/* -------- FOOTER NAV -------- */}
      <CustomerFooterNav cartCount={totalQty} />
    </Layout>
  );
}
