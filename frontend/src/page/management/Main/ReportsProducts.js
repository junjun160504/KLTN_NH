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
  message,
} from "antd";
import * as XLSX from "xlsx";
import { Column, Pie } from "@ant-design/plots";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock dữ liệu bán sản phẩm
const mockProducts = [
  { id: 1, date: "2025-09-20", product: "Coca Cola", quantity: 10 },
  { id: 2, date: "2025-09-20", product: "Pepsi", quantity: 8 },
  { id: 3, date: "2025-09-21", product: "Coca Cola", quantity: 12 },
  { id: 4, date: "2025-09-21", product: "Sting", quantity: 6 },
  { id: 5, date: "2025-09-22", product: "Pepsi", quantity: 15 },
  { id: 6, date: "2025-09-22", product: "Sting", quantity: 5 },
  { id: 7, date: "2025-09-22", product: "Coca Cola", quantity: 20 },
];

const ReportsProductPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Báo cáo sản phẩm");
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [groupMode, setGroupMode] = useState("day"); // day, week, month

  useEffect(() => {
    setSales(mockProducts);
    setFilteredSales(mockProducts);
  }, []);

  // ====== Lọc theo thời gian ======
  const handleFilterByDate = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredSales(sales);
      setDateRange([]);
      return;
    }
    const [start, end] = dates;
    const filtered = sales.filter((s) => {
      const saleDate = dayjs(s.date, "YYYY-MM-DD");
      return saleDate.isBetween(start, end, "day", "[]");
    });
    setFilteredSales(filtered);
    setDateRange([start, end]);
  };

  const handleQuickFilter = (value) => {
    const today = dayjs();
    let start, end;

    switch (value) {
      case "today":
        start = today.startOf("day");
        end = today.endOf("day");
        setGroupMode("day");
        break;
      case "week":
        start = today.startOf("week");
        end = today.endOf("week");
        setGroupMode("day");
        break;
      case "month":
        start = today.startOf("month");
        end = today.endOf("month");
        setGroupMode("week");
        break;
      case "year":
        start = today.startOf("year");
        end = today.endOf("year");
        setGroupMode("month");
        break;
      default:
        setFilteredSales(sales);
        setDateRange([]);
        setGroupMode("day");
        return;
    }
    handleFilterByDate([start, end]);
  };

  // ====== Thống kê ======
  const totalProductsSold = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

  // Top sản phẩm
  const productTotals = filteredSales.reduce((acc, s) => {
    acc[s.product] = (acc[s.product] || 0) + s.quantity;
    return acc;
  }, {});
  const topProducts = Object.entries(productTotals)
    .map(([product, quantity]) => ({ product, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  // Doanh số theo thời gian
  const salesGrouped = filteredSales.reduce((acc, s) => {
    const d = dayjs(s.date, "YYYY-MM-DD");
    let key = d.format("YYYY-MM-DD");
    if (groupMode === "week") key = `Tuần ${d.isoWeek()}`;
    else if (groupMode === "month") key = d.format("YYYY-MM");
    acc[key] = (acc[key] || 0) + s.quantity;
    return acc;
  }, {});
  const salesByDate = Object.entries(salesGrouped).map(([date, value]) => ({
    date,
    value,
  }));

  // Pie chart data
  const productPieData = topProducts.map((p) => ({
    type: p.product,
    value: p.quantity,
  }));

  // ====== Xuất Excel ======
  const handleExportExcel = () => {
    const exportData = topProducts.map((p) => ({
      SảnPhẩm: p.product,
      SoLuong: p.quantity,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoSanPham");
    XLSX.writeFile(wb, "bao_cao_san_pham.xlsx");
    message.success("Xuất báo cáo Excel thành công!");
  };

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
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space>
              <RangePicker
                format="YYYY-MM-DD"
                value={dateRange.length ? dateRange : null}
                onChange={handleFilterByDate}
              />
              <Select defaultValue="today" style={{ width: 150 }} onChange={handleQuickFilter}>
                <Option value="today">Hôm nay</Option>
                <Option value="week">Tuần này</Option>
                <Option value="month">Tháng này</Option>
                <Option value="year">Năm nay</Option>
              </Select>
            </Space>
            <Button type="primary" style={{ background: "#226533" }} onClick={handleExportExcel}>
              Xuất báo cáo Excel
            </Button>
          </div>

          {/* Thống kê tổng quan */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Tổng số sản phẩm bán được" value={totalProductsSold} />
              </Card>
            </Col>
            {topProducts[0] && (
              <Col span={6}>
                <Card>
                  <Statistic title="Sản phẩm bán chạy nhất" value={topProducts[0].product} />
                </Card>
              </Col>
            )}
          </Row>

          {/* Biểu đồ */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Số lượng sản phẩm bán theo thời gian">
                <Column data={salesByDate} xField="date" yField="value" label={{ position: "top" }} color="#226533" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Tỷ lệ bán theo sản phẩm">
                <Pie
                  data={productPieData}
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
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsProductPage;
