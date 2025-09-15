import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Pagination,
} from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CustomerPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Khách hàng"); // 👈 chỉ giữ pageTitle thôi
  const [currentPage, setCurrentPage] = useState(1);

  // menu user
  const userMenu = {
    items: [
      { key: "1", label: <span style={{ display: "block", marginBottom: 12 }}>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  // Dữ liệu mẫu
  const dataSource = [
    {
      key: "1",
      phone: "09xx xxx 123",
      point: 156,
      orders: 12,
      total: "2,450,000đ",
      lastVisit: "28/08/2025 14:30",
      status: "Khách cũ",
    },
    {
      key: "2",
      phone: "08xx xxx 146",
      point: 0,
      orders: 1,
      total: "320,000đ",
      lastVisit: "27/08/2025 19:15",
      status: "Khách mới",
    },
    {
      key: "3",
      phone: "08xx xxx 456",
      point: 89,
      orders: 8,
      total: "1,780,000đ",
      lastVisit: "25/08/2025 12:45",
      status: "Khách cũ",
    },
  ];

  // Cột bảng
  const columns = [
    { title: "SDT / Email", dataIndex: "phone", key: "phone" },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      render: (point) =>
        point > 0 ? (
          <span style={{ color: "#226533", fontWeight: 500 }}>{point} điểm</span>
        ) : (
          <span style={{ color: "#999" }}>0 điểm</span>
        ),
    },
    { title: "Số đơn hàng", dataIndex: "orders", key: "orders" },
    {
      title: "Tổng chi tiêu",
      dataIndex: "total",
      key: "total",
      render: (total) => (
        <span style={{ color: "orange", fontWeight: 500 }}>{total}</span>
      ),
    },
    { title: "Lần cuối ghé", dataIndex: "lastVisit", key: "lastVisit" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Khách cũ" ? "green" : "blue"}>{status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: () => <Button size="small">Xem chi tiết</Button>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar dùng chung */}
      <AppSidebar collapsed={collapsed} currentPageKey="customers" />

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
          {/* Bộ lọc khách hàng */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Input.Search placeholder="Tìm kiếm theo SDT" style={{ width: 250 }} />

            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: "#226533" }}
              >
                Đăng ký khách hàng mới
              </Button>
              <Button icon={<DownloadOutlined />}>Xuất danh sách</Button>
            </Space>

            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">Tất cả</Option>
              <Option value="old">Khách cũ</Option>
              <Option value="new">Khách mới</Option>
            </Select>

            <RangePicker />
          </div>

          {/* Bảng khách hàng */}
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            style={{ background: "#fff", marginBottom: 16 }}
          />

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Hiển thị 1 đến 5 trong tổng số 127 khách hàng</span>
            <Pagination
              current={currentPage}
              pageSize={5}
              total={127}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CustomerPage;
