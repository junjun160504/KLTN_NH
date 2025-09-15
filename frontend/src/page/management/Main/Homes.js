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
  Space,
  Progress,
  Tabs,
} from "antd";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Home = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Tổng quan");
  const [activeButton, setActiveButton] = useState("today");

  // menu user
  const userMenu = {
    items: [
      { key: "1", label: <span style={{ display: "block", marginBottom: 12 }}>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  // Danh sách nút lọc ngày
  const dateButtons = [
    { key: "today", label: "Hôm nay" },
    { key: "7days", label: "7 ngày qua" },
    { key: "30days", label: "30 ngày qua" },
    { key: "custom", label: "Tùy chọn" },
  ];

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
          userMenu={userMenu}
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
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Số lượng đơn hàng</Title>
                <Text strong style={{ fontSize: 16 }}>36</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Doanh thu</Title>
                <Text strong style={{ fontSize: 16 }}>28,010,293 ₫</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Lợi nhuận</Title>
                <Text strong style={{ fontSize: 16, color: "#226533" }}>5,220,093 ₫</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card>
                <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>Sản phẩm đã bán</Title>
                <Text strong style={{ fontSize: 16 }}>77</Text>
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ + Tổng quan doanh thu */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={<span style={{ fontSize: 14 }}>Báo cáo doanh thu bán hàng</span>}
                extra={
                  <Tabs
                    size="small"
                    defaultActiveKey="1"
                    items={[
                      { key: "1", label: "Biểu đồ doanh thu" },
                      { key: "2", label: "Theo đơn hàng" },
                    ]}
                  />
                }
              >
                <div
                  style={{
                    height: 220,
                    textAlign: "center",
                    paddingTop: 80,
                    fontSize: 14,
                    color: "#888",
                  }}
                >
                  [Biểu đồ doanh thu...]
                </div>
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
            <Col xs={24} md={12}>
              <Card title="Biểu đồ số lượng đơn hàng" style={{ height: 280 }}>
                <div style={{ height: "100%", textAlign: "center", paddingTop: 80, fontSize: 14, color: "#888" }}>
                  [Biểu đồ số lượng đơn hàng...]
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Doanh thu theo nhóm" style={{ height: 280 }}>
                <div style={{ height: "100%", textAlign: "center", paddingTop: 80, fontSize: 14, color: "#888" }}>
                  [Doanh thu theo nhóm...]
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Top sản phẩm bán chạy"
                extra={
                  <Space>
                    <select style={{ padding: "4px 8px", borderRadius: 4 }}>
                      <option>Top sản phẩm</option>
                    </select>
                    <select style={{ padding: "4px 8px", borderRadius: 4 }}>
                      <option>Theo số lượng</option>
                    </select>
                  </Space>
                }
                style={{ height: 280 }}
              >
                <div style={{ height: "100%", textAlign: "center", paddingTop: 80, fontSize: 14, color: "#888" }}>
                  [Biểu đồ top sản phẩm...]
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Phân bổ nguồn tiền thực thu" style={{ height: 280 }}>
                <div style={{ height: "100%", textAlign: "center", paddingTop: 80, fontSize: 14, color: "#888" }}>
                  [Biểu đồ phân bổ nguồn tiền...]
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;
