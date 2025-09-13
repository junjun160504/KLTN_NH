import React, { useState } from "react";
import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Space,
    ConfigProvider,
    Card,
    Row,
    Col,
    Typography,
    Input,
    Select,
    Pagination,
    Tag,
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
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const MenuPage = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pageTitle, setPageTitle] = useState("Thực đơn");
    // State lưu category đang chọn
    const [activeCategory, setActiveCategory] = useState("Món đặc trưng");

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

    // Danh sách category button
    const categories = [
        "Món đặc trưng",
        "Set Menu",
        "Cuốn Phương Nam",
        "Nộm Thanh Mát",
        "Món ăn chơi",
        "Món rau nhẹ",
        "Món ngon vườn nhà",
    ];

    // Dữ liệu món ăn mẫu
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
                        defaultSelectedKeys={["menu"]}
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

                <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
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
                        <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
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
                                        cover={<img alt={item.name} src={item.img} style={{ height: 160, objectFit: "cover" }} />}
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
        </ConfigProvider>
    );
};

export default MenuPage;
