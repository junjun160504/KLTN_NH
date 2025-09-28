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
  Drawer,
  Form,
} from "antd";
import axios from "axios";
import * as XLSX from "xlsx";

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingFood, setEditingFood] = useState(null);

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
      console.log("Categories API result:", res.data); // Thêm dòng này để kiểm tra
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

  // Hàm xử lý submit thêm món mới
  const handleAddFood = async () => {
    try {
      const values = await addForm.validateFields();
      await axios.post(`${REACT_APP_API_URL}/menu`, {
        name: values.name,
        price: values.price,
        description: values.description || "",
        category: values.category,
        image_url: values.image_url || "",
        is_available: values.is_available,
      });
      message.success("Thêm món mới thành công!");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchFoods();
    } catch (err) {
      if (err?.errorFields) return; // Lỗi validate
      message.error("Thêm món mới thất bại!");
    }
  };

  // Hàm mở popup chỉnh sửa
  const openEditDrawer = (food) => {
    setEditingFood(food);
    editForm.setFieldsValue({
      ...food,
      category: Array.isArray(food.category)
        ? food.category
        : [food.categoryId || food.category], // tuỳ backend trả về
    });
    setEditDrawerOpen(true);
  };

  // Hàm xử lý submit chỉnh sửa
  const handleEditFood = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/menu/manage/update/${editingFood.id}`, {
        name: values.name,
        price: values.price,
        description: values.description || "",
        category: values.category,
        image_url: values.image_url || "",
        is_available: values.is_available,
      });
      message.success("Cập nhật món thành công!");
      setEditDrawerOpen(false);
      editForm.resetFields();
      fetchFoods();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Cập nhật món thất bại!");
    }
  };

  // ================= Effect =================
  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, []);

  // ================= Filter logic =================
  useEffect(() => {
    let filtered = [...allFoods];

    // lọc theo tên (loại bỏ khoảng trắng, không phân biệt hoa thường)
    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter((f) =>
        (f.name || "").toLowerCase().includes(keyword)
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
          <Button size="small" onClick={() => openEditDrawer(record)}>
            Chỉnh sửa
          </Button>
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

  // ======= Xử lý xuất Excel =======
  const handleExportExcel = () => {
    // Chuyển dữ liệu hiện tại thành sheet
    const exportData = foods.map((item) => ({
      "Tên món": item.name,
      "Giá": item.price,
      "Danh mục": item.categoryName,
      "Trạng thái": item.is_available === 1 ? "Đang bán" : "Ngừng bán",
      "Mô tả": item.description,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThucDon");
    XLSX.writeFile(wb, "thuc_don.xlsx");
  };

  // ======= Xử lý nhập Excel =======
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Chuyển đổi dữ liệu và gọi API thêm món mới
      for (const row of rows) {
        try {
          await axios.post(`${REACT_APP_API_URL}/menu`, {
            name: row["Tên món"] || "",
            price: row["Giá"] || 0,
            description: row["Mô tả"] || "",
            category: row["Danh mục"] || "",
            image_url: "",
            is_available: row["Trạng thái"] === "Đang bán" ? 1 : 0,
          });
        } catch (err) {
          console.error("Import error:", err);
        }
      }
      message.success("Nhập món từ Excel thành công!");
      fetchFoods();
    };
    reader.readAsBinaryString(file);
  };

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
          <div style={{ marginBottom: 20 }}>
            {/* Dòng 1: Tìm kiếm và lọc */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-start",
                marginBottom: 12,
              }}
            >
              <Input.Search
                placeholder="Tìm món ăn..."
                style={{ width: 450 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

              <Select
                value={activeCategory}
                style={{ width: 320, fontWeight: "bold", fontSize: 16 }} // tăng width, chữ to và đậm hơn
                onChange={(val) => setActiveCategory(val)}
              >
                <Option
                  value="all"
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: "#226533",
                    background: "#e6f4ea",
                  }}
                >
                  Tất cả danh mục
                </Option>
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
            </div>

            {/* Dòng 2: Button, căn phải */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button onClick={handleExportExcel}>Xuất file Excel</Button>
              <label style={{ position: "relative" }}>
                <Button type="dashed">Nhập từ Excel</Button>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                  onChange={handleImportExcel}
                />
              </label>
              <Button
                type="primary"
                style={{ background: "#226533" }}
                onClick={() => setDrawerOpen(true)}
              >
                + Thêm món mới
              </Button>
            </div>
          </div>

          {/* Bảng */}
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={foods}
            pagination={{
              pageSizeOptions: ["5", "8", "10", "20", "50"],
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize: 8,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên tổng ${total} món`,
            }}
          />

          {/* Drawer thêm món mới */}
          <Drawer
            title="Thêm món mới"
            placement="right"
            width={600}
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              addForm.resetFields();
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setDrawerOpen(false);
                    addForm.resetFields();
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button type="primary" onClick={handleAddFood}>
                  Thêm
                </Button>
              </div>
            }
          >
            <Form
              form={addForm}
              layout="vertical"
              initialValues={{ is_available: 1 }}
            >
              <Form.Item
                label="Tên món"
                name="name"
                rules={[{ required: true, message: "Nhập tên món!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Giá"
                name="price"
                rules={[
                  { required: true, message: "Nhập giá!" },
                  {
                    validator: (_, value) => {
                      // Không được nhập rỗng
                      if (value === undefined || value === null || value === "") {
                        return Promise.reject("Nhập giá!");
                      }
                      // Không được nhập số âm
                      if (Number(value) < 0) {
                        return Promise.reject("Giá không được nhỏ hơn 0!");
                      }
                      // Không cho nhập số thập phân
                      if (String(value).includes(".") || String(value).includes(",")) {
                        return Promise.reject("Giá phải là số nguyên dương!");
                      }
                      // Nếu nhập chữ/ký tự đặc biệt/emoji thì chuyển về 0
                      if (!/^\d+$/.test(String(value))) {
                        addForm.setFieldsValue({ price: 0 });
                        return Promise.reject("Chỉ được nhập số nguyên dương!");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                validateStatus={
                  addForm.getFieldError("price").length > 0 ? "error" : undefined
                }
                help={
                  addForm.getFieldError("price").length > 0
                    ? addForm.getFieldError("price")[0]
                    : ""
                }
              >
                <Input
                  type="number"
                  min={0}
                  step={1}
                  onChange={e => {
                    // Nếu nhập chữ/ký tự đặc biệt/emoji thì chuyển về 0
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) {
                      addForm.setFieldsValue({ price: 0 });
                    }
                  }}
                  onWheel={e => e.target.blur()} // Không cho dùng lăn chuột để thay đổi giá trị
                  placeholder="Nhập giá món (đồng)"
                />
              </Form.Item>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: "Chọn danh mục!" }]}
              >
                <Select
                  mode="multiple" // Cho phép chọn nhiều danh mục
                  placeholder="Chọn danh mục"
                  maxTagCount={3}
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Ảnh" name="image_url">
                <Input />
              </Form.Item>
              <Form.Item label="Trạng thái" name="is_available">
                <Select>
                  <Option value={1}>Đang bán</Option>
                  <Option value={0}>Ngừng bán</Option>
                </Select>
              </Form.Item>
            </Form>
          </Drawer>

          {/* Drawer chỉnh sửa món */}
          <Drawer
            title="Chỉnh sửa món"
            placement="right"
            width={600}
            open={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              editForm.resetFields();
              setEditingFood(null);
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setEditDrawerOpen(false);
                    editForm.resetFields();
                    setEditingFood(null);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button type="primary" onClick={handleEditFood}>
                  Lưu
                </Button>
              </div>
            }
          >
            <Form
              form={editForm}
              layout="vertical"
              initialValues={{ is_available: 1 }}
            >
              <Form.Item
                label="Tên món"
                name="name"
                rules={[{ required: true, message: "Nhập tên món!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Giá"
                name="price"
                rules={[
                  { required: true, message: "Nhập giá!" },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === "") {
                        return Promise.reject("Nhập giá!");
                      }
                      if (Number(value) < 0) {
                        return Promise.reject("Giá không được nhỏ hơn 0!");
                      }
                      if (String(value).includes(".") || String(value).includes(",")) {
                        return Promise.reject("Giá phải là số nguyên dương!");
                      }
                      if (!/^\d+$/.test(String(value))) {
                        editForm.setFieldsValue({ price: 0 });
                        return Promise.reject("Chỉ được nhập số nguyên dương!");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                validateStatus={
                  editForm.getFieldError("price").length > 0 ? "error" : undefined
                }
                help={
                  editForm.getFieldError("price").length > 0
                    ? editForm.getFieldError("price")[0]
                    : ""
                }
              >
                <Input
                  type="number"
                  min={0}
                  step={1}
                  onChange={e => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) {
                      editForm.setFieldsValue({ price: 0 });
                    }
                  }}
                  onWheel={e => e.target.blur()}
                  placeholder="Nhập giá món (đồng)"
                />
              </Form.Item>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: "Chọn danh mục!" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn danh mục"
                  maxTagCount={3}
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Ảnh" name="image_url">
                <Input />
              </Form.Item>
              <Form.Item label="Trạng thái" name="is_available">
                <Select>
                  <Option value={1}>Đang bán</Option>
                  <Option value={0}>Ngừng bán</Option>
                </Select>
              </Form.Item>
            </Form>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuPage;
