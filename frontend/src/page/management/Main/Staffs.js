import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import useSidebarCollapse from "../../../hooks/useSidebarCollapse";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Layout,
  Button,
  Input,
  Select,
  Tag,
  Popconfirm,
  Form,
  Table,
  Pagination,
  ConfigProvider,
  Modal,
  Radio,
  App
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

const StaffsPage = () => {
  const { message } = App.useApp()
  const { canAccess } = useAuth()
  const [collapsed, setCollapsed] = useSidebarCollapse();
  const [pageTitle] = useState("Quản lý nhân viên");

  const [allStaffs, setAllStaffs] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingStaff, setEditingStaff] = useState(null);

  // ================= API =================
  const fetchStaffs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/employees`);
      const data = res.data.data || [];
      setAllStaffs(data);
      setStaffs(data);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [message]);

  const handleDeleteStaff = async (id) => {
    try {
      await axios.delete(`${REACT_APP_API_URL}/employees/${id}/permanent`);

      // Cập nhật state ngay lập tức
      setAllStaffs(prev => prev.filter(item => item.id !== id));
      setStaffs(prev => prev.filter(item => item.id !== id));

      message.success("Xóa nhân viên thành công!");
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error("Xóa nhân viên thất bại!. Vui lòng kiểm tra tài khoản liên quan!");
    }
  };

  const handleAddStaff = async (values) => {
    try {
      await axios.post(`${REACT_APP_API_URL}/employees`, {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        gender: values.gender || "OTHER",
        address: values.address || null,
      });
      message.success("Thêm nhân viên mới thành công!");
      setModalOpen(false);
      addForm.resetFields();
      fetchStaffs();
    } catch (err) {
      if (err?.errorFields) return;

      const errorMsg = err.response?.data?.message || "Thêm nhân viên thất bại!";

      // Xử lý lỗi phone number đã tồn tại
      if (errorMsg.includes("Phone number") && errorMsg.includes("already exists")) {
        const phoneMatch = errorMsg.match(/Phone number '([^']+)'/);
        const phoneNumber = phoneMatch ? phoneMatch[1] : "";
        addForm.setFields([
          {
            name: "phone",
            errors: [`${phoneNumber} đã tồn tại`],
          },
        ]);
        return;
      }

      // Xử lý lỗi email đã tồn tại
      if (errorMsg.includes("Email") && errorMsg.includes("already exists")) {
        const emailMatch = errorMsg.match(/Email '([^']+)'/);
        const email = emailMatch ? emailMatch[1] : "";
        addForm.setFields([
          {
            name: "email",
            errors: [`${email} đã tồn tại`],
          },
        ]);
        return;
      }

      // Các lỗi khác hiển thị message chung
      message.error(errorMsg);
    }
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    editForm.setFieldsValue({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender,
      address: staff.address,
    });
    setEditModalOpen(true);
  };

  const handleEditStaff = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/employees/${editingStaff.id}`, {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        gender: values.gender || "OTHER",
        address: values.address || null,
      });
      message.success("Cập nhật nhân viên thành công!");
      setEditModalOpen(false);
      editForm.resetFields();
      fetchStaffs();
    } catch (err) {
      if (err?.errorFields) return;

      const errorMsg = err.response?.data?.message || "Cập nhật nhân viên thất bại!";

      // Xử lý lỗi phone number đã tồn tại
      if (errorMsg.includes("Phone number") && errorMsg.includes("already exists")) {
        const phoneMatch = errorMsg.match(/Phone number '([^']+)'/);
        const phoneNumber = phoneMatch ? phoneMatch[1] : "";
        editForm.setFields([
          {
            name: "phone",
            errors: [`Số điện thoại ${phoneNumber} đã tồn tại trong hệ thống`],
          },
        ]);
        return;
      }

      // Xử lý lỗi email đã tồn tại
      if (errorMsg.includes("Email") && errorMsg.includes("already exists")) {
        const emailMatch = errorMsg.match(/Email '([^']+)'/);
        const email = emailMatch ? emailMatch[1] : "";
        editForm.setFields([
          {
            name: "email",
            errors: [`Email ${email} đã tồn tại trong hệ thống`],
          },
        ]);
        return;
      }

      // Các lỗi khác hiển thị message chung
      message.error(errorMsg);
    }
  };

  // ================= Effects =================
  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  // Filter logic
  useEffect(() => {
    let filtered = [...allStaffs];

    // Lọc theo tên/email/phone (search)
    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(keyword) ||
          (s.email || "").toLowerCase().includes(keyword) ||
          (s.phone || "").toLowerCase().includes(keyword)
      );
    }

    // Lọc theo giới tính
    if (genderFilter !== "all") {
      filtered = filtered.filter((s) => s.gender === genderFilter);
    }

    // Lọc theo trạng thái (deleted_at)
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) =>
        statusFilter === "active" ? !s.deleted_at : s.deleted_at
      );
    }

    setStaffs(filtered);
  }, [searchText, genderFilter, statusFilter, allStaffs]);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, genderFilter, statusFilter]);

  // Cột bảng
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      align: "center",
      fixed: "left",
      width: 60,
      render: (id) => (
        <div className="flex items-center justify-center">
          <span className="font-medium text-gray-700">{id}</span>
        </div>
      ),
    },
    {
      title: <div className="text-center w-full">Tên nhân viên</div>,
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
      width: 220,
      render: (name) => (
        <div className="flex justify-center gap-2 py-1">
          <span className="font-semibold text-gray-800 text-sm">{name}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align: "center",
      width: 260,
      render: (email) => (
        <span className="text-sm text-gray-600">{email || "—"}</span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      align: "center",
      width: 160,
      render: (phone) => (
        <span className="text-sm text-gray-600">{phone || "—"}</span>
      ),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      align: "center",
      width: 120,
      render: (gender) => {
        const genderConfig = {
          MALE: { color: "blue", text: "Nam" },
          FEMALE: { color: "pink", text: "Nữ" },
          OTHER: { color: "default", text: "Khác" },
        };
        const config = genderConfig[gender] || genderConfig.OTHER;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      align: "center",
      width: '205px',
      render: (address) => (
        <span className="text-sm text-gray-500 line-clamp-1" title={address}>
          {address || "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "deleted_at",
      key: "deleted_at",
      align: "center",
      width: 140,
      filters: [
        { text: "Hoạt động", value: false },
        { text: "Đã xóa", value: true },
      ],
      onFilter: (value, record) => (value ? !!record.deleted_at : !record.deleted_at),
      render: (deleted_at) => (
        <div className="flex items-center justify-center">
          {!deleted_at ? (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
              <span className="text-xs font-medium text-green-700">Hoạt động</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              <span className="text-xs font-medium text-red-700">Đã xóa</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
            <Button
              type="text"
              size="small"
              icon={
                <EditOutlined className="text-blue-600 group-hover:text-blue-500" />
              }
              onClick={() => openEditModal(record)}
              title="Chỉnh sửa"
            />
          </div>

          {canAccess(['OWNER']) && (
            <Popconfirm
              title={<span className="font-semibold">Xác nhận xóa nhân viên?</span>}
              description={
                <div className="text-sm text-gray-600">
                  Nhân viên{" "}
                  <span className="font-medium text-gray-800">"{record.name}"</span>{" "}
                  sẽ bị xóa vĩnh viễn
                </div>
              }
              onConfirm={() => handleDeleteStaff(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, size: "small" }}
              cancelButtonProps={{ size: "small" }}
            >
              <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <DeleteOutlined className="text-red-600 group-hover:text-red-500" />
                  }
                  title="Xóa"
                />
              </div>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <AppSidebar collapsed={collapsed} currentPageKey="staffs" />

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
                placeholder="Tìm nhân viên theo tên, email, số điện thoại..."
                style={{ width: 450 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

              <Select
                value={genderFilter}
                style={{ width: 200 }}
                onChange={(val) => setGenderFilter(val)}
                placeholder="Chọn giới tính..."
              >
                <Option value="all">Tất cả giới tính</Option>
                <Option value="MALE">Nam</Option>
                <Option value="FEMALE">Nữ</Option>
                <Option value="OTHER">Khác</Option>
              </Select>

              <Select
                value={statusFilter}
                style={{ width: 200 }}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Chọn trạng thái..."
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Đã xóa</Option>
              </Select>

              <Button
                type="primary"
                style={{ background: "#226533" }}
                onClick={() => setModalOpen(true)}
              >
                + Thêm nhân viên
              </Button>
            </div>
          </div>

          {/* Staffs Table */}
          <ConfigProvider locale={vi_VN}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <Table
                key={`table-${genderFilter}-${searchText}-${statusFilter}-${currentPage}`}
                columns={columns}
                dataSource={staffs.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
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
                      <div className="text-gray-400 text-6xl mb-4">👤</div>
                      <div className="text-gray-500 font-medium">Không tìm thấy nhân viên nào</div>
                      <div className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc thêm nhân viên mới</div>
                    </div>
                  )
                }}
              />

              {/* Pagination tách riêng với đường line phân cách */}
              {staffs.length > 0 && (
                <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                  <div className="flex justify-end flex-wrap gap-4">

                    {/* Pagination Component */}
                    <ConfigProvider locale={vi_VN}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={staffs.length}
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

          {/* Modal thêm nhân viên - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                  <PlusOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">Thêm nhân viên mới</h3>
                  <p className="text-xs text-gray-500 m-0">Tạo nhân viên mới cho hệ thống</p>
                </div>
              </div>
            }
            open={modalOpen}
            onCancel={() => {
              setModalOpen(false);
              addForm.resetFields();
            }}
            footer={null}
            width={700}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={addForm}
              layout="vertical"
              onFinish={handleAddStaff}
              initialValues={{ gender: "OTHER" }}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Thông tin cơ bản
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Tên nhân viên</span>}
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập tên nhân viên!" }]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="rounded-lg h-11"
                        maxLength={100}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Giới tính</span>}
                      name="gender"
                      className="mb-0"
                    >
                      <Radio.Group className="w-full">
                        <div className="flex gap-3 pt-2">
                          <Radio value="MALE">
                            <span className="text-sm">Nam</span>
                          </Radio>
                          <Radio value="FEMALE">
                            <span className="text-sm">Nữ</span>
                          </Radio>
                          <Radio value="OTHER">
                            <span className="text-sm">Khác</span>
                          </Radio>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Thông tin liên hệ
                  </h4>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Email</span>}
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                    className="mb-4"
                  >
                    <Input
                      placeholder="example@gmail.com"
                      className="rounded-lg h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Số điện thoại</span>}
                    name="phone"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điện thoại!" },
                      {
                        pattern: /^0\d{9,10}$/,
                        message: "Số điện thoại phải có 10-11 số và bắt đầu bằng 0!",
                      },
                    ]}
                    className="mb-4"
                  >
                    <Input
                      placeholder="0xxxxxxxxx"
                      maxLength={11}
                      className="rounded-lg h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Địa chỉ</span>}
                    name="address"
                    className="mb-0"
                  >
                    <Input.TextArea
                      placeholder="Nhập địa chỉ (tùy chọn)"
                      rows={3}
                      className="rounded-lg"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  size="medium"
                  onClick={() => {
                    setModalOpen(false);
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
                  <PlusOutlined /> Thêm nhân viên
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal chỉnh sửa nhân viên - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <EditOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">Chỉnh sửa nhân viên</h3>
                  <p className="text-xs text-gray-500 m-0">{editingStaff?.name || 'Cập nhật thông tin nhân viên'}</p>
                </div>
              </div>
            }
            open={editModalOpen}
            onCancel={() => {
              setEditModalOpen(false);
              editForm.resetFields();
              setEditingStaff(null);
            }}
            width={700}
            footer={
              <div className="flex justify-end gap-3 px-4 py-4">
                <Button
                  size="medium"
                  onClick={() => {
                    setEditModalOpen(false);
                    editForm.resetFields();
                    setEditingStaff(null);
                  }}
                  className="rounded-lg px-6 h-11"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="medium"
                  onClick={() => editForm.submit()}
                  className="rounded-lg px-8 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <EditOutlined /> Cập nhật
                </Button>
              </div>
            }
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleEditStaff}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Thông tin cơ bản
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Tên nhân viên</span>}
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập tên nhân viên!" }]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="rounded-lg h-11"
                        maxLength={100}
                        showCount
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-sm font-medium text-gray-700">Giới tính</span>}
                      name="gender"
                      className="mb-0"
                    >
                      <Radio.Group className="w-full">
                        <div className="flex gap-3 pt-2">
                          <Radio value="MALE">
                            <span className="text-sm">Nam</span>
                          </Radio>
                          <Radio value="FEMALE">
                            <span className="text-sm">Nữ</span>
                          </Radio>
                          <Radio value="OTHER">
                            <span className="text-sm">Khác</span>
                          </Radio>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>

                {/* Thông tin liên hệ */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Thông tin liên hệ
                  </h4>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Email</span>}
                    name="email"
                    rules={[
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                    className="mb-4"
                  >
                    <Input
                      placeholder="example@gmail.com"
                      className="rounded-lg h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Số điện thoại</span>}
                    name="phone"
                    rules={[
                      {
                        pattern: /^0\d{9,10}$/,
                        message: "Số điện thoại phải có 10-11 số và bắt đầu bằng 0!",
                      },
                    ]}
                    className="mb-4"
                  >
                    <Input
                      placeholder="0xxxxxxxxx"
                      maxLength={11}
                      className="rounded-lg h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-sm font-medium text-gray-700">Địa chỉ</span>}
                    name="address"
                    className="mb-0"
                  >
                    <Input.TextArea
                      placeholder="Nhập địa chỉ (tùy chọn)"
                      rows={3}
                      className="rounded-lg"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StaffsPage;
