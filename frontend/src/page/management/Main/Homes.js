import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Select,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const Home = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Tổng quan");
  const [activeButton, setActiveButton] = useState("today");
  const [orderView, setOrderView] = useState("day"); // trạng thái cho biểu đồ đơn hàng

  // Danh sách nút lọc ngày
  const dateButtons = [
    { key: "today", label: "Hôm nay" },
    { key: "7days", label: "7 ngày qua" },
    { key: "30days", label: "30 ngày qua" },
    { key: "custom", label: "Tùy chọn" },
  ];

  // Dữ liệu mẫu cho biểu đồ
  const revenueData = [
    { name: "Th1", value: 12000000 },
    { name: "Th2", value: 18000000 },
    { name: "Th3", value: 10000000 },
  ];

  const orderData = [
    { name: "01/05", value: 30 },
    { name: "02/05", value: 45 },
    { name: "03/05", value: 20 },
  ];

  const orderBySession = [
    { name: "Sáng", value: 40 },
    { name: "Trưa", value: 30 },
    { name: "Tối", value: 50 },
  ];

  const productData = [
    { name: "Món A", value: 120 },
    { name: "Món B", value: 90 },
    { name: "Món C", value: 70 },
    { name: "Món D", value: 50 },
    { name: "Món E", value: 40 },
  ];

  const COLORS = ["#226533", "#2f9e44", "#52c41a", "#82ca9d", "#b7eb8f"];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar dùng chung */}
      <AppSidebar collapsed={collapsed} currentPageKey="homes" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        {/* Header dùng chung */}
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        {/* Content */}
        <Content
          style={{
            marginTop: 64,
            padding: 20,
            background: "#f9f9f9",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
          }}
        >
          {/* Bộ lọc ngày */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <RangePicker style={{ fontSize: 14, height: 36 }} />
            {dateButtons.map((btn) => (
              <Button
                key={btn.key}
                type={activeButton === btn.key ? "primary" : "default"}
                style={{
                  background: activeButton === btn.key ? "#226533" : "",
                  color: activeButton === btn.key ? "#fff" : "",
                  height: 36,
                  fontSize: 14,
                }}
                onClick={() => setActiveButton(btn.key)}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Cards thống kê */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                  Số lượng đơn hàng
                </Title>
                <Text strong style={{ fontSize: 16 }}>36</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                  Doanh thu
                </Title>
                <Text strong style={{ fontSize: 16 }}>28,010,293 ₫</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                  Lợi nhuận
                </Title>
                <Text strong style={{ fontSize: 16, color: "#226533" }}>
                  5,220,093 ₫
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                  Sản phẩm đã bán
                </Title>
                <Text strong style={{ fontSize: 16 }}>77</Text>
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ + Tổng quan doanh thu */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Báo cáo doanh thu bán hàng">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#226533" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<span style={{ fontSize: 14 }}>Tổng quan doanh thu</span>}>
                <p style={{ fontSize: 14 }}>Doanh thu: <strong>28,010,293 ₫</strong></p>
                <p style={{ fontSize: 14 }}>Chi phí: <Text type="danger">22,750,200 ₫</Text></p>
                <p style={{ fontSize: 14 }}>Thuế VAT: 0 ₫</p>
                <p style={{ fontSize: 14 }}>Lợi nhuận: <Text style={{ color: "#226533" }}>5,220,093 ₫</Text></p>
                <Progress percent={80} showInfo={false} strokeColor="#226533" />
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  Khách đã thanh toán: <Text style={{ color: "#226533" }}>13,766,110 ₫</Text>
                </p>
                <p style={{ fontSize: 14 }}>
                  Khách còn nợ: <Text type="warning">14,244,183 ₫</Text>
                </p>
              </Card>
            </Col>
          </Row>

          {/* Các dashboard bổ sung */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Biểu đồ số lượng đơn hàng */}
            <Col xs={24} md={12}>
              <Card
                title="Biểu đồ số lượng đơn hàng"
                extra={
                  <Select value={orderView} onChange={setOrderView} size="small">
                    <Option value="day">Theo ngày</Option>
                    <Option value="hour">Theo giờ</Option>
                    <Option value="session">Theo buổi</Option>
                  </Select>
                }
                style={{ height: 300 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {orderView === "session" ? (
                    <PieChart>
                      <Pie
                        data={orderBySession}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label={{
                          type: "spider", 
                          content: "{name} {percentage}",
                        }}
                      >
                        {orderBySession.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={orderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#226533" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Top sản phẩm bán chạy */}
            <Col xs={24} md={12}>
              <Card title="Top sản phẩm bán chạy" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={productData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#226533" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;
