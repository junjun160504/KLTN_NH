import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Form,
  Image,
  Table,
  Pagination,
  ConfigProvider,
  Modal,
  Upload,
  InputNumber,
  Switch,
} from "antd";

import vi_VN from "antd/lib/locale/vi_VN";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import * as XLSX from "xlsx";

const { Content } = Layout;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingFood, setEditingFood] = useState(null);

  // Import Excel state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [updateMode, setUpdateMode] = useState(false);
  const [skipMode, setSkipMode] = useState(true);
  const [importing, setImporting] = useState(false);

  // ================= API =================
  // Fetch món ăn dựa trên category (sử dụng useCallback để tránh warning)
  const fetchFoods = useCallback(async (categoryId = "all") => {
    try {
      setLoading(true);
      console.log("Fetching foods for category:", categoryId);

      let res;
      if (categoryId === "all") {
        // Fetch tất cả món
        res = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/all`);
      } else {
        // Fetch theo category
        res = await axios.get(
          `${REACT_APP_API_URL}/menu/cus/menus/category/${categoryId}`
        );
      }

      const data = res.data.data || [];
      setAllFoods(data);
      setFoods(data);
    } catch (err) {
      console.error("API GET error:", err);
      const errorMsg = categoryId === "all"
        ? "Không tải được món ăn"
        : "Không tải được món ăn của danh mục này";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

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
      await axios.delete(`${REACT_APP_API_URL}/menu/admin/menus/${id}/permanent`);

      // Cập nhật state ngay lập tức - remove item khỏi danh sách
      setAllFoods(prev => prev.filter(item => item.id !== id));
      setFoods(prev => prev.filter(item => item.id !== id));

      message.success("Xóa món ăn thành công");

      // Không cần fetchFoods() nữa vì đã update state
      // Giữ nguyên trang hiện tại (currentPage không thay đổi)
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error("Xóa món ăn thất bại");
    }
  }

  // Hàm xử lý submit thêm món mới
  const handleAddFood = async (values) => {
    try {
      await axios.post(`${REACT_APP_API_URL}/menu/admin/menus`, {
        name: values.name,
        price: values.price,
        description: values.description || "",
        category: values.category,
        image_url: values.image_url || "",
        is_available: values.is_available ? 1 : 0, // Convert boolean to 0/1 for API
      });
      message.success("Thêm món mới thành công!");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchFoods(activeCategory); // Refresh với category hiện tại
    } catch (err) {
      if (err?.errorFields) return; // Lỗi validate
      message.error("Thêm món mới thất bại!");
    }
  };

  // Hàm mở popup chỉnh sửa
  const openEditDrawer = (food) => {
    setEditingFood(food);

    // Xử lý categories - chuyển từ array of objects sang array of ids
    let categoryIds = [];
    if (food.categories && Array.isArray(food.categories)) {
      categoryIds = food.categories.map(cat => cat.id);
    } else if (food.category) {
      // Fallback nếu backend vẫn trả về format cũ
      categoryIds = Array.isArray(food.category) ? food.category : [food.category];
    }

    editForm.setFieldsValue({
      ...food,
      category: categoryIds,
    });
    setEditDrawerOpen(true);
  };

  // Hàm xử lý submit chỉnh sửa
  const handleEditFood = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/menu/admin/menus/${editingFood.id}`, {
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
      fetchFoods(activeCategory); // Refresh với category hiện tại
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Cập nhật món thất bại!");
    }
  };

  // ================= Effect =================
  useEffect(() => {
    fetchCategories();
    fetchFoods("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect để fetch lại khi chuyển category
  useEffect(() => {
    fetchFoods(activeCategory);
  }, [activeCategory, fetchFoods]);

  // ================= Filter logic =================
  useEffect(() => {
    let filtered = [...allFoods];

    // Lọc theo tên (search)
    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter((f) =>
        (f.name || "").toLowerCase().includes(keyword)
      );
    }

    // Không cần lọc theo category ở đây nữa vì đã fetch từ API
    // API đã trả về đúng dữ liệu theo category rồi

    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      filtered = filtered.filter((f) =>
        statusFilter === "active"
          ? f.is_available === 1
          : f.is_available === 0
      );
    }

    setFoods(filtered);
    // Chỉ reset về trang 1 khi user thay đổi filter (search hoặc status)
    // Không reset khi chỉ xóa item (allFoods thay đổi nhưng filter không đổi)
  }, [searchText, statusFilter, allFoods]);

  // Reset về trang 1 khi thay đổi search hoặc status filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  // ======= Xử lý xuất Excel =======
  const handleExportExcel = () => {
    // Chuyển dữ liệu hiện tại thành sheet
    const exportData = foods.map((item) => ({
      "Tên món": item.name,
      "Giá": item.price,
      "Danh mục": item.categories && item.categories.length > 0
        ? item.categories.map(cat => cat.name).join(", ")
        : "Chưa phân loại",
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

  // ======= Table Columns =======


  const colorList = [
    "blue",
    "green",
    "purple",
    "red",
    "geekblue",
    "volcano",
    "orange",
    "gold",
    // "lime",
    "cyan",
  ];
  const columns = [
    {
      title: "ID",
      key: "index",
      dataIndex: 'id',
      align: 'center',
      width: 60,
      render: (_, record) => {
        return <div className="flex items-center justify-center">
          <span className="font-medium text-gray-700">{record.id}</span>
        </div>
      }
    },
    {
      // title: "Món ăn",
      title: <div className="text-center w-full">Tên món ăn</div>,
      key: "food",
      sorter: (a, b) => a.name.localeCompare(b.name), // 🔹 sắp xếp theo tên
      sortDirections: ['ascend', 'descend'], // 🔹 cho phép 2 chiều
      width: '100%',
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div className="relative group">
            <Image
              src={record.image_url || 'https://via.placeholder.com/56x56?text=No+Image'}
              alt={record.name}
              width={56}
              height={56}
              className="rounded-lg object-cover shadow-sm border border-gray-100"
              fallback="https://via.placeholder.com/56x56?text=No+Image"
              preview={{
                mask: (
                  <div className="flex items-center justify-center">
                    <EyeOutlined className="text-white text-lg" />
                  </div>
                )
              }}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-gray-800 text-sm leading-tight mb-1" title={record.name}>
              {record.name}
            </span>
            {record.description && (
              <span className="text-xs text-gray-500 line-clamp-1" title={record.description}>
                {record.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Giá tiền",
      dataIndex: "price",
      key: "price",
      width: 130,
      align: 'center',
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-green-600 text-base">
            {Number(price).toLocaleString('vi-VN')}
          </span>
          {/* <span className="text-xs text-gray-500">VNĐ</span> */}
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "categories",
      key: "categories",
      width: 180,
      align: 'center',
      render: (categories) => (
        <div className="flex flex-wrap gap-1">
          {categories && categories.length > 0 ? (
            categories.map((cat, index) => (
              <Tag
                key={`${cat.id}-${index}`}
                color={colorList[cat.id % colorList.length]} // xoay vòng danh sách màu
                className="m-0 px-2 py-0.5 rounded-lg text-xs font-medium"
              >
                {cat.name}
              </Tag>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">Chưa phân loại</span>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_available",
      key: "is_available",
      width: 140,
      align: 'center',
      filters: [
        { text: 'Đang bán', value: 1 },
        { text: 'Ngừng bán', value: 0 },
      ],
      onFilter: (value, record) => record.is_available === value,
      render: (is_available) => (
        <div className="flex items-center justify-center">
          {is_available === 1 ? (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
              {/* <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> */}
              <span className="text-xs font-medium text-green-700">Đang bán</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              {/* <div className="w-2 h-2 bg-red-500 rounded-full"></div> */}
              <span className="text-xs font-medium text-red-700">Ngừng bán</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-blue-600 group-hover:text-blue-500" />}
              onClick={() => openEditDrawer(record)}
              title="Chỉnh sửa"
            />
          </div>

          <Popconfirm
            title={<span className="font-semibold">Xác nhận xóa món?</span>}
            description={
              <div className="text-sm text-gray-600">
                Món <span className="font-medium text-gray-800">"{record.name}"</span> sẽ bị xóa vĩnh viễn
              </div>
            }
            onConfirm={() => handleDeleteFood(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: 'small' }}
            cancelButtonProps={{ size: 'small' }}
          >
            <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined className="text-red-600 group-hover:text-red-500" />}
                title="Xóa"
              />
            </div>

          </Popconfirm>
        </div>
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
                style={{ width: 320, fontWeight: "bold", fontSize: 16 }}
                onChange={(val) => {
                  setActiveCategory(val);
                  // Reset search khi chuyển category để kết quả rõ ràng
                  setSearchText("");
                }}
                loading={loading}
                placeholder="Chọn danh mục..."
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
              <Button onClick={handleExportExcel}>Xuất file Excel</Button>
              <Button
                type="dashed"
                onClick={() => setImportModalOpen(true)}
              >
                Nhập từ Excel
              </Button>
              <Button
                type="primary"
                style={{ background: "#226533" }}
                onClick={() => setDrawerOpen(true)}
              >
                + Thêm món mới
              </Button>
            </div>
          </div>

          {/* Menu Items Table */}
          <ConfigProvider locale={vi_VN}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <Table
                key={`table-${activeCategory}-${searchText}-${statusFilter}-${currentPage}`}
                columns={columns}
                dataSource={foods.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                loading={loading}
                rowKey={(record, index) => `row-${activeCategory}-${currentPage}-${index}-${record.id}`}
                pagination={false}
                bordered={false}
                scroll={{ y: 600 }}
                size="middle"
                tableLayout="fixed"
                rowClassName={(record, index) =>
                  `transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                }
                className="modern-table"
                locale={{
                  emptyText: (
                    <div className="py-12">
                      <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                      <div className="text-gray-500 font-medium">Không tìm thấy món ăn nào</div>
                      <div className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc thêm món mới</div>
                    </div>
                  )
                }}
              />

              {/* Pagination tách riêng với đường line phân cách */}
              {foods.length > 0 && (
                <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                  <div className="flex justify-end flex-wrap gap-4">

                    {/* Pagination Component */}
                    <ConfigProvider locale={vi_VN}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={foods.length}
                        onChange={(page, pageSize) => {
                          setCurrentPage(page);
                          setPageSize(pageSize);
                        }}
                        onShowSizeChange={(current, size) => {
                          setCurrentPage(1);
                          setPageSize(size);
                        }}
                        showSizeChanger
                        showQuickJumper
                        pageSizeOptions={['10', '20', '50', '100']}
                        className="custom-pagination"
                      />
                    </ConfigProvider>

                  </div>
                </div>
              )}
            </div>
          </ConfigProvider>

          {/* Modal thêm món mới - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                  <PlusOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">Thêm món ăn mới</h3>
                  <p className="text-xs text-gray-500 m-0">Tạo món ăn mới cho menu</p>
                </div>
              </div>
            }
            open={drawerOpen}
            onCancel={() => {
              setDrawerOpen(false);
              addForm.resetFields();
            }}
            width={700}
            footer={null}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={addForm}
              layout="vertical"
              onFinish={handleAddFood}
              initialValues={{ is_available: true }}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Ảnh món ăn */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Hình ảnh món ăn
                      </span>
                    }
                    name="image_url"
                  >
                    <Input
                      prefix={<CloudUploadOutlined className="text-gray-400 outline-none" />}
                      placeholder="https://example.com/image.jpg"
                      className="rounded-lg h-11"
                    />
                  </Form.Item>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    💡 Gợi ý: Sử dụng ảnh có tỷ lệ 1:1 hoặc 4:3 để hiển thị đẹp nhất
                  </p>
                </div>

                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Thông tin cơ bản
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Tên món</span>}
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập tên món!" }]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Ví dụ: Sushi Cá Hồi"
                        className="rounded-lg h-11"
                        maxLength={100}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Giá tiền (VNĐ)</span>}
                      name="price"
                      rules={[
                        { required: true, message: "Vui lòng nhập giá!" },
                        {
                          validator: (_, value) => {
                            if (value && value < 0) {
                              return Promise.reject("Giá không được âm!");
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                      className="mb-0"
                    >
                      <InputNumber
                        placeholder="50,000"
                        className="rounded-lg h-11 w-full"
                        min={0}
                        step={1000}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Mô tả</span>}
                    name="description"
                    className="mt-4 mb-0"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Mô tả chi tiết về món ăn, nguyên liệu, cách chế biến..."
                      className="rounded-lg"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </div>

                {/* Phân loại */}
                <div className="bg-gray-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Danh mục
                  </h4>

                  <Form.Item
                    // label={<span className="text-sm font-medium text-gray-700">Chọn danh mục</span>}
                    name="category"
                    className="mb-0"
                  >
                    <Select
                      mode="multiple"
                      placeholder={<span className="text-base">Chọn một hoặc nhiều danh mục</span>}
                      className="rounded-lg"
                      maxTagCount="responsive"
                      size="large"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-500">●</span>
                            {cat.name}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                {/* Trạng thái */}
                <div className="bg-[#edf7f3] rounded-xl p-6 border border-amber-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Trạng thái
                  </h4>

                  <Form.Item
                    // label={<span className="text-sm font-medium text-gray-700">Trạng thái bán hàng</span>}
                    name="is_available"
                    valuePropName="checked"
                    className="mb-0"
                  >
                    <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200">
                      <Switch
                        checkedChildren="Bán"
                        unCheckedChildren="Dừng"
                        defaultChecked
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700 m-0">
                          Hiện đang bán
                        </p>
                        <p className="text-xs text-gray-400 m-0">
                          Món ăn sẽ hiển thị trên menu
                        </p>
                      </div>
                    </div>
                  </Form.Item>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  size="medium"
                  onClick={() => {
                    setDrawerOpen(false);
                    addForm.resetFields();
                  }}
                  className="rounded-lg px-6 h-11"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="medium"
                  htmlType="submit"
                  className="rounded-lg px-8 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <PlusOutlined /> Thêm món
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal chỉnh sửa món - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <EditOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">Chỉnh sửa món ăn</h3>
                  <p className="text-xs text-gray-500 m-0">Cập nhật thông tin món ăn</p>
                </div>
              </div>
            }
            open={editDrawerOpen}
            onCancel={() => {
              setEditDrawerOpen(false);
              editForm.resetFields();
              setEditingFood(null);
            }}
            width={700}
            footer={null}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleEditFood}
              initialValues={{ is_available: 1 }}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Ảnh món ăn */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Hình ảnh món ăn
                      </span>
                    }
                    name="image_url"
                  >
                    <Input
                      prefix={<CloudUploadOutlined className="text-gray-400" />}
                      placeholder="https://example.com/image.jpg"
                      className="rounded-lg h-11"
                    />
                  </Form.Item>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    💡 Gợi ý: Sử dụng ảnh có tỷ lệ 1:1 hoặc 4:3 để hiển thị đẹp nhất
                  </p>
                </div>

                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Thông tin cơ bản
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Tên món</span>}
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập tên món!" }]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Ví dụ: Sushi Cá Hồi"
                        className="rounded-lg h-11"
                        maxLength={100}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Giá tiền (VNĐ)</span>}
                      name="price"
                      rules={[
                        { required: true, message: "Vui lòng nhập giá!" },
                        {
                          validator: (_, value) => {
                            if (value && value < 0) {
                              return Promise.reject("Giá không được âm!");
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                      className="mb-0"
                    >
                      <InputNumber
                        placeholder="50,000"
                        className="rounded-lg h-11 w-full"
                        min={0}
                        step={1000}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Mô tả</span>}
                    name="description"
                    className="mt-4 mb-0"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Mô tả chi tiết về món ăn, nguyên liệu, cách chế biến..."
                      className="rounded-lg"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </div>

                {/* Phân loại */}
                <div className="bg-gray-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Danh mục
                  </h4>

                  <Form.Item
                    name="category"
                    className="mb-0"
                  >
                    <Select
                      mode="multiple"
                      placeholder={<span className="text-base">Chọn một hoặc nhiều danh mục</span>}
                      className="rounded-lg"
                      maxTagCount="responsive"
                      size="large"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-500">●</span>
                            {cat.name}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                {/* Trạng thái */}
                <div className="bg-[#edf7f3] rounded-xl p-6 border border-amber-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Trạng thái
                  </h4>

                  <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200">
                    <Form.Item
                      name="is_available"
                      className="mb-0"
                      valuePropName="checked"
                      getValueFromEvent={(checked) => checked ? 1 : 0}
                      getValueProps={(value) => ({ checked: value === 1 })}
                    >
                      <Switch
                        checkedChildren="Bán"
                        unCheckedChildren="Dừng"
                      />
                    </Form.Item>
                    <div>
                      <p className="text-sm font-medium text-gray-700 m-0">
                        {editForm.getFieldValue('is_available') === 1 ? 'Hiện đang bán' : 'Ngừng bán'}
                      </p>
                      <p className="text-xs text-gray-400 m-0">
                        {editForm.getFieldValue('is_available') === 1
                          ? 'Món ăn sẽ hiển thị trên menu'
                          : 'Món ăn sẽ bị ẩn khỏi menu'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  size="medium"
                  onClick={() => {
                    setEditDrawerOpen(false);
                    editForm.resetFields();
                    setEditingFood(null);
                  }}
                  className="rounded-lg px-6 h-11"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="medium"
                  htmlType="submit"
                  className="rounded-lg px-8 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <EditOutlined /> Cập nhật
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal Import Excel - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <CloudUploadOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">Nhập món từ Excel</h3>
                  <p className="text-xs text-gray-500 m-0">Import danh sách món ăn từ file Excel</p>
                </div>
              </div>
            }
            open={importModalOpen}
            onCancel={() => {
              setImportModalOpen(false);
              setUploadedFile(null);
              setUpdateMode(false);
              setSkipMode(true);
            }}
            width={650}
            footer={null}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <div className="mt-6 space-y-6">
              {/* Download Template Section */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                      Bước 1: Tải file mẫu
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Tải về file Excel mẫu để điền thông tin món ăn theo đúng định dạng
                    </p>
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      className="bg-blue-500 hover:bg-blue-600 border-0 rounded-lg"
                      onClick={async () => {
                        try {
                          const response = await axios.get(
                            `${REACT_APP_API_URL}/menu/admin/menus/template/excel`,
                            { responseType: 'blob' }
                          );
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'menu_template.xlsx');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          message.success('Tải file mẫu thành công!');
                        } catch (err) {
                          console.error('Download error:', err);
                          message.error('Không thể tải file mẫu!');
                        }
                      }}
                    >
                      Tải file mẫu Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload File Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                  Bước 2: Chọn file để import
                </h4>
                <Upload.Dragger
                  accept=".xlsx,.xls"
                  maxCount={1}
                  beforeUpload={(file) => {
                    setUploadedFile(file);
                    return false; // Prevent auto upload
                  }}
                  onRemove={() => setUploadedFile(null)}
                  className="rounded-lg"
                >
                  <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined className="text-orange-500 text-5xl" />
                  </p>
                  <p className="ant-upload-text font-semibold text-gray-700">
                    Kéo thả file hoặc nhấn để chọn
                  </p>
                  <p className="ant-upload-hint text-gray-500">
                    Hỗ trợ file .xlsx, .xls (tối đa 1 file)
                  </p>
                </Upload.Dragger>
              </div>

              {/* Import Options */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                  Bước 3: Tùy chọn import
                </h4>

                <div className="space-y-4">
                  {/* Update Mode */}
                  <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        🔄 Chế độ cập nhật (Update Mode)
                      </p>
                      <p className="text-xs text-gray-500">
                        Bật: Cập nhật món đã tồn tại | Tắt: Chỉ thêm món mới
                      </p>
                    </div>
                    <Switch
                      checked={updateMode}
                      onChange={setUpdateMode}
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </div>

                  {/* Skip Mode */}
                  <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        ⏭️ Chế độ bỏ qua lỗi (Skip Mode)
                      </p>
                      <p className="text-xs text-gray-500">
                        Bật: Bỏ qua dòng lỗi và tiếp tục | Tắt: Dừng khi gặp lỗi
                      </p>
                    </div>
                    <Switch
                      checked={skipMode}
                      onChange={setSkipMode}
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex gap-3">
                  <span className="text-yellow-600 text-xl">💡</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">Lưu ý quan trọng:</p>
                    <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                      <li>Đảm bảo file Excel đúng định dạng template</li>
                      <li>Tên món và giá là bắt buộc</li>
                      <li>Danh mục phải tồn tại trong hệ thống</li>
                      <li>Dữ liệu sẽ được kiểm tra trước khi import</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  size="large"
                  onClick={() => {
                    setImportModalOpen(false);
                    setUploadedFile(null);
                    setUpdateMode(false);
                    setSkipMode(true);
                  }}
                  className="rounded-lg px-6"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<CloudUploadOutlined />}
                  loading={importing}
                  disabled={!uploadedFile}
                  onClick={async () => {
                    if (!uploadedFile) {
                      message.warning('Vui lòng chọn file để import!');
                      return;
                    }

                    try {
                      setImporting(true);

                      // Tạo FormData để upload file
                      const formData = new FormData();
                      formData.append('file', uploadedFile);
                      formData.append('updateExisting', updateMode.toString());
                      formData.append('skipDuplicate', skipMode.toString());

                      // Gọi API import
                      const response = await axios.post(
                        `${REACT_APP_API_URL}/menu/admin/menus/import/excel`,
                        formData,
                        {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        }
                      );

                      const results = response.data.data;

                      // Hiển thị kết quả chi tiết
                      if (results.failed > 0) {
                        message.warning(
                          `Import hoàn tất: ${results.success} thành công, ${results.failed} lỗi. ` +
                          `(Tạo mới: ${results.created}, Cập nhật: ${results.updated}, Bỏ qua: ${results.skipped})`
                        );
                      } else {
                        message.success(
                          `Import thành công ${results.success} món! ` +
                          `(Tạo mới: ${results.created}, Cập nhật: ${results.updated}, Bỏ qua: ${results.skipped})`
                        );
                      }

                      // Đóng modal và refresh danh sách
                      setImportModalOpen(false);
                      setUploadedFile(null);
                      setUpdateMode(false);
                      setSkipMode(true);
                      fetchFoods(activeCategory);
                    } catch (err) {
                      console.error("Import error:", err);
                      const errorMsg = err.response?.data?.message || 'Import thất bại! Kiểm tra file Excel.';
                      message.error(errorMsg);
                    } finally {
                      setImporting(false);
                    }
                  }}
                  className="rounded-lg px-8 bg-gradient-to-r from-orange-500 to-amber-600 border-0 shadow-md hover:shadow-lg transition-all"
                >
                  Bắt đầu Import
                </Button>
              </div>
            </div>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuPage;
