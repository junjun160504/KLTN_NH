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
} from "antd";
import { Pie, Line, Bar } from "@ant-design/plots";
import dayjs from "dayjs";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock dữ liệu khách hàng
const mockCustomers = [
  { date: "2025-09-20", type: "new", count: 40 },
  { date: "2025-09-20", type: "return", count: 60 },
  { date: "2025-09-21", type: "new", count: 30 },
  { date: "2025-09-21", type: "return", count: 70 },
  { date: "2025-09-22", type: "new", count: 50 },
  { date: "2025-09-22", type: "return", count: 80 },
];

const mockTopCustomers = [
  { name: "Nguyễn Thị Lan", points: 2800 },
  { name: "Lê Thị Hoa", points: 3200 },
  { name: "Trần Văn Minh", points: 2100 },
  { name: "Phạm Thị Mai", points: 2500 },
  { name: "Hoàng Văn Nam", points: 3000 },
];

const ReportsCustomerPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Báo cáo khách hàng");
  const [filteredData, setFilteredData] = useState(mockCustomers);
  const [dateRange, setDateRange] = useState([]);
  const [customerType, setCustomerType] = useState("all");

  // ====== Bộ lọc ======
  const handleFilter = () => {
    let data = mockCustomers;
    if (dateRange.length) {
      const [start, end] = dateRange;
      data = data.filter((s) => {
        const d = dayjs(s.date);
        return d.isBetween(start, end, "day", "[]");
      });
    }
    if (customerType !== "all") {
      data = data.filter((s) => s.type === customerType);
    }
    setFilteredData(data);
  };

  // ====== Tính toán ======
  const totalCustomers = filteredData.reduce((sum, s) => sum + s.count, 0);
  const newCustomers = filteredData
    .filter((s) => s.type === "new")
    .reduce((sum, s) => sum + s.count, 0);
  const returnCustomers = filteredData
    .filter((s) => s.type === "return")
    .reduce((sum, s) => sum + s.count, 0);
  const avgValuePerCustomer = 485000; // mock cứng

  // Pie chart
  const pieData = [
    { type: "Khách mới", value: newCustomers },
    { type: "Khách quay lại", value: returnCustomers },
  ];

  // Line chart
  const lineData = filteredData.map((s) => ({
    date: s.date,
    type: s.type === "new" ? "Khách mới" : "Khách quay lại",
    value: s.count,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} currentPageKey="reports-customers" />
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
              onChange={setCustomerType}
            >
              <Option value="all">Tất cả khách hàng</Option>
              <Option value="new">Khách mới</Option>
              <Option value="return">Khách quay lại</Option>
            </Select>
            <Button type="primary" style={{ background: "#3b82f6" }} onClick={handleFilter}>
              Lọc
            </Button>
          </div>

          {/* Thống kê */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Tổng số khách" value={totalCustomers} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Khách hàng mới" value={newCustomers} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Khách quay lại" value={returnCustomers} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Giá trị TB/khách" value={avgValuePerCustomer.toLocaleString()} suffix="đ" />
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Tỷ lệ khách mới vs quay lại">
                <Pie
                  data={pieData}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  label={{
                    type: "spider",
                    content: "{name} {percentage}",
                  }}
                  interactions={[{ type: "element-active" }]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Lượt khách theo ngày">
                <Line
                  data={lineData}
                  xField="date"
                  yField="value"
                  seriesField="type"
                  smooth
                />
              </Card>
            </Col>
          </Row>

          {/* Top khách hàng */}
          <Row style={{ marginTop: 20 }}>
            <Col span={24}>
              <Card title="Top khách hàng tích điểm nhiều nhất">
                <Bar
                  data={mockTopCustomers}
                  xField="points"
                  yField="name"
                  seriesField="name"
                  color="#3b82f6"
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsCustomerPage;
