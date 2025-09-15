import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Input,
  Select,
  Table,
  Tag,
  Pagination,
} from "antd";

const { Content } = Layout;
const { Option } = Select;

const StaffsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Nhân viên");
  const [currentPage, setCurrentPage] = useState(1);
  

  // menu user
  const userMenu = {
    items: [
      { key: "1", label: <span>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  // dữ liệu mẫu
  const dataSource = [
    {
      key: "1",
      name: "Trần Thị B",
      email: "tran.b@email.com",
      phone: "098****567",
      role: "Thu ngân",
      date: "15/03/2023",
      status: "Hoạt động",
    },
    {
      key: "2",
      name: "Lê Văn C",
      email: "le.c@email.com",
      phone: "097****234",
      role: "Phục vụ",
      date: "22/02/2023",
      status: "Hoạt động",
    },
    {
      key: "3",
      name: "Phạm Thị D",
      email: "pham.d@email.com",
      phone: "096****789",
      role: "Bếp",
      date: "10/01/2023",
      status: "Ngừng hoạt động",
    },
  ];

  // cột bảng
  const columns = [
    { title: "STT", dataIndex: "key", key: "key" },
    { title: "Tên nhân viên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        let color = "blue";
        if (role === "Thu ngân") color = "cyan";
        if (role === "Phục vụ") color = "orange";
        if (role === "Bếp") color = "green";
        return <Tag color={color}>{role}</Tag>;
      },
    },
    { title: "Ngày vào làm", dataIndex: "date", key: "date" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Hoạt động" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: () => (
        <Space>
          <Button type="link">Sửa</Button>
          <Button type="link">Xem chi tiết</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar dùng chung */}
      <AppSidebar collapsed={collapsed} currentPageKey="staffs"/>

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
          {/* Filter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Input.Search
              placeholder="Nhập tên nhân viên, email hoặc số điện thoại..."
              style={{ width: 300 }}
            />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">Vai trò: Tất cả</Option>
              <Option value="cashier">Thu ngân</Option>
              <Option value="waiter">Phục vụ</Option>
              <Option value="cook">Bếp</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">Trạng thái: Tất cả</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ngừng hoạt động</Option>
            </Select>
            <Space>
              <Button>Xuất danh sách</Button>
              <Button type="primary" style={{ background: "#226533" }}>
                + Thêm nhân viên
              </Button>
            </Space>
          </div>

          {/* Table */}
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
            <span>Hiển thị 1 đến 5 trong tổng số 127 nhân viên</span>
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

export default StaffsPage;
