import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/main/homes";
      console.log('Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onFinish = async (values) => {
    setLoading(true);
    console.log('🔐 Login form submitted:', { username: values.username, remember: values.remember });

    try {
      await login({
        username: values.username,
        password: values.password,
        remember: values.remember || false,
      });

      message.success({
        content: `Chào mừng ${values.username}!`,
        duration: 2,
      });

      // Redirect to previous page or home
      const from = location.state?.from?.pathname || "/main/homes";
      console.log('Login successful, redirecting to:', from);

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (err) {
      console.error("Login error:", err);

      // Show specific error messages
      let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";

      if (err.message) {
        if (err.message.includes('not found')) {
          errorMessage = "Tên đăng nhập không tồn tại";
        } else if (err.message.includes('password')) {
          errorMessage = "Mật khẩu không chính xác";
        } else {
          errorMessage = err.message;
        }
      }

      message.error({
        content: errorMessage,
        duration: 3,
      });
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
          form={form}
          initialValues={{ remember: false }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          autoComplete="on"
        >
          <Form.Item
            label={<span className="text-gray-700 font-medium text-sm sm:text-base">Tên đăng nhập</span>}
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập" },
              { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự" }
            ]}
          >
            <Input
              placeholder="Nhập tên đăng nhập của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
              autoComplete="username"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-700 font-medium text-sm sm:text-base">Mật khẩu</span>}
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 3, message: "Mật khẩu phải có ít nhất 3 ký tự" }
            ]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
              autoComplete="current-password"
              disabled={loading}
            />
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox
                className="text-gray-600 text-sm sm:text-base"
                disabled={loading}
              >
                Ghi nhớ đăng nhập
              </Checkbox>
            </Form.Item>
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
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;