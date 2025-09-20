import React, { useState, useEffect } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Table,
  Tag,
  message,
  Popconfirm,
} from "antd";
import axios from "axios";

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const MenuPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Quản lý thực đơn");

  const [allFoods, setAllFoods] = useState([]); // dữ liệu gốc
  const [foods, setFoods] = useState([]); // dữ liệu hiển thị
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ================= API =================
  async function fetchFoods() {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/all`);
      const data = res.data.data || [];
      setAllFoods(data);
      setFoods(data);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được món ăn");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await axios.get(
        `${REACT_APP_API_URL}/menu/cus/menus/categories`
      );
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh mục");
    }
  }

  async function handleDeleteFood(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/menu/manage/delete/${id}`);
      message.success("Xóa món ăn thành công");
      fetchFoods();
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error("Xóa món ăn thất bại");
    }
  }

  // ================= Effect =================
  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, []);

  // ================= Filter logic =================
  useEffect(() => {
    let filtered = [...allFoods];

    // lọc theo tên
    if (searchText.trim() !== "") {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // lọc theo danh mục
    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (f) => String(f.categoryId) === String(activeCategory)
      );
    }

    // lọc theo trạng thái
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (f) =>
          (statusFilter === "active" && f.is_available === 1) ||
          (statusFilter === "inactive" && f.is_available === 0)
      );
    }

    setFoods(filtered);
  }, [searchText, activeCategory, statusFilter, allFoods]);

  // ================= Columns Table =================
  const columns = [
    {
      title: "Tên món",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || "", "vi"),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (price) => (
        <Text strong style={{ color: "#226533" }}>
          {Number(price).toLocaleString()}đ
        </Text>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
      sorter: (a, b) =>
        (a.categoryName || "").localeCompare(b.categoryName || "", "vi"),
      render: (cat) => <Tag color="blue">{cat || "Chưa có"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_available",
      key: "is_available",
      sorter: (a, b) => (a.is_available || 0) - (b.is_available || 0),
      render: (val) =>
        val === 1 ? (
          <Tag color="green">Đang bán</Tag>
        ) : (
          <Tag color="red">Ngừng bán</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small">Chỉnh sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa món này?"
            onConfirm={() => handleDeleteFood(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ================= Render =================
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <AppSidebar collapsed={collapsed} currentPageKey="categorys" />

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
          {/* Bộ lọc */}
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Input.Search
              placeholder="Tìm món ăn..."
              style={{ width: 250 }}
              onSearch={(val) => setSearchText(val)}
              allowClear
            />

            <Select
              value={activeCategory}
              style={{ width: 200 }}
              onChange={(val) => setActiveCategory(val)}
            >
              <Option value="all">Tất cả danh mục</Option>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              style={{ width: 200 }}
              onChange={(val) => setStatusFilter(val)}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Đang bán</Option>
              <Option value="inactive">Ngừng bán</Option>
            </Select>

            <Space>
              <Button>Xuất danh mục</Button>
              <Button type="primary" style={{ background: "#226533" }}>
                + Thêm món mới
              </Button>
            </Space>
          </div>

          {/* Bảng */}
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={foods}
            pagination={{ pageSize: 8 }}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuPage;
