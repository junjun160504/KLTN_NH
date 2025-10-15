import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/main/homes";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password,
        remember: values.remember || false,
      });

      message.success("Đăng nhập thành công!");

      // Redirect to previous page or home
      const from = location.state?.from?.pathname || "/main/homes";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      message.error(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pl-3 pr-3">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-10">
        {/* Title */}
        <Title
          level={2}
          className="text-center mb-2 font-bold text-gray-800 text-2xl sm:text-3xl"
          style={{ marginTop: 0 }}
        >
          Đăng nhập
        </Title>

        <Text className="block text-center text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Hệ thống quản lý nhà hàng
        </Text>

        {/* Login Form */}
        <Form
          name="login"
          initialValues={{ remember: false }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            label={<span className="text-gray-700 font-medium text-sm sm:text-base">Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input
              placeholder="Nhập tên đăng nhập của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-700 font-medium text-sm sm:text-base">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
            />
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-gray-600 text-sm sm:text-base">
                Ghi nhớ đăng nhập
              </Checkbox>
            </Form.Item>
            {/* <Link
              href="/forgot-password"
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm sm:text-base"
            >
              Quên mật khẩu?
            </Link> */}
          </div>

          <Form.Item className="mb-4 sm:mb-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
              className="rounded-lg font-semibold border-0 h-11 sm:h-12 text-sm sm:text-base"
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