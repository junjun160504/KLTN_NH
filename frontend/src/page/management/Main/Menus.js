import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import useSidebarCollapse from "../../../hooks/useSidebarCollapse";
import {
  Layout,
  Button,
  Input,
  Select,
  Tag,
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
  App,
  Spin,
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
import { compressImage, COMPRESSION_OPTIONS } from "../../../utils/imageCompression";

const { Content } = Layout;
const { Option } = Select;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;




const MenuPage = () => {
  const { message } = App.useApp(); // ✅ Use App hook for message
  const [collapsed, setCollapsed] = useSidebarCollapse();
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

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Upload loading state
  const [isUploading, setIsUploading] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);

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
        ? "Không thể tải danh sách món ăn"
        : "Không thể tải món ăn của danh mục này";
      message.error({
        content: errorMsg,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }, [message]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(
        `${REACT_APP_API_URL}/menu/cus/menus/categories`
      );
      console.log("Categories API result:", res.data); // Thêm dòng này để kiểm tra
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("API GET error:", err);
      message.error({
        content: "Không thể tải danh mục",
        duration: 3,
      });
    }
  }, [message]);

  async function handleDeleteFood(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/menu/admin/menus/${id}/permanent`);

      // Cập nhật state ngay lập tức - remove item khỏi danh sách
      setAllFoods(prev => prev.filter(item => item.id !== id));
      setFoods(prev => prev.filter(item => item.id !== id));

      message.success({
        content: "Xóa món ăn thành công",
        duration: 3,
      });

      // Không cần fetchFoods() nữa vì đã update state
      // Giữ nguyên trang hiện tại (currentPage không thay đổi)
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error({
        content: "Xóa món ăn thất bại",
        duration: 3,
      });
    }
  }

  // Hàm xử lý submit thêm món mới
  const handleAddFood = async (values) => {
    try {
      // ✅ Kiểm tra tên món trùng
      const duplicateName = allFoods.find(
        food => food.name.toLowerCase().trim() === values.name.toLowerCase().trim()
      );

      if (duplicateName) {
        message.error({
          content: `Món "${values.name}" đã tồn tại trong hệ thống!`,
          duration: 3,
        });
        return;
      }

      setIsUploading(true); // ✅ Bật loading ngay khi submit form

      // Create FormData instead of JSON to support file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('price', values.price);
      formData.append('description', values.description || '');
      formData.append('is_available', values.is_available ? 1 : 0);

      // Append categories as JSON string
      if (values.category && values.category.length > 0) {
        formData.append('category', JSON.stringify(values.category));
      }

      // Compress image before upload
      if (imageFile) {
        console.log('📸 Compressing image...');
        const compressedFile = await compressImage(
          imageFile,
          COMPRESSION_OPTIONS.menuItem
        );
        console.log('✅ Compression complete');
        formData.append('image', compressedFile);
      } else if (values.image_url) {
        formData.append('image_url', values.image_url);
      }

      // Upload
      console.log('📤 Uploading...');
      await axios.post(`${REACT_APP_API_URL}/menu/admin/menus`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Upload complete');

      message.success({
        content: "Thêm món ăn thành công",
        duration: 3,
      });
      setDrawerOpen(false);
      addForm.resetFields();
      setImageFile(null);
      setImagePreview(null);
      fetchFoods(activeCategory);
    } catch (err) {
      if (err?.errorFields) return;
      console.error('Add food error:', err);
      message.error({
        content: err.response?.data?.message || "Thêm món ăn thất bại",
        duration: 3,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm mở popup chỉnh sửa
  const openEditDrawer = (food) => {
    setEditingFood(food);

    // Reset image state
    setEditImageFile(null);
    setEditImagePreview(null);

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
      setIsEditUploading(true); // ✅ Bật loading ngay khi submit form

      // Create FormData instead of JSON to support file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('price', values.price);
      formData.append('description', values.description || '');
      formData.append('is_available', values.is_available);

      // Append categories as JSON string
      if (values.category && values.category.length > 0) {
        formData.append('category', JSON.stringify(values.category));
      }

      // Compress image before upload
      if (editImageFile) {
        console.log('📸 Compressing image (edit)...');
        const compressedFile = await compressImage(
          editImageFile,
          COMPRESSION_OPTIONS.menuItem
        );
        console.log('✅ Compression complete (edit)');
        formData.append('image', compressedFile);
      } else if (values.image_url) {
        formData.append('image_url', values.image_url);
      }

      console.log('📤 Uploading (edit)...');
      await axios.put(`${REACT_APP_API_URL}/menu/admin/menus/${editingFood.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Upload complete (edit)');

      message.success({
        content: "Cập nhật món ăn thành công",
        duration: 3,
      });
      setEditDrawerOpen(false);
      editForm.resetFields();
      setEditImageFile(null);
      setEditImagePreview(null);
      fetchFoods(activeCategory);
    } catch (err) {
      if (err?.errorFields) return;
      console.error('Edit food error:', err);
      message.error({
        content: err.response?.data?.message || "Cập nhật món ăn thất bại",
        duration: 3,
      });
    } finally {
      setIsEditUploading(false);
    }
  };

  // ================= Effect =================
  useEffect(() => {
    fetchCategories();
    fetchFoods("all");
  }, [fetchFoods, fetchCategories]);

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
    try {
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

      message.success({
        content: "Xuất file Excel thành công",
        duration: 3,
      });
    } catch (err) {
      console.error("Export Excel error:", err);
      message.error({
        content: "Xuất file Excel thất bại",
        duration: 3,
      });
    }
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
              src={
                record.image_url
                  ? record.image_url.startsWith('http')
                    ? record.image_url
                    : `${REACT_APP_API_URL.replace('/api', '')}${record.image_url}`
                  : 'https://via.placeholder.com/56x56?text=No+Image'
              }
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
    <>
      <Layout style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <AppSidebar collapsed={collapsed} currentPageKey="menus" />

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
                  rowKey={(record) => `row-${record.id}`}
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
              destroyOnHidden
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
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Hình ảnh món ăn
                      </span>

                      {/* Upload ảnh */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-600 mb-2">Tải ảnh lên:</div>
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          showUploadList={true}
                          beforeUpload={(file) => {
                            // Validate file type
                            const isImage = file.type.startsWith('image/');
                            if (!isImage) {
                              message.error('Chỉ chấp nhận file ảnh!');
                              return false;
                            }

                            // Validate file size (5MB)
                            const isLt5M = file.size / 1024 / 1024 < 5;
                            if (!isLt5M) {
                              message.error('Ảnh phải nhỏ hơn 5MB!');
                              return false;
                            }

                            // Set image file for upload
                            setImageFile(file);

                            // Create preview
                            const reader = new FileReader();
                            reader.onload = (e) => setImagePreview(e.target.result);
                            reader.readAsDataURL(file);

                            // Disable URL input when file is selected
                            addForm.setFieldValue('image_url', '');

                            return false; // Prevent auto upload
                          }}
                          onRemove={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          fileList={imageFile ? [{
                            uid: '-1',
                            name: imageFile.name,
                            status: 'done',
                            url: imagePreview
                          }] : []}
                        >
                          {!imageFile && (
                            <div>
                              <CloudUploadOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                              <div style={{ marginTop: 8, fontSize: '13px' }}>Tải ảnh lên</div>
                            </div>
                          )}
                        </Upload>
                      </div>

                      {/* Hoặc nhập URL */}
                      <div>
                        <Form.Item
                          name="image_url"
                          label={<span className="text-xs font-medium text-gray-600">Hoặc nhập URL ảnh:</span>}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            prefix={<CloudUploadOutlined className="text-gray-400" />}
                            placeholder="https://example.com/image.jpg"
                            className="rounded-lg h-10"
                            disabled={!!imageFile}
                            onChange={(e) => {
                              // Clear uploaded file when URL is entered
                              if (e.target.value) {
                                setImageFile(null);
                                setImagePreview(null);
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3 italic">
                      💡 Gợi ý: Tải ảnh lên hoặc nhập URL. Ảnh có tỷ lệ 1:1 hoặc 4:3 hiển thị đẹp nhất (tối đa 5MB)
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
                        maxLength={5000}
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
                      setImageFile(null);
                      setImagePreview(null);
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
                    <p className="text-xs text-gray-500 m-0">{editingFood?.name || 'Cập nhật thông tin món ăn'}</p>
                  </div>
                </div>
              }
              open={editDrawerOpen}
              onCancel={() => {
                setEditDrawerOpen(false);
                editForm.resetFields();
                setEditingFood(null);
                setEditImageFile(null);
                setEditImagePreview(null);
              }}
              width={700}
              footer={
                <div className="flex justify-end gap-3 px-4 py-4">
                  <Button
                    size="medium"
                    onClick={() => {
                      setEditDrawerOpen(false);
                      editForm.resetFields();
                      setEditingFood(null);
                      setEditImageFile(null);
                      setEditImagePreview(null);
                    }}
                    className="rounded-lg px-6 h-11"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="primary"
                    size="medium"
                    onClick={() => editForm.submit()}
                    loading={isEditUploading}
                    className="rounded-lg px-8 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    <EditOutlined /> Cập nhật
                  </Button>
                </div>
              }
              centered
              className="japanese-modal"
              destroyOnHidden
              styles={{
                body: {
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '0px'
                }
              }}
            >
              <style>
                {`
                  .japanese-modal .ant-modal-body::-webkit-scrollbar {
                    width: 6px;
                  }
                  .japanese-modal .ant-modal-body::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .japanese-modal .ant-modal-body::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 3px;
                  }
                  .japanese-modal .ant-modal-body::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                  }
                `}
              </style>
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
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Hình ảnh món ăn
                      </span>

                      {/* Current image preview if exists */}
                      {editingFood?.image_url && !editImageFile && !editForm.getFieldValue('image_url') && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-600 mb-2">Ảnh hiện tại:</div>
                          <div className="inline-block">
                            <Image
                              src={
                                editingFood.image_url.startsWith('http')
                                  ? editingFood.image_url
                                  : `${REACT_APP_API_URL.replace('/api', '')}${editingFood.image_url}`
                              }
                              alt="Current"
                              width={150}
                              height={150}
                              className="rounded-lg object-cover border border-gray-200"
                              fallback="https://via.placeholder.com/150?text=No+Image"
                            />
                          </div>
                        </div>
                      )}

                      {/* Upload ảnh mới */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-600 mb-2">Tải ảnh mới:</div>
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          showUploadList={true}
                          beforeUpload={(file) => {
                            // Validate file type
                            const isImage = file.type.startsWith('image/');
                            if (!isImage) {
                              message.error('Chỉ chấp nhận file ảnh!');
                              return false;
                            }

                            // Validate file size (5MB)
                            const isLt5M = file.size / 1024 / 1024 < 5;
                            if (!isLt5M) {
                              message.error('Ảnh phải nhỏ hơn 5MB!');
                              return false;
                            }

                            // Set image file for upload
                            setEditImageFile(file);

                            // Create preview
                            const reader = new FileReader();
                            reader.onload = (e) => setEditImagePreview(e.target.result);
                            reader.readAsDataURL(file);

                            // Disable URL input when file is selected
                            editForm.setFieldValue('image_url', '');

                            return false; // Prevent auto upload
                          }}
                          onRemove={() => {
                            setEditImageFile(null);
                            setEditImagePreview(null);
                          }}
                          fileList={editImageFile ? [{
                            uid: '-1',
                            name: editImageFile.name,
                            status: 'done',
                            url: editImagePreview
                          }] : []}
                        >
                          {!editImageFile && (
                            <div>
                              <CloudUploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                              <div style={{ marginTop: 8, fontSize: '13px' }}>Tải ảnh mới</div>
                            </div>
                          )}
                        </Upload>
                      </div>

                      {/* Hoặc nhập URL */}
                      <div>
                        <Form.Item
                          name="image_url"
                          label={<span className="text-xs font-medium text-gray-600">Hoặc nhập URL ảnh mới:</span>}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            prefix={<CloudUploadOutlined className="text-gray-400" />}
                            placeholder="https://example.com/image.jpg"
                            className="rounded-lg h-10"
                            disabled={!!editImageFile}
                            onChange={(e) => {
                              // Clear uploaded file when URL is entered
                              if (e.target.value) {
                                setEditImageFile(null);
                                setEditImagePreview(null);
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3 italic">
                      💡 Gợi ý: Tải ảnh mới lên hoặc nhập URL. Để trống nếu giữ ảnh cũ (tối đa 5MB)
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
                        maxLength={5000}
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
              destroyOnHidden
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
                            message.success({
                              content: "Tải file mẫu thành công",
                              duration: 3,
                            });
                          } catch (err) {
                            console.error('Download error:', err);
                            message.error({
                              content: "Không thể tải file mẫu",
                              duration: 3,
                            });
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
                        message.warning({
                          content: "Vui lòng chọn file để import",
                          duration: 3,
                        });
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
                          message.warning({
                            content: `Import hoàn tất: ${results.success} thành công, ${results.failed} lỗi (Tạo mới: ${results.created}, Cập nhật: ${results.updated}, Bỏ qua: ${results.skipped})`,
                            duration: 5,
                          });
                        } else {
                          message.success({
                            content: `Import thành công ${results.success} món ăn (Tạo mới: ${results.created}, Cập nhật: ${results.updated}, Bỏ qua: ${results.skipped})`,
                            duration: 5,
                          });
                        }

                        // Đóng modal và refresh danh sách
                        setImportModalOpen(false);
                        setUploadedFile(null);
                        setUpdateMode(false);
                        setSkipMode(true);
                        fetchFoods(activeCategory);
                      } catch (err) {
                        console.error("Import error:", err);
                        const errorMsg = err.response?.data?.message || 'Import thất bại. Vui lòng kiểm tra file Excel';
                        message.error({
                          content: errorMsg,
                          duration: 4,
                        });
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

      {/* Full Screen Upload Loading Overlay */}
      {(isUploading || isEditUploading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" />
          <div style={{
            marginTop: 24,
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 500
          }}>
            Đang xử lý và tải ảnh lên...
          </div>
          <div style={{
            marginTop: 8,
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Vui lòng chờ trong giây lát
          </div>
        </div>
      )}
    </>
  );
};

export default MenuPage;
