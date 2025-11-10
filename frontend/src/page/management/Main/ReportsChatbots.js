import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  DatePicker,
  Select,
  Table,
  Space,
} from "antd";
import {
  MessageOutlined,
  UserOutlined,
  RobotOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Line, Bar } from "@ant-design/plots";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsChatbots = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Báo cáo Chatbot");

  // Mock data thống kê
  const stats = [
    { title: "Tổng cuộc hội thoại", value: 245, icon: <MessageOutlined />, color: "#1677ff" },
    { title: "Người dùng duy nhất", value: 180, icon: <UserOutlined />, color: "#52c41a" },
    { title: "Tin nhắn TB/cuộc", value: 6.2, icon: <RobotOutlined />, color: "#722ed1" },
    { title: "Tự động xử lý", value: "78%", icon: <RobotOutlined />, color: "#13c2c2" },
    { title: "Chuyển nhân viên", value: "9%", icon: <TeamOutlined />, color: "#fa8c16" },
    { title: "Tỉ lệ fallback", value: "5%", icon: <ExclamationCircleOutlined />, color: "#ff4d4f" },
    { title: "CSAT", value: "4.6/5", icon: <StarOutlined />, color: "#fadb14" },
  ];

  // Mock dữ liệu biểu đồ
  const chatFrequency = [
    { date: "2025-09-16", count: 35 },
    { date: "2025-09-17", count: 42 },
    { date: "2025-09-18", count: 30 },
    { date: "2025-09-19", count: 55 },
    { date: "2025-09-20", count: 48 },
    { date: "2025-09-21", count: 62 },
    { date: "2025-09-22", count: 50 },
  ];

  const intents = [
    { intent: "Giờ mở cửa?", count: 45 },
    { intent: "Có khuyến mãi gì?", count: 38 },
    { intent: "Món ăn đặc biệt?", count: 32 },
    { intent: "Đặt bàn như thế nào?", count: 28 },
  ];

  const conversations = [
    {
      time: "14:23",
      customer: "098****1234",
      intent: "Gợi ý món",
      result: "Tự động",
      messages: 8,
      note: "Đặt combo gia đình",
    },
    {
      time: "14:18",
      customer: "091****5678",
      intent: "Giờ mở cửa",
      result: "Tự động",
      messages: 3,
      note: "-",
    },
    {
      time: "14:15",
      customer: "084****9012",
      intent: "Khuyến mãi",
      result: "Chuyển NV",
      messages: 12,
      note: "Yêu cầu tư vấn đặc biệt",
    },
  ];

  const columns = [
    { title: "Thời gian", dataIndex: "time", key: "time" },
    { title: "Khách", dataIndex: "customer", key: "customer" },
    { title: "Intent đầu", dataIndex: "intent", key: "intent" },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      render: (val) => (
        <span style={{ color: val === "Tự động" ? "green" : "orange" }}>{val}</span>
      ),
    },
    { title: "Số tin nhắn", dataIndex: "messages", key: "messages" },
    { title: "Chú thích", dataIndex: "note", key: "note" },
    {
      title: "Hành động",
      key: "action",
      render: () => <Button type="link">Xem transcript</Button>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <AppSidebar collapsed={collapsed} currentPageKey="report_chatbot" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        {/* Header */}
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
          {/* Filter */}
          <Space style={{ marginBottom: 20, flexWrap: "wrap" }}>
            <Select defaultValue="today" style={{ width: 150 }}>
              <Option value="today">Hôm nay</Option>
              <Option value="week">Tuần này</Option>
              <Option value="month">Tháng này</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">Tất cả ca</Option>
              <Option value="morning">Ca sáng</Option>
              <Option value="evening">Ca tối</Option>
            </Select>
            <Button type="primary" style={{ background: "#226533" }}>
              Xuất báo cáo
            </Button>
          </Space>

          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            {stats.map((s, idx) => (
              <Col span={3} key={idx}>
                <Card>
                  <Statistic
                    title={s.title}
                    value={s.value}
                    prefix={s.icon}
                    valueStyle={{ color: s.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="Tần suất chat theo ngày">
                <Line
                  data={chatFrequency}
                  xField="date"
                  yField="count"
                  smooth
                  height={250}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Intent phổ biến">
                <Bar data={intents} xField="count" yField="intent" height={250} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col span={24}>
              <Card title="Nhật ký cuộc hội thoại">
                <Table
                  dataSource={conversations}
                  columns={columns}
                  rowKey="time"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsChatbots;
