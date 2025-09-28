import React, { useState } from "react";
import { Form, Input, Button, Checkbox, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import logo from "../../../assets/imgs/Logo.png";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../../api/admin"; // ✅ IMPORT API

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await loginAdmin(values); // ✅ GỌI API
      console.log("Login response", res);
      if (res.status === 200) {
        message.success("Đăng nhập thành công!");
        navigate("/main/homes"); // ✅ Điều hướng về trang chính
      } else {
        message.error(res.msg || "Sai tài khoản hoặc mật khẩu");
      }
    } catch (err) {
      message.error(err.msg || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f9f9f9",
      }}
    >
      <div
        style={{
          width: 800,
          padding: 30,
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <img src={logo} alt="Logo" style={{ height: 100, marginBottom: 20 }} />

        {/* Tiêu đề */}
        <Title
          level={3}
          style={{ margin: 0, color: "#245c2a", fontSize: 30, fontWeight: "bold" }}
        >
          Nhà hàng Phương Nam
        </Title>

        <br />
        <Text style={{ fontSize: 20, color: "#0c0c0cff" }}>Hệ thống quản lý</Text>

        {/* Form */}
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          style={{ marginTop: 20, textAlign: "left" }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập SĐT hoặc email" }]}
          >
            <Input
              prefix={<UserOutlined style={{ fontSize: 30 }} />}
              placeholder="Nhập SDT hoặc email"
              size="large"
              style={{ marginBottom: 10, height: 60 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: 30 }} />}
              placeholder="Nhập mật khẩu"
              size="large"
              style={{ marginBottom: 10, height: 60 }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a href="/forgot-password">Quên mật khẩu?</a>
          </div>

          <Form.Item style={{ display: "flex", justifyContent: "center" }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                background: "#245c2a",
                width: 300,
                height: 50,
                fontSize: 20,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
