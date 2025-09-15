import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Table,
  Input,
  Select,
  Tag,
  Pagination,
} from "antd";

const { Content } = Layout;
const { Option } = Select;

const OrderPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState("Đơn hàng");
  const [currentPage, setCurrentPage] = useState(1);

  // menu user
  const userMenu = {
    items: [
      { key: "1", label: <span>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  // data mẫu
  const dataSource = [
    {
      key: "1",
      code: "#PN0015",
      table: "Bàn 02",
      phone: "09xx xxx 123",
      point: 120,
      total: "275,000đ",
      status: "Chờ xác nhận",
    },
    {
      key: "2",
      code: "#PN0014",
      table: "Bàn 03",
      phone: "-",
      point: 0,
      total: "180,000đ",
      status: "Đang phục vụ",
    },
    {
      key: "3",
      code: "#PN0013",
      table: "Bàn 07",
      phone: "08xx xxx 456",
      point: 85,
      total: "320,000đ",
      status: "Đang phục vụ",
    },
    {
      key: "4",
      code: "#PN0012",
      table: "Bàn 05",
      phone: "09xx xxx 123",
      point: 120,
      total: "275,000đ",
      status: "Hủy món",
    },
    {
      key: "5",
      code: "#PN0011",
      table: "Bàn 07",
      phone: "-",
      point: 0,
      total: "180,000đ",
      status: "Đang phục vụ",
    },
    {
      key: "6",
      code: "#PN0010",
      table: "Bàn 07",
      phone: "08xx xxx 456",
      point: 85,
      total: "320,000đ",
      status: "Hoàn tất",
    },
  ];

  // cột bảng
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      render: (t) => <strong>{t}</strong>,
    },
    { title: "Bàn", dataIndex: "table", key: "table" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      render: (p) => <span>{p} điểm</span>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (t) => (
        <span style={{ color: "red", fontWeight: "bold" }}>{t}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        let color = "default";
        if (s === "Chờ xác nhận") color = "orange";
        else if (s === "Đang phục vụ") color = "blue";
        else if (s === "Hoàn tất") color = "green";
        else if (s === "Hủy món") color = "red";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        const isDisabled =
          record.status === "Hủy món" || record.status === "Hoàn tất";

        return (
          <Space>
            <Button size="small">Chi tiết</Button>
            <Button
              type="primary"
              size="small"
              disabled={isDisabled}
              style={{
                background: isDisabled ? "#d9d9d9" : "#226533",
                borderColor: isDisabled ? "#d9d9d9" : "#226533",
                color: isDisabled ? "#999" : "#fff",
              }}
            >
              Thanh toán
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar chung */}
      <AppSidebar
        collapsed={collapsed}
        setPageTitle={setPageTitle}
        currentPageKey="orders" // 👈 highlight menu "Đơn hàng"
      />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        {/* Header chung */}
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
          {/* Filter */}
          <Space
            style={{
              marginBottom: 16,
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Input.Search
              placeholder="Nhập mã đơn hoặc số điện thoại..."
              style={{ width: 250 }}
            />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="serving">Đang phục vụ</Option>
              <Option value="done">Hoàn tất</Option>
              <Option value="cancel">Hủy món</Option>
            </Select>
            <Select defaultValue="today" style={{ width: 120 }}>
              <Option value="today">Hôm nay</Option>
              <Option value="7days">7 ngày qua</Option>
              <Option value="30days">30 ngày qua</Option>
            </Select>
            <Select defaultValue="newest" style={{ width: 160 }}>
              <Option value="newest">Mới nhất → Cũ nhất</Option>
              <Option value="oldest">Cũ nhất → Mới nhất</Option>
            </Select>
            <Button type="primary" style={{ background: "#226533" }}>
              + Tạo đơn mới
            </Button>
            <Button>In hóa đơn</Button>
          </Space>

          {/* Table */}
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            style={{ marginBottom: 16, background: "#fff" }}
          />

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Hiển thị 1 đến 5 trong tổng số 127 đơn hàng</span>
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

export default OrderPage;
