import React, { useState } from "react";
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Space,
  ConfigProvider,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Pagination,
} from "antd";
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  UserOutlined,
  TeamOutlined,
  RobotOutlined,
  BarChartOutlined,
  BellOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CustomerPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState("Khách hàng");
  const [currentPage, setCurrentPage] = useState(1);

  const userMenu = {
    items: [
      { key: "1", label: <span style={{ display: "block", marginBottom: 12 }}>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  const handleMenuClick = (e) => {
    const mapTitle = {
      dashboard: "Tổng quan",
      orders: "Đơn hàng",
      menu: "Thực đơn",
      customers: "Khách hàng",
      staff: "Nhân viên",
      chatbot: "Chatbot",
      report: "Báo cáo",
    };
    setPageTitle(mapTitle[e.key] || "");
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
    {
      title: "SDT / Email",
      dataIndex: "phone",
      key: "phone",
    },
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
    {
      title: "Số đơn hàng",
      dataIndex: "orders",
      key: "orders",
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "total",
      key: "total",
      render: (total) => <span style={{ color: "orange", fontWeight: 500 }}>{total}</span>,
    },
    {
      title: "Lần cuối ghé",
      dataIndex: "lastVisit",
      key: "lastVisit",
    },
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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#226533",
          fontSize: 16,
        },
        components: {
          Menu: {
            itemHeight: 70,
            itemSelectedBg: "#226533",
            itemSelectedColor: "#fff",
            fontSize: 20,
            iconSize: 28,
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: "#fff",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              height: 100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {collapsed ? (
              <img src="/assets/images/Logo.png" alt="logosmall" style={{ height: 40 }} />
            ) : (
              <img src="/assets/images/Logo.png" alt="logo" style={{ height: 80 }} />
            )}
          </div>

          <Menu
            mode="inline"
            defaultSelectedKeys={["customers"]}
            onClick={handleMenuClick}
            items={[
              { key: "dashboard", icon: <AppstoreOutlined style={{ fontSize: 28 }} />, label: "Tổng quan" },
              { key: "orders", icon: <ShoppingCartOutlined style={{ fontSize: 28 }} />, label: "Đơn hàng" },
              { key: "menu", icon: <CoffeeOutlined style={{ fontSize: 28 }} />, label: "Thực đơn" },
              { key: "customers", icon: <UserOutlined style={{ fontSize: 28 }} />, label: "Khách hàng" },
              { key: "staff", icon: <TeamOutlined style={{ fontSize: 28 }} />, label: "Nhân viên" },
              { key: "chatbot", icon: <RobotOutlined style={{ fontSize: 28 }} />, label: "Chatbot" },
              { key: "report", icon: <BarChartOutlined style={{ fontSize: 28 }} />, label: "Báo cáo" },
            ]}
          />
        </Sider>

        <Layout
          style={{
            marginLeft: collapsed ? 80 : 220,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <Header
            style={{
              background: "#fff",
              padding: "0 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "fixed",
              top: 0,
              right: 0,
              left: collapsed ? 80 : 220,
              zIndex: 90,
              height: 64,
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 20, width: 40, height: 40 }}
              />
              <span style={{ fontSize: 20, fontWeight: "bold", color: "#226533" }}>
                {pageTitle}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <BellOutlined style={{ fontSize: 22, marginRight: 20, color: "#226533" }} />
              <Dropdown menu={userMenu}>
                <Button type="text" style={{ fontSize: 16, color: "#333" }}>
                  <Space>
                    <UserOutlined /> ThuyDung (Quản lý)
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            </div>
          </Header>

          {/* Content */}
          <Content
            style={{
              marginTop: 64,
              padding: 20,
              background: "#f9f9f9",
              flex: 1,
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
            <Table dataSource={dataSource} columns={columns} pagination={false} bordered />
          </Content>

          {/* Footer */}
          <Footer
            style={{
              background: "#fff",
              padding: "10px 20px",
              borderTop: "1px solid #eee",
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
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default CustomerPage;
