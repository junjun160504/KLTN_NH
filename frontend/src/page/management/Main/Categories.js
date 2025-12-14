import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Layout,
  Button,
  Input,
  Select,
  App,
  Popconfirm,
  Form,
  Switch,
  Table,
  Pagination,
  ConfigProvider,
  Modal,
} from "antd";

import vi_VN from "antd/lib/locale/vi_VN";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Content } = Layout;
const { Option } = Select;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const CategoriesPage = () => {
  const { message } = App.useApp();
  const { canAccess } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Quản lý danh mục");

  const [allCategories, setAllCategories] = useState([]); // dữ liệu gốc
  const [categories, setCategories] = useState([]); // dữ liệu hiển thị
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("available");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);

  // ================= API =================
  // Fetch danh mục
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/categories`);
      const data = res.data.data || [];
      setAllCategories(data);
      setCategories(data);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách danh mục");
    } finally {
      setLoading(false);
    }
  }, [message]);

  // Xóa danh mục (permanent delete)
  async function handleDeleteCategory(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/menu/admin/categories/${id}/permanent`);

      // Cập nhật state ngay lập tức
      setAllCategories(prev => prev.filter(item => item.id !== id));
      setCategories(prev => prev.filter(item => item.id !== id));

      message.success("Xóa danh mục thành công!");
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error("Xóa danh mục thất bại!");
    }
  }

  // Hàm xử lý submit thêm danh mục mới
  const handleAddCategory = async (values) => {
    try {
      // ✅ Kiểm tra tên danh mục trùng
      const duplicateName = allCategories.find(
        cat => cat.name.toLowerCase().trim() === values.name.toLowerCase().trim()
      );

      if (duplicateName) {
        message.error({
          content: `Danh mục "${values.name}" đã tồn tại trong hệ thống!`,
          duration: 3,
        });
        return;
      }

      await axios.post(`${REACT_APP_API_URL}/menu/admin/categories`, {
        name: values.name,
        description: values.description || "",
        is_available: values.is_available ? 1 : 0,
      });
      message.success("Thêm danh mục mới thành công!");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchCategories();
    } catch (err) {
      console.error("API POST error:", err);
      message.error("Thêm danh mục thất bại!");
    }
  };

  // Hàm mở drawer chỉnh sửa
  const openEditDrawer = (category) => {
    setEditingCategory(category);
    editForm.setFieldsValue({
      name: category.name,
      description: category.description,
      is_available: category.is_available === 1,
    });
    setEditDrawerOpen(true);
  };

  // Hàm xử lý submit chỉnh sửa
  const handleEditCategory = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/menu/admin/categories/${editingCategory.id}`, {
        name: values.name,
        description: values.description || "",
        is_available: values.is_available ? 1 : 0,
      });
      message.success("Cập nhật danh mục thành công!");
      setEditDrawerOpen(false);
      editForm.resetFields();
      fetchCategories();
    } catch (err) {
      console.error("API PUT error:", err);
      message.error("Cập nhật danh mục thất bại!");
    }
  };

  // ================= Effect =================
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= Filter logic =================
  useEffect(() => {
    let filtered = [...allCategories];

    // Lọc theo tên (search)
    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(keyword)
      );
    }

    // Lọc theo trạng thái
    if (statusFilter === "available") {
      filtered = filtered.filter((cat) => cat.is_available === 1);
    } else if (statusFilter === "unavailable") {
      filtered = filtered.filter((cat) => cat.is_available === 0);
    }

    setCategories(filtered);
  }, [searchText, statusFilter, allCategories]);

  // Reset về trang 1 khi thay đổi search hoặc status filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  // ======= Table Columns =======
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
      title: <div className="text-center w-full">Tên danh mục</div>,
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
      width: '100%',
      render: (_, record) => (
        <div className="flex flex-col min-w-0 flex-1 py-1">
          <span className="font-semibold text-gray-800 text-sm leading-tight mb-1" title={record.name}>
            {record.name}
          </span>
          {record.description && (
            <span className="text-xs text-gray-500 line-clamp-1" title={record.description}>
              {record.description}
            </span>
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
        { text: 'Hoạt động', value: 1 },
        { text: 'Tạm dừng', value: 0 },
      ],
      onFilter: (value, record) => record.is_available === value,
      render: (is_available) => (
        <div className="flex items-center justify-center">
          {is_available === 1 ? (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
              <span className="text-xs font-medium text-green-700">Hoạt động</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              <span className="text-xs font-medium text-red-700">Tạm dừng</span>
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
          {canAccess(['OWNER', 'MANAGER']) && (
            <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined className="text-blue-600 group-hover:text-blue-500" />}
                onClick={() => openEditDrawer(record)}
                title="Chỉnh sửa"
              />
            </div>
          )}

          {canAccess(['OWNER', 'MANAGER']) && (
            <Popconfirm
              title={<span className="font-semibold">Xác nhận xóa danh mục?</span>}
              description={
                <div className="text-sm text-gray-600">
                  Danh mục <span className="font-medium text-gray-800">"{record.name}"</span> sẽ bị xóa
                </div>
              }
              onConfirm={() => handleDeleteCategory(record.id)}
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
          )}
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
                placeholder="Tìm danh mục..."
                style={{ width: 450 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

              <Select
                value={statusFilter}
                style={{ width: 200 }}
                onChange={setStatusFilter}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="available">Đang hoạt động</Option>
                <Option value="unavailable">Tạm dừng</Option>
              </Select>

              {canAccess(['OWNER', 'MANAGER']) && (
                <Button
                  type="primary"
                  style={{ background: "#226533" }}
                  onClick={() => setDrawerOpen(true)}
                >
                  + Thêm danh mục mới
                </Button>
              )}
            </div>
          </div>

          {/* Categories Table */}
          <ConfigProvider locale={vi_VN}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <Table
                key={`table-${searchText}-${statusFilter}-${currentPage}`}
                columns={columns}
                dataSource={categories.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                loading={loading}
                rowKey={(record, index) => `row-${currentPage}-${index}-${record.id}`}
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
                      <div className="text-gray-400 text-6xl mb-4">📂</div>
                      <div className="text-gray-500 font-medium">Không tìm thấy danh mục nào</div>
                      <div className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc thêm danh mục mới</div>
                    </div>
                  )
                }}
              />

              {/* Pagination tách riêng với đường line phân cách */}
              {categories.length > 0 && (
                <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                  <div className="flex justify-end flex-wrap gap-4">

                    {/* Pagination Component */}
                    <ConfigProvider locale={vi_VN}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={categories.length}
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
        </Content>
      </Layout>

      {/* Modal thêm danh mục mới - Japanese Style */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <PlusOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 m-0">Thêm danh mục mới</h3>
              <p className="text-xs text-gray-500 m-0">Tạo danh mục mới cho menu</p>
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
          onFinish={handleAddCategory}
          initialValues={{ is_available: true }}
          className="mt-6"
        >
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                Thông tin cơ bản
              </h4>

              <Form.Item
                label={<span className="text-sm font-medium text-gray-700">Tên danh mục</span>}
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên danh mục!" },
                  { min: 2, message: "Tên danh mục phải có ít nhất 2 ký tự!" },
                ]}
                className="mb-4"
              >
                <Input
                  placeholder="Ví dụ: Món chính, Đồ uống..."
                  className="rounded-lg h-11"
                  maxLength={100}
                  showCount
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium text-gray-700">Mô tả</span>}
                name="description"
                className="mb-0"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Mô tả chi tiết về danh mục..."
                  className="rounded-lg"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>

            {/* Trạng thái */}
            <div className="bg-[#edf7f3] rounded-xl p-6 border border-amber-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                Trạng thái
              </h4>

              <Form.Item
                name="is_available"
                valuePropName="checked"
                className="mb-0"
              >
                <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200">
                  <Switch
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                    defaultChecked
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 m-0">
                      Hiện đang hoạt động
                    </p>
                    <p className="text-xs text-gray-400 m-0">
                      Danh mục sẽ hiển thị trên hệ thống
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
              <PlusOutlined /> Thêm mới
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa danh mục - Japanese Style */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <EditOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 m-0">Chỉnh sửa danh mục</h3>
              <p className="text-xs text-gray-500 m-0">Cập nhật thông tin danh mục</p>
            </div>
          </div>
        }
        open={editDrawerOpen}
        onCancel={() => {
          setEditDrawerOpen(false);
          editForm.resetFields();
          setEditingCategory(null);
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
          onFinish={handleEditCategory}
          className="mt-6"
        >
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                Thông tin cơ bản
              </h4>

              <Form.Item
                label={<span className="text-sm font-medium text-gray-700">Tên danh mục</span>}
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên danh mục!" },
                  { min: 2, message: "Tên danh mục phải có ít nhất 2 ký tự!" },
                ]}
                className="mb-4"
              >
                <Input
                  placeholder="Ví dụ: Món chính, Đồ uống..."
                  className="rounded-lg h-11"
                  maxLength={100}
                  showCount
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium text-gray-700">Mô tả</span>}
                name="description"
                className="mb-0"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Mô tả chi tiết về danh mục..."
                  className="rounded-lg"
                  maxLength={500}
                  showCount
                />
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
                >
                  <Switch
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                  />
                </Form.Item>
                <div>
                  <p className="text-sm font-medium text-gray-700 m-0">
                    {editForm.getFieldValue('is_available') ? 'Hiện đang hoạt động' : 'Tạm dừng'}
                  </p>
                  <p className="text-xs text-gray-400 m-0">
                    {editForm.getFieldValue('is_available')
                      ? 'Danh mục sẽ hiển thị trên hệ thống'
                      : 'Danh mục sẽ bị ẩn khỏi hệ thống'}
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
                setEditingCategory(null);
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
    </Layout>
  );
};

export default CategoriesPage;
