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
  message,
  Popconfirm,
  Form,
  Table,
  Pagination,
  ConfigProvider,
  Modal,
  Radio,
  Switch,
} from "antd";

import vi_VN from "antd/lib/locale/vi_VN";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Content } = Layout;
const { Option } = Select;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const AccountsPage = () => {
  const { canAccess, user } = useAuth()
  const [collapsed, setCollapsed] = useSidebarCollapse();
  const [pageTitle] = useState("Quản lý tài khoản");

  // Helper function: Check if user can manage target account based on hierarchy
  const canManageAccount = (targetRole) => {
    if (!user) return false;

    // OWNER can manage everyone
    if (user.role === 'OWNER') return true;

    // MANAGER can only manage STAFF
    if (user.role === 'MANAGER' && targetRole === 'STAFF') return true;

    return false;
  };

  const [allAccounts, setAllAccounts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingAccount, setEditingAccount] = useState(null);

  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordForm] = Form.useForm();
  const [resettingAccount, setResettingAccount] = useState(null);

  // State cho danh sách nhân viên
  const [allEmployees, setAllEmployees] = useState([]); // Tất cả nhân viên
  const [employees, setEmployees] = useState([]); // Nhân viên chưa có tài khoản
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ================= API =================
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${REACT_APP_API_URL}/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          includeInactive: true,
        }
      });
      const data = res.data.data || [];
      setAllAccounts(data);
      setAccounts(data);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const res = await axios.get(`${REACT_APP_API_URL}/employees`);
      const data = res.data.data || [];
      // Chỉ lấy nhân viên chưa bị xóa
      const activeEmployees = data.filter(emp => !emp.deleted_at);

      // Lưu tất cả nhân viên
      setAllEmployees(activeEmployees);

      // Lọc ra những nhân viên chưa có tài khoản
      // So sánh với danh sách allAccounts để loại bỏ nhân viên đã có account
      const employeeIdsWithAccount = allAccounts.map(acc => acc.employee_id).filter(Boolean);
      const availableEmployees = activeEmployees.filter(
        emp => !employeeIdsWithAccount.includes(emp.id)
      );

      setEmployees(availableEmployees);
    } catch (err) {
      console.error("API GET employees error:", err);
      message.error("Không tải được danh sách nhân viên");
    } finally {
      setLoadingEmployees(false);
    }
  }, [allAccounts]); // Thêm allAccounts vào dependency

  const handleDeleteAccount = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${REACT_APP_API_URL}/admin/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Cập nhật state ngay lập tức
      setAllAccounts(prev => prev.filter(item => item.id !== id));
      setAccounts(prev => prev.filter(item => item.id !== id));

      message.success("Xóa tài khoản thành công!");
    } catch (err) {
      console.error("API DELETE error:", err);
      const errorMsg = err.response?.data?.message || "Xóa tài khoản thất bại!";
      message.error(errorMsg);
    }
  };

  const handleAddAccount = async (values) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${REACT_APP_API_URL}/admin/register-admin`,
        {
          username: values.username,
          password: values.password,
          role: values.role || "STAFF",
          employee_id: values.employee_id, // Bắt buộc
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Thêm tài khoản mới thành công!");
      setModalOpen(false);
      addForm.resetFields();
      fetchAccounts();
    } catch (err) {
      if (err?.errorFields) return;

      const errorMsg = err.response?.data?.message || "Thêm tài khoản thất bại!";

      // Xử lý lỗi username đã tồn tại
      if (errorMsg.includes("Username") && errorMsg.includes("already exists")) {
        const usernameMatch = errorMsg.match(/Username '([^']+)'/);
        const username = usernameMatch ? usernameMatch[1] : "";
        addForm.setFields([
          {
            name: "username",
            errors: [`${username} đã tồn tại`],
          },
        ]);
        return;
      }

      // Các lỗi khác hiển thị message chung
      message.error(errorMsg);
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    editForm.setFieldsValue({
      username: account.username,
      role: account.role,
    });
    setEditModalOpen(true);
  };

  const handleEditAccount = async () => {
    try {
      const values = await editForm.validateFields();
      const token = localStorage.getItem("token");
      await axios.put(
        `${REACT_APP_API_URL}/admin/${editingAccount.id}`,
        {
          username: values.username,
          role: values.role || "STAFF",
          employee_id: editingAccount.employee_id, // Giữ nguyên employee_id
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Cập nhật tài khoản thành công!");
      setEditModalOpen(false);
      editForm.resetFields();
      fetchAccounts();
    } catch (err) {
      if (err?.errorFields) return;

      const errorMsg = err.response?.data?.message || "Cập nhật tài khoản thất bại!";

      // Xử lý lỗi username đã tồn tại
      if (errorMsg.includes("Username") && errorMsg.includes("already exists")) {
        const usernameMatch = errorMsg.match(/Username '([^']+)'/);
        const username = usernameMatch ? usernameMatch[1] : "";
        editForm.setFields([
          {
            name: "username",
            errors: [`${username} đã tồn tại`],
          },
        ]);
        return;
      }

      // Các lỗi khác hiển thị message chung
      message.error(errorMsg);
    }
  };

  const openResetPasswordModal = (account) => {
    setResettingAccount(account);
    resetPasswordForm.resetFields();
    setResetPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      const token = localStorage.getItem("token");
      await axios.put(
        `${REACT_APP_API_URL}/admin/${resettingAccount.id}/reset-password`,
        {
          newPassword: values.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Đặt lại mật khẩu thành công!");
      setResetPasswordModalOpen(false);
      resetPasswordForm.resetFields();
      setResettingAccount(null);
    } catch (err) {
      if (err?.errorFields) return;
      const errorMsg = err.response?.data?.message || "Đặt lại mật khẩu thất bại!";
      message.error(errorMsg);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = currentStatus ? "deactivate" : "activate";
      await axios.put(
        `${REACT_APP_API_URL}/admin/${id}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success(
        `${currentStatus ? "Vô hiệu hóa" : "Kích hoạt"} tài khoản thành công!`
      );
      fetchAccounts();
    } catch (err) {
      console.error("API Toggle Status error:", err);
      const errorMsg = err.response?.data?.message || "Thao tác thất bại!";
      message.error(errorMsg);
    }
  };

  // ================= Effects =================
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch employees sau khi có danh sách accounts
  useEffect(() => {
    if (allAccounts.length >= 0) {
      fetchEmployees();
    }
  }, [allAccounts, fetchEmployees]);

  // Filter logic
  useEffect(() => {
    let filtered = [...allAccounts];

    // Lọc theo username (search)
    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter((a) =>
        (a.username || "").toLowerCase().includes(keyword)
      );
    }

    // Lọc theo role
    if (roleFilter !== "all") {
      filtered = filtered.filter((a) => a.role === roleFilter);
    }

    // Lọc theo trạng thái (is_active)
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) =>
        statusFilter === "active" ? a.is_active === 1 : a.is_active === 0
      );
    }

    setAccounts(filtered);
  }, [searchText, roleFilter, statusFilter, allAccounts]);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, roleFilter, statusFilter]);

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
      title: <div className="text-center w-full">Tên đăng nhập</div>,
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
      sortDirections: ["ascend", "descend"],
      width: 280,
      render: (username) => (
        <div className="flex justify-center gap-2 py-1">
          <span className="font-semibold text-gray-800 text-sm">{username}</span>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      align: "center",
      width: 185,
      render: (role) => {
        const roleConfig = {
          OWNER: { color: "red", text: "OWNER" },
          MANAGER: { color: "blue", text: "MANAGER" },
          STAFF: { color: "green", text: "STAFF" },
        };
        const config = roleConfig[role] || roleConfig.STAFF;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Nhân viên",
      dataIndex: "employee_name",
      key: "employee_name",
      align: "center",
      width: 160,
      render: (employee_name, record) => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-800">
            {employee_name || "—"}
          </span>
          {/* <span className="text-xs text-gray-500">
            ID: {record.employee_id || "—"}
          </span> */}
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      align: "center",
      width: 180,
      render: (created_at) => (
        <span className="text-sm text-gray-600">
          {created_at ? new Date(created_at).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      width: 200,
      filters: [
        { text: "Hoạt động", value: 1 },
        { text: "Vô hiệu hóa", value: 0 },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (is_active, record) => (
        <div className="flex items-center justify-center">
          {canManageAccount(record.role) ? (
            <Popconfirm
              title={
                <span className="font-semibold">
                  {is_active ? "Vô hiệu hóa" : "Kích hoạt"} tài khoản?
                </span>
              }
              description={
                <div className="text-sm text-gray-600">
                  Tài khoản{" "}
                  <span className="font-medium text-gray-800">
                    "{record.username}"
                  </span>{" "}
                  sẽ bị {is_active ? "vô hiệu hóa" : "kích hoạt"}
                </div>
              }
              onConfirm={() => handleToggleStatus(record.id, is_active)}
              okText={is_active ? "Vô hiệu hóa" : "Kích hoạt"}
              cancelText="Hủy"
              okButtonProps={{
                danger: is_active,
                size: "small",
              }}
              cancelButtonProps={{ size: "small" }}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${is_active
                  ? "bg-green-50 border-green-200 hover:bg-green-100"
                  : "bg-red-50 border-red-200 hover:bg-red-100"
                  }`}
              >
                <span
                  className={`text-xs font-medium ${is_active ? "text-green-700" : "text-red-700"
                    }`}
                >
                  {is_active ? "Hoạt động" : "Vô hiệu hóa"}
                </span>
              </div>
            </Popconfirm>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${is_active
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
                }`}
            >
              <span
                className={`text-xs font-medium ${is_active ? "text-green-700" : "text-red-700"
                  }`}
              >
                {is_active ? "Hoạt động" : "Vô hiệu hóa"}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          {canManageAccount(record.role) && (
            <>
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

              <div className="group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <LockOutlined className="text-orange-600 group-hover:text-orange-500" />
                  }
                  onClick={() => openResetPasswordModal(record)}
                  title="Đặt lại mật khẩu"
                />
              </div>

              <Popconfirm
                title={
                  <span className="font-semibold">Xác nhận xóa tài khoản?</span>
                }
                description={
                  <div className="text-sm text-gray-600">
                    Tài khoản{" "}
                    <span className="font-medium text-gray-800">
                      "{record.username}"
                    </span>{" "}
                    sẽ bị xóa vĩnh viễn
                  </div>
                }
                onConfirm={() => handleDeleteAccount(record.id)}
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
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <AppSidebar collapsed={collapsed} currentPageKey="accounts" />

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
                placeholder="Tìm tài khoản theo tên đăng nhập..."
                style={{ width: 450 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

              <Select
                value={roleFilter}
                style={{ width: 200 }}
                onChange={(val) => setRoleFilter(val)}
                placeholder="Chọn vai trò..."
              >
                <Option value="all">Tất cả vai trò</Option>
                <Option value="OWNER">OWNER</Option>
                <Option value="MANAGER">MANAGER</Option>
                <Option value="STAFF">STAFF</Option>
              </Select>

              <Select
                value={statusFilter}
                style={{ width: 200 }}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Chọn trạng thái..."
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Vô hiệu hóa</Option>
              </Select>

              {canAccess(['OWNER', 'MANAGER']) && (
                <Button
                  type="primary"
                  style={{ background: "#226533" }}
                  onClick={() => setModalOpen(true)}
                >
                  + Thêm tài khoản
                </Button>
              )}
            </div>
          </div>

          {/* Accounts Table */}
          <ConfigProvider
            locale={vi_VN}
            theme={{
              token: {
                colorPrimary: '#3b82f6', // Màu xanh dương thay vì tím
              },
            }}
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <Table
                key={`table-${roleFilter}-${searchText}-${statusFilter}-${currentPage}`}
                columns={columns}
                dataSource={accounts.slice(
                  (currentPage - 1) * pageSize,
                  currentPage * pageSize
                )}
                loading={loading}
                rowKey={(record, index) =>
                  `row-${currentPage}-${index}-${record.id}`
                }
                pagination={false}
                bordered={false}
                scroll={{ y: 600 }}
                size="middle"
                tableLayout="fixed"
                rowClassName={(record, index) =>
                  `transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`
                }
                className="modern-table"
                locale={{
                  emptyText: (
                    <div className="py-12">
                      <div className="text-gray-400 text-6xl mb-4">👤</div>
                      <div className="text-gray-500 font-medium">
                        Không tìm thấy tài khoản nào
                      </div>
                      <div className="text-gray-400 text-sm mt-2">
                        Thử thay đổi bộ lọc hoặc thêm tài khoản mới
                      </div>
                    </div>
                  ),
                }}
              />

              {/* Pagination tách riêng với đường line phân cách */}
              {accounts.length > 0 && (
                <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                  <div className="flex justify-end flex-wrap gap-4">
                    {/* Pagination Component */}
                    <ConfigProvider
                      locale={vi_VN}
                      theme={{
                        token: {
                          colorPrimary: '#3b82f6', // Màu xanh dương thay vì tím
                        },
                      }}
                    >
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={accounts.length}
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
                        pageSizeOptions={["10", "20", "50", "100"]}
                        className="custom-pagination"
                      />
                    </ConfigProvider>
                  </div>
                </div>
              )}
            </div>
          </ConfigProvider>

          {/* Modal thêm tài khoản - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                  <PlusOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">
                    Thêm tài khoản mới
                  </h3>
                  <p className="text-xs text-gray-500 m-0">
                    Tạo tài khoản admin mới cho hệ thống
                  </p>
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
              onFinish={handleAddAccount}
              initialValues={{ role: "STAFF" }}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Thông tin đăng nhập */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Thông tin đăng nhập
                  </h4>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Tên đăng nhập
                      </span>
                    }
                    name="username"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên đăng nhập!",
                      },
                      {
                        min: 3,
                        message: "Tên đăng nhập phải có ít nhất 3 ký tự!",
                      },
                    ]}
                    className="mb-4"
                  >
                    <Input
                      placeholder="Ví dụ: admin123"
                      className="rounded-lg h-11"
                      maxLength={50}
                      showCount
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Mật khẩu
                      </span>
                    }
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu!" },
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                      },
                    ]}
                    className="mb-0"
                  >
                    <Input.Password
                      placeholder="Nhập mật khẩu"
                      className="rounded-lg h-11"
                      maxLength={100}
                    />
                  </Form.Item>
                </div>

                {/* Phân quyền */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Phân quyền
                  </h4>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Vai trò
                      </span>
                    }
                    name="role"
                    className="mb-4"
                  >
                    <Radio.Group className="w-full">
                      <div className="flex flex-col gap-3 pt-2">
                        {user?.role === 'OWNER' && (
                          <Radio value="OWNER">
                            <span className="text-sm font-medium">OWNER</span>
                            <span className="text-xs text-gray-500 ml-2">
                              - Toàn quyền quản trị
                            </span>
                          </Radio>
                        )}
                        {user?.role === 'OWNER' && (
                          <Radio value="MANAGER">
                            <span className="text-sm font-medium">MANAGER</span>
                            <span className="text-xs text-gray-500 ml-2">
                              - Quản lý và xem báo cáo
                            </span>
                          </Radio>
                        )}
                        <Radio value="STAFF">
                          <span className="text-sm font-medium">STAFF</span>
                          <span className="text-xs text-gray-500 ml-2">
                            - Nhân viên bình thường
                          </span>
                        </Radio>
                      </div>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Chọn nhân viên
                      </span>
                    }
                    name="employee_id"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn nhân viên!",
                      },
                    ]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn nhân viên"
                      className="rounded-lg"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      loading={loadingEmployees}
                      notFoundContent={loadingEmployees ? "Đang tải..." : "Không có nhân viên chưa tạo tài khoản"}
                    >
                      {employees.map((emp) => (
                        <Option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.phone || "N/A"}
                        </Option>
                      ))}
                    </Select>
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
                  <PlusOutlined /> Thêm tài khoản
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal chỉnh sửa tài khoản - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <EditOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">
                    Chỉnh sửa tài khoản
                  </h3>
                  <p className="text-xs text-gray-500 m-0">
                    Cập nhật thông tin tài khoản
                  </p>
                </div>
              </div>
            }
            open={editModalOpen}
            onCancel={() => {
              setEditModalOpen(false);
              editForm.resetFields();
              setEditingAccount(null);
            }}
            footer={null}
            width={700}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleEditAccount}
              className="mt-6"
            >
              <div className="space-y-6">
                {/* Thông tin đăng nhập */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Thông tin đăng nhập
                  </h4>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Tên đăng nhập
                      </span>
                    }
                    name="username"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên đăng nhập!",
                      },
                      {
                        min: 3,
                        message: "Tên đăng nhập phải có ít nhất 3 ký tự!",
                      },
                    ]}
                    className="mb-0"
                  >
                    <Input
                      placeholder="Ví dụ: admin123"
                      className="rounded-lg h-11"
                      maxLength={50}
                      showCount
                    />
                  </Form.Item>
                </div>

                {/* Phân quyền */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Phân quyền
                  </h4>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Vai trò
                      </span>
                    }
                    name="role"
                    className="mb-4"
                  >
                    <Radio.Group className="w-full">
                      <div className="flex flex-col gap-3 pt-2">
                        {user?.role === 'OWNER' && (
                          <Radio value="OWNER">
                            <span className="text-sm font-medium">OWNER</span>
                            <span className="text-xs text-gray-500 ml-2">
                              - Toàn quyền quản trị
                            </span>
                          </Radio>
                        )}
                        {user?.role === 'OWNER' && (
                          <Radio value="MANAGER">
                            <span className="text-sm font-medium">MANAGER</span>
                            <span className="text-xs text-gray-500 ml-2">
                              - Quản lý và xem báo cáo
                            </span>
                          </Radio>
                        )}
                        <Radio value="STAFF">
                          <span className="text-sm font-medium">STAFF</span>
                          <span className="text-xs text-gray-500 ml-2">
                            - Nhân viên bình thường
                          </span>
                        </Radio>
                      </div>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Nhân viên
                      </span>
                    }
                    className="mb-0"
                  >
                    <Input
                      value={
                        editingAccount?.employee_id
                          ? (() => {
                            const emp = allEmployees.find(e => e.id === editingAccount.employee_id);
                            return emp ? `${emp.name} - ${emp.phone || "N/A"}` : "N/A";
                          })()
                          : "N/A"
                      }
                      disabled
                      className="rounded-lg h-11 bg-gray-50 cursor-not-allowed"
                    />
                  </Form.Item>
                </div>

                {/* Trạng thái tài khoản */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Trạng thái tài khoản
                  </h4>

                  <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Kích hoạt tài khoản
                      </p>
                      <p className="text-xs text-gray-500">
                        {editingAccount?.is_active
                          ? "Tài khoản đang hoạt động, có thể đăng nhập"
                          : "Tài khoản bị vô hiệu hóa, không thể đăng nhập"}
                      </p>
                    </div>
                    <Switch
                      checked={editingAccount?.is_active === 1}
                      onChange={async (checked) => {
                        try {
                          const token = localStorage.getItem("token");
                          const endpoint = checked ? "activate" : "deactivate";
                          await axios.put(
                            `${REACT_APP_API_URL}/admin/${editingAccount.id}/${endpoint}`,
                            {},
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          message.success(
                            `${checked ? "Kích hoạt" : "Vô hiệu hóa"} tài khoản thành công!`
                          );
                          // Cập nhật state local
                          setEditingAccount({
                            ...editingAccount,
                            is_active: checked ? 1 : 0,
                          });
                          // Refresh danh sách
                          fetchAccounts();
                        } catch (err) {
                          console.error("API Toggle Status error:", err);
                          const errorMsg =
                            err.response?.data?.message || "Thao tác thất bại!";
                          message.error(errorMsg);
                        }
                      }}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      className="bg-gray-300"
                      style={{
                        backgroundColor: editingAccount?.is_active === 1 ? "#10b981" : undefined,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  size="medium"
                  onClick={() => {
                    setEditModalOpen(false);
                    editForm.resetFields();
                    setEditingAccount(null);
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

          {/* Modal đặt lại mật khẩu - Japanese Style */}
          <Modal
            title={
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <LockOutlined className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 m-0">
                    Đặt lại mật khẩu
                  </h3>
                  <p className="text-xs text-gray-500 m-0">
                    {resettingAccount
                      ? `Đặt lại mật khẩu cho: ${resettingAccount.username}`
                      : "Đặt lại mật khẩu tài khoản"}
                  </p>
                </div>
              </div>
            }
            open={resetPasswordModalOpen}
            onCancel={() => {
              setResetPasswordModalOpen(false);
              resetPasswordForm.resetFields();
              setResettingAccount(null);
            }}
            footer={null}
            width={600}
            centered
            className="japanese-modal"
            destroyOnClose
          >
            <Form
              form={resetPasswordForm}
              layout="vertical"
              onFinish={handleResetPassword}
              className="mt-6"
            >
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                    Mật khẩu mới
                  </h4>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Nhập mật khẩu mới
                      </span>
                    }
                    name="newPassword"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu mới!",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                      },
                    ]}
                    className="mb-4"
                  >
                    <Input.Password
                      placeholder="Nhập mật khẩu mới"
                      className="rounded-lg h-11"
                      maxLength={100}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu mới
                      </span>
                    }
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng xác nhận mật khẩu!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("newPassword") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Mật khẩu xác nhận không khớp!")
                          );
                        },
                      }),
                    ]}
                    className="mb-0"
                  >
                    <Input.Password
                      placeholder="Xác nhận mật khẩu mới"
                      className="rounded-lg h-11"
                      maxLength={100}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button
                  size="medium"
                  onClick={() => {
                    setResetPasswordModalOpen(false);
                    resetPasswordForm.resetFields();
                    setResettingAccount(null);
                  }}
                  className="rounded-lg px-6 h-11"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="medium"
                  htmlType="submit"
                  className="rounded-lg px-8 h-11 bg-gradient-to-r from-orange-500 to-amber-600 border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <LockOutlined /> Đặt lại mật khẩu
                </Button>
              </div>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AccountsPage;
