import React, { useState } from "react";
import {
  Layout,
  Typography,
  Input,
  Button,
  Checkbox,
  message,
} from "antd";
import { GiftOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CustomerLoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!phone) {
      message.error("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!agree) {
      message.error("Bạn cần đồng ý với điều khoản trước!");
      return;
    }
    // ✅ Demo: Giả sử gọi API kiểm tra điểm
    message.success(`Số ${phone} đã được tích điểm thành công! 🎉`);
    navigate("/cus/homes"); // chuyển về Home
  };

  const isValidPhone = phone.length >= 9;

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          padding: "12px",
          textAlign: "center",
          position: "relative",
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 24,
        }}
      >
        <ArrowLeftOutlined
          style={{ position: "absolute", left: 16, top: 18, fontSize: 18 }}
          onClick={() => navigate(-1)}
        />
        <img
          src="/assets/images/Logo.png"
          alt="logo"
          style={{ height: 50, marginBottom: 0 }}
        />
        <Title level={5} style={{ margin: 0, color: "#226533", fontWeight: "bold" , marginTop: 4, fontSize: 24}}>
          Nhà hàng Phương Nam
        </Title>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content style={{ padding: "24px", textAlign: "center" }}>
        <Title level={4} style={{ marginBottom: 19, color: "#226533", fontWeight: "bold", fontSize: 20 }}>
          Nhập số điện thoại
        </Title>
        <GiftOutlined
          style={{
            fontSize: 40,
            color: "#226533",
            background: "#f6ffed",
            borderRadius: "50%",
            padding: 12,
            marginBottom: 16,
          }}
        />
        <Text style={{ display: "block", marginBottom: 24, color: "#666" }}>
          Nhập số điện thoại của bạn để tích điểm và nhận ưu đãi. <br />
          Chúng tôi tôn trọng quyền riêng tư và không chia sẻ thông tin của bạn.
        </Text>

        {/* Input phone */}
        <Input
          placeholder="09xx xxx xxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            borderRadius: 8,
            height: 45,
            marginBottom: 16,
            textAlign: "center",
          }}
        />

        {/* Checkbox */}
        <Checkbox
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          style={{ marginBottom: 24 }}
        >
          Tôi đồng ý với{" "}
          <a href="/cus/" style={{ color: "#226533" }}>
            điều khoản và chính sách bảo mật
          </a>
        </Checkbox>

        {/* Button submit */}
        <Button
          type="primary"
          block
          size="large"
          shape="round"
          disabled={!isValidPhone || !agree}
          onClick={handleSubmit}
          style={{ background: "#226533", borderColor: "#226533", color: "#fff", fontWeight: "bold", fontSize: 16 }}
        >
          Tích điểm
        </Button>
      </Content>
    </Layout>
  );
}
