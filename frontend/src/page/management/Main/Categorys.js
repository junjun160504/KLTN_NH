import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Pagination,
  Tag,
} from "antd";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const MenuPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Thực đơn");
  const [activeCategory, setActiveCategory] = useState("Món đặc trưng");

  // menu user
  const userMenu = {
    items: [
      { key: "1", label: <span style={{ display: "block", marginBottom: 12 }}>Hồ sơ cá nhân</span> },
      { key: "2", label: "Đăng xuất" },
    ],
  };

  // danh sách category
  const categories = [
    "Món đặc trưng",
    "Set Menu",
    "Cuốn Phương Nam",
    "Nộm Thanh Mát",
    "Món ăn chơi",
    "Món rau nhẹ",
    "Món ngon vườn nhà",
  ];

  // dữ liệu món ăn mẫu
  const foodData = [
    {
      key: "1",
      name: "Phở Bò Tái",
      price: "85,000đ",
      category: "Món chính",
      status: "Đang bán",
      img: "/assets/images/pho.jpg",
    },
    {
      key: "2",
      name: "Gỏi Cuốn Tôm",
      price: "45,000đ",
      category: "Khai vị",
      status: "Đang bán",
      img: "/assets/images/goicuon.jpg",
    },
    {
      key: "3",
      name: "Cá Nướng Lá Chuối",
      price: "150,000đ",
      category: "Món chính",
      status: "Ngừng bán",
      img: "/assets/images/canuong.jpg",
    },
    {
      key: "4",
      name: "Cà Phê Sữa Đá",
      price: "25,000đ",
      category: "Đồ uống",
      status: "Đang bán",
      img: "/assets/images/caphe.jpg",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar dùng chung */}
      <AppSidebar collapsed={collapsed} currentPageKey="categorys" />

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
          {/* Bộ lọc và thao tác */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Input.Search placeholder="Tìm món ăn..." style={{ width: 450 }} />
            <Select defaultValue="price" style={{ width: 150 }}>
              <Option value="price">Theo giá</Option>
              <Option value="name">Theo tên</Option>
            </Select>
            <Space>
              <Button>Xuất danh mục</Button>
              <Button type="primary" style={{ background: "#226533" }}>
                + Thêm món mới
              </Button>
            </Space>
          </div>

          {/* Nút phân loại món ăn */}
          <div
            style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10 }}
          >
            {categories.map((cat, index) => (
              <Button
                key={index}
                shape="round"
                type={activeCategory === cat ? "primary" : "default"}
                style={{
                  borderColor: "#226533",
                  color: activeCategory === cat ? "#fff" : "#226533",
                  background: activeCategory === cat ? "#226533" : "#fff",
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Danh sách món ăn */}
          <Row gutter={[16, 16]}>
            {foodData.map((item) => (
              <Col xs={24} sm={12} md={12} lg={6} key={item.key}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={item.name}
                      src={item.img}
                      style={{ height: 160, objectFit: "cover" }}
                    />
                  }
                >
                  <Title level={5}>{item.name}</Title>
                  <Text strong style={{ color: "#226533" }}>{item.price}</Text>
                  <br />
                  <Tag color="blue">{item.category}</Tag>
                  <p style={{ marginTop: 4 }}>{item.status}</p>
                  <Space>
                    <Button size="small">Chỉnh sửa</Button>
                    {item.status === "Ngừng bán" ? (
                      <Button danger size="small">Ngừng bán</Button>
                    ) : (
                      <Button type="primary" size="small">Ngừng bán</Button>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Phân trang */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text>Hiển thị 1 đến 5 trong tổng số 127 món ăn</Text>
            <Pagination defaultCurrent={1} total={127} pageSize={5} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuPage;
