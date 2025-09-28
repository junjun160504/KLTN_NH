import React, { useState, useEffect } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  Button,
  DatePicker,
  Space,
  Select,
  Table,
} from "antd";
import { Column, Line, Bar } from "@ant-design/plots";
import dayjs from "dayjs";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock dữ liệu
const mockProducts = [
  { date: "2025-09-20", product: "Phở Bò Tái", category: "Món chính", quantity: 342, revenue: 4500000 },
  { date: "2025-09-20", product: "Bún Chả", category: "Món chính", quantity: 500, revenue: 8000000 },
  { date: "2025-09-20", product: "Trà Sữa", category: "Đồ uống", quantity: 280, revenue: 4200000 },
  { date: "2025-09-21", product: "Cơm Tấm", category: "Món chính", quantity: 200, revenue: 4000000 },
  { date: "2025-09-21", product: "Cà Phê", category: "Đồ uống", quantity: 180, revenue: 2700000 },
  { date: "2025-09-22", product: "Nem Rán", category: "Khai vị", quantity: 90, revenue: 1800000 },
  { date: "2025-09-22", product: "Gỏi Cuốn", category: "Khai vị", quantity: 70, revenue: 1400000 },
  { date: "2025-09-22", product: "Nước Cam", category: "Đồ uống", quantity: 150, revenue: 3000000 },
];

const ReportsProductPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Báo cáo sản phẩm");
  const [filteredSales, setFilteredSales] = useState(mockProducts);
  const [dateRange, setDateRange] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ====== Bộ lọc ======
  const handleFilter = () => {
    let data = mockProducts;
    if (dateRange.length) {
      const [start, end] = dateRange;
      data = data.filter((s) => {
        const d = dayjs(s.date);
        return d.isBetween(start, end, "day", "[]");
      });
    }
    if (categoryFilter !== "all") {
      data = data.filter((s) => s.category === categoryFilter);
    }
    setFilteredSales(data);
  };

  // ====== Tính toán ======
  const totalOrders = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
  const topProduct = filteredSales.sort((a, b) => b.quantity - a.quantity)[0];
  const revenueByCategory = filteredSales.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.revenue;
    return acc;
  }, {});
  const tableRevenue = Object.entries(revenueByCategory).map(([category, revenue]) => ({
    category,
    revenue,
  }));

  // Top 10 món
  const top10Products = [...filteredSales]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Xu hướng gọi món
  const trendData = filteredSales.map((s) => ({
    date: s.date,
    category: s.category,
    quantity: s.quantity,
  }));

  // ====== Columns ======
  const revenueColumns = [
    { title: "Loại món", dataIndex: "category", key: "category" },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (val) => val.toLocaleString() + " đ",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} currentPageKey="reports-products" />
      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        <Content style={{ marginTop: 64, padding: 20, background: "#f9f9f9" }}>
          {/* Bộ lọc */}
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <RangePicker
              format="YYYY-MM-DD"
              onChange={(dates) => setDateRange(dates)}
            />
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={setCategoryFilter}
            >
              <Option value="all">Tất cả loại món</Option>
              <Option value="Món chính">Món chính</Option>
              <Option value="Đồ uống">Đồ uống</Option>
              <Option value="Khai vị">Khai vị</Option>
            </Select>
            <Button type="primary" style={{ background: "#f97316" }} onClick={handleFilter}>
              Áp dụng bộ lọc
            </Button>
          </div>

          {/* Thống kê */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Tổng số món được gọi" value={totalOrders} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Món bán chạy nhất"
                  value={topProduct?.product || "-"}
                  suffix={topProduct ? `${topProduct.quantity} lần gọi` : ""}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Doanh thu từ đồ uống"
                  value={revenueByCategory["Đồ uống"]?.toLocaleString() || 0}
                  suffix="đ"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Doanh thu từ món chính"
                  value={revenueByCategory["Món chính"]?.toLocaleString() || 0}
                  suffix="đ"
                />
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ & Bảng */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Top 10 món bán chạy">
                <Bar
                  data={top10Products}
                  xField="quantity"
                  yField="product"
                  seriesField="product"
                  color="#f97316"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Doanh thu theo loại món">
                <Table
                  columns={revenueColumns}
                  dataSource={tableRevenue}
                  pagination={false}
                  rowKey="category"
                  bordered
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col span={24}>
              <Card title="Xu hướng gọi món theo ngày">
                <Line
                  data={trendData}
                  xField="date"
                  yField="quantity"
                  seriesField="category"
                  smooth
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsProductPage;
