import React, { useState, useEffect } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Input,
  Select,
  Table,
  Tag,
  Pagination,
  Drawer,
  Form,
  message,
  Popconfirm,
} from "antd";
import * as XLSX from "xlsx";

const { Content } = Layout;
const { Option } = Select;

// Mock data
const mockStaffs = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyen.a@email.com",
    phone: "0912345678",
    role: "Thu ngân",
    date: "2023-03-15",
    status: "Hoạt động",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tran.b@email.com",
    phone: "0987654321",
    role: "Phục vụ",
    date: "2023-04-20",
    status: "Hoạt động",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "le.c@email.com",
    phone: "0971112233",
    role: "Bếp",
    date: "2023-01-10",
    status: "Ngừng hoạt động",
  },
  {
    id: 4,
    name: "Phạm Thị D",
    email: "pham.d@email.com",
    phone: "0934567890",
    role: "Phục vụ",
    date: "2022-12-01",
    status: "Hoạt động",
  },
  {
    id: 5,
    name: "Hoàng Văn E",
    email: "hoang.e@email.com",
    phone: "0945556677",
    role: "Bếp",
    date: "2023-05-05",
    status: "Hoạt động",
  },
  {
    id: 6,
    name: "Đỗ Thị F",
    email: "do.f@email.com",
    phone: "0956667788",
    role: "Thu ngân",
    date: "2023-06-15",
    status: "Ngừng hoạt động",
  },
];

const StaffsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Nhân viên");

  const [allStaffs, setAllStaffs] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingStaff, setEditingStaff] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Load mock data
  useEffect(() => {
    setAllStaffs(mockStaffs);
    setStaffs(mockStaffs);
  }, []);

  // Lọc dữ liệu
  useEffect(() => {
    let filtered = [...allStaffs];

    if (searchText.trim() !== "") {
      const keyword = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(keyword) ||
          (s.email || "").toLowerCase().includes(keyword) ||
          (s.phone || "").toLowerCase().includes(keyword)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (s) =>
          (statusFilter === "active" && s.status === "Hoạt động") ||
          (statusFilter === "inactive" && s.status === "Ngừng hoạt động")
      );
    }

    setStaffs(filtered);
    setCurrentPage(1);
  }, [searchText, roleFilter, statusFilter, allStaffs]);

  // Xử lý CRUD
  const handleAddStaff = async () => {
    try {
      const values = await addForm.validateFields();
      const newStaff = {
        id: Date.now(),
        ...values,
      };
      setAllStaffs((prev) => [...prev, newStaff]);
      message.success("Thêm nhân viên mới thành công!");
      setDrawerOpen(false);
      addForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Thêm nhân viên thất bại!");
    }
  };

  const openEditDrawer = (staff) => {
    setEditingStaff(staff);
    editForm.setFieldsValue({ ...staff });
    setEditDrawerOpen(true);
  };

  const handleEditStaff = async () => {
    try {
      const values = await editForm.validateFields();
      setAllStaffs((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, ...values } : s))
      );
      message.success("Cập nhật nhân viên thành công!");
      setEditDrawerOpen(false);
      editForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Cập nhật nhân viên thất bại!");
    }
  };

  const handleDeleteStaff = (id) => {
    setAllStaffs((prev) => prev.filter((s) => s.id !== id));
    message.success("Xóa nhân viên thành công!");
  };

  // Xuất Excel
  const handleExportExcel = () => {
    const exportData = staffs.map((s, idx) => ({
      STT: idx + 1,
      "Tên nhân viên": s.name,
      Email: s.email,
      "Số điện thoại": s.phone,
      "Vai trò": s.role,
      "Ngày vào làm": s.date,
      "Trạng thái": s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhanVien");
    XLSX.writeFile(wb, "nhan_vien.xlsx");
  };

  // Nhập Excel
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

      const importedStaffs = rows.map((row) => ({
        id: Date.now() + Math.random(),
        name: row["Tên nhân viên"] || "",
        email: row["Email"] || "",
        phone: row["Số điện thoại"] || "",
        role: row["Vai trò"] || "",
        date: row["Ngày vào làm"] || "",
        status: row["Trạng thái"] || "Hoạt động",
      }));

      setAllStaffs((prev) => [...prev, ...importedStaffs]);
      message.success("Nhập nhân viên từ Excel thành công!");
    };
    reader.readAsBinaryString(file);
  };

  // Cột bảng
  const columns = [
    { title: "STT", render: (_, __, index) => (currentPage - 1) * pageSize + index + 1 },
    { title: "Tên nhân viên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        let color = "blue";
        if (role === "Thu ngân") color = "cyan";
        if (role === "Phục vụ") color = "orange";
        if (role === "Bếp") color = "green";
        return <Tag color={color}>{role}</Tag>;
      },
    },
    { title: "Ngày vào làm", dataIndex: "date", key: "date" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Hoạt động" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditDrawer(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhân viên này?"
            onConfirm={() => handleDeleteStaff(record.id)}
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

  // Dữ liệu phân trang
  const paginatedData = staffs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} currentPageKey="staffs" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        <Content
          style={{
            marginTop: 64,
            padding: 20,
            background: "#f9f9f9",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
          }}
        >
          {/* Bộ lọc + Button 1 dòng */}
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
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input.Search
                placeholder="Nhập tên, email hoặc số điện thoại..."
                style={{ width: 250 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                value={roleFilter}
                style={{ width: 150 }}
                onChange={(val) => setRoleFilter(val)}
              >
                <Option value="all">Tất cả</Option>
                <Option value="Thu ngân">Thu ngân</Option>
                <Option value="Phục vụ">Phục vụ</Option>
                <Option value="Bếp">Bếp</Option>
              </Select>
              <Select
                value={statusFilter}
                style={{ width: 150 }}
                onChange={(val) => setStatusFilter(val)}
              >
                <Option value="all">Tất cả</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Ngừng hoạt động</Option>
              </Select>
            </div>
            <Space>
              <Button onClick={handleExportExcel}>Xuất danh sách</Button>
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
                + Thêm nhân viên
              </Button>
            </Space>
          </div>

          {/* Table */}
          <Table
            dataSource={paginatedData}
            columns={columns}
            pagination={false}
            rowKey="id"
            bordered
            style={{ background: "#fff", marginBottom: 16 }}
          />

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Hiển thị {(currentPage - 1) * pageSize + 1} đến{" "}
              {Math.min(currentPage * pageSize, staffs.length)} trong tổng số{" "}
              {staffs.length} nhân viên
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={staffs.length}
              showSizeChanger
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>

          {/* Drawer thêm nhân viên */}
          <Drawer
            title="Thêm nhân viên"
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
                <Button type="primary" onClick={handleAddStaff}>
                  Thêm
                </Button>
              </div>
            }
          >
            <Form form={addForm} layout="vertical">
              <Form.Item
                label="Tên nhân viên"
                name="name"
                rules={[{ required: true, message: "Nhập tên nhân viên!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Nhập email!" },
                  {
                    type: "email",
                    message: "Email không hợp lệ!",
                  },
                  {
                    pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                    message: "Chỉ chấp nhận email có đuôi @gmail.com!",
                  },
                ]}
              >
                <Input placeholder="Nhập email (@gmail.com)" />
              </Form.Item>
                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: "Nhập số điện thoại!" },
                    {
                      pattern: /^0\d{9}$/,
                      message: "Số điện thoại phải có 10 số và bắt đầu bằng 0!",
                    },
                  ]}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    maxLength={10}
                  />
                </Form.Item>

              <Form.Item label="Vai trò" name="role">
                <Select>
                  <Option value="Thu ngân">Thu ngân</Option>
                  <Option value="Phục vụ">Phục vụ</Option>
                  <Option value="Bếp">Bếp</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Ngày vào làm" name="date">
                <Input type="date" />
              </Form.Item>
              <Form.Item label="Trạng thái" name="status" initialValue="Hoạt động">
                <Select>
                  <Option value="Hoạt động">Hoạt động</Option>
                  <Option value="Ngừng hoạt động">Ngừng hoạt động</Option>
                </Select>
              </Form.Item>
            </Form>
          </Drawer>

          {/* Drawer chỉnh sửa nhân viên */}
          <Drawer
            title="Chỉnh sửa nhân viên"
            placement="right"
            width={600}
            open={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              editForm.resetFields();
              setEditingStaff(null);
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setEditDrawerOpen(false);
                    editForm.resetFields();
                    setEditingStaff(null);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button type="primary" onClick={handleEditStaff}>
                  Lưu
                </Button>
              </div>
            }
          >
            <Form form={editForm} layout="vertical">
              <Form.Item
                label="Tên nhân viên"
                name="name"
                rules={[{ required: true, message: "Nhập tên nhân viên!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Nhập email!" },
                  {
                    type: "email",
                    message: "Email không hợp lệ!",
                  },
                  {
                    pattern: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                    message: "Chỉ chấp nhận email có đuôi @gmail.com!",
                  },
                ]}
              >
                <Input placeholder="Nhập email (@gmail.com)" />
              </Form.Item>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Nhập số điện thoại!" },
                  {
                    pattern: /^0\d{9}$/,
                    message: "Số điện thoại phải có 10 số và bắt đầu bằng 0!",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  maxLength={10}
                />
              </Form.Item>
              <Form.Item label="Vai trò" name="role">
                <Select>
                  <Option value="Thu ngân">Thu ngân</Option>
                  <Option value="Phục vụ">Phục vụ</Option>
                  <Option value="Bếp">Bếp</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Ngày vào làm" name="date">
                <Input type="date" />
              </Form.Item>
              <Form.Item label="Trạng thái" name="status">
                <Select>
                  <Option value="Hoạt động">Hoạt động</Option>
                  <Option value="Ngừng hoạt động">Ngừng hoạt động</Option>
                </Select>
              </Form.Item>
            </Form>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default StaffsPage;
