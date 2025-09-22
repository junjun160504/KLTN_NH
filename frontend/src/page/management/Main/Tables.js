import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Space,
  Typography,
  Input,
  Table,
  Tag,
  message,
  Popconfirm,
  Drawer,
  Form,
  Select,
} from "antd";
import axios from "axios";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const TablesPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Quản lý bàn");
  const [tables, setTables] = useState([
    {
      id: 1,
      name: "Bàn 01",
      status: "opened",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Ban01",
    },
    {
      id: 2,
      name: "Bàn 02",
      status: "closed",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Ban02",
    },
    {
      id: 3,
      name: "Bàn VIP",
      status: "opened",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=BanVIP",
    },
  ]); // <-- Thêm data mẫu ở đây
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingTable, setEditingTable] = useState(null);

  // ================= API =================
  async function fetchTables() {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/table/all`);
      setTables(res.data.data || []);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách bàn");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTable(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/table/delete/${id}`);
      message.success("Xóa bàn thành công");
      fetchTables();
    } catch (err) {
      console.error("API DELETE error:", err);
      message.error("Xóa bàn thất bại");
    }
  }

  // Thêm bàn mới
  const handleAddTable = async () => {
    try {
      const values = await addForm.validateFields();
      await axios.post(`${REACT_APP_API_URL}/table`, {
        name: values.name,
        status: values.status,
        note: values.note || "",
      });
      message.success("Thêm bàn mới thành công!");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchTables();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Thêm bàn mới thất bại!");
    }
  };

  // Mở popup chỉnh sửa
  const openEditDrawer = (table) => {
    setEditingTable(table);
    editForm.setFieldsValue({
      ...table,
    });
    setEditDrawerOpen(true);
  };

  // Sửa bàn
  const handleEditTable = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/table/update/${editingTable.id}`, {
        name: values.name,
        status: values.status,
        note: values.note || "",
      });
      message.success("Cập nhật bàn thành công!");
      setEditDrawerOpen(false);
      editForm.resetFields();
      fetchTables();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Cập nhật bàn thất bại!");
    }
  };

  // ================= Effect =================
  useEffect(() => {
    // fetchTables();
  }, []);

  // ================= Filter logic =================
  const filteredTables = tables.filter((t) => {
    // Lọc theo tên bàn
    const search = searchText.trim().toLowerCase();
    const searchMatch =
      !search || (t.name || "").toLowerCase().includes(search);

    // Lọc theo trạng thái
    let statusMatch = true;
    if (statusFilter !== "all") {
      statusMatch =
        (statusFilter === "active" && t.status === "opened") ||
        (statusFilter === "inactive" && t.status === "closed");
    }
    return searchMatch && statusMatch;
  });

  // ================= Columns Table =================
  const columns = [
    {
      title: "Tên bàn",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || "", "vi"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (val) =>
        val === "opened" ? (
          <Tag color="green">Đang mở</Tag>
        ) : (
          <Tag color="red">Đã đóng</Tag>
        ),
    },
    {
      title: "QR Code",
      dataIndex: "qr",
      key: "qr",
      render: (qr) =>
        qr ? (
          <img src={qr} alt="QR code" style={{ width: 60, height: 60 }} />
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
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
            title="Bạn có chắc chắn muốn xóa bàn này?"
            onConfirm={() => handleDeleteTable(record.id)}
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
      <AppSidebar collapsed={collapsed} currentPageKey="tables" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        {/* Header */}
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
                placeholder="Tìm tên bàn..."
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

              <Select
                value={statusFilter}
                style={{ width: 200 }}
                onChange={(val) => setStatusFilter(val)}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Đang hoạt động</Option>
                <Option value="inactive">Đã đóng</Option>
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
              <Button
                type="primary"
                style={{ background: "#226533" }}
                onClick={() => setDrawerOpen(true)}
              >
                + Thêm bàn mới
              </Button>
            </div>
          </div>

          {/* Bảng */}
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredTables}
            pagination={{
              pageSizeOptions: ["5", "8", "10", "20", "50"],
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize: 8,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên tổng ${total} bàn`,
            }}
          />

          {/* Drawer thêm bàn mới */}
          <Drawer
            title="Thêm bàn mới"
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
                <Button type="primary" onClick={handleAddTable}>
                  Thêm
                </Button>
              </div>
            }
          >
            <Form
              form={addForm}
              layout="vertical"
              initialValues={{ status: "opened" }}
            >
              <Form.Item
                label="Tên bàn"
                name="name"
                rules={[{ required: true, message: "Nhập tên bàn!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: "Chọn trạng thái!" }]}
              >
                <Select>
                  <Option value="opened">Đang mở</Option>
                  <Option value="closed">Đã đóng</Option>
                </Select>
              </Form.Item>
              <Form.Item label="QR Code (URL)" name="qr">
                <Input placeholder="Dán link ảnh QR code hoặc để trống để tự sinh" />
              </Form.Item>
            </Form>
          </Drawer>

          {/* Drawer chỉnh sửa bàn */}
          <Drawer
            title="Chỉnh sửa bàn"
            placement="right"
            width={600}
            open={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              editForm.resetFields();
              setEditingTable(null);
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setEditDrawerOpen(false);
                    editForm.resetFields();
                    setEditingTable(null);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button type="primary" onClick={handleEditTable}>
                  Lưu
                </Button>
              </div>
            }
          >
            <Form
              form={editForm}
              layout="vertical"
              initialValues={{ status: "opened" }}
            >
              <Form.Item
                label="Tên bàn"
                name="name"
                rules={[{ required: true, message: "Nhập tên bàn!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: "Chọn trạng thái!" }]}
              >
                <Select>
                  <Option value="opened">Đang mở</Option>
                  <Option value="closed">Đã đóng</Option>
                </Select>
              </Form.Item>
              <Form.Item label="QR Code (URL)" name="qr">
                <Input placeholder="Dán link ảnh QR code hoặc để trống để tự sinh" />
              </Form.Item>
            </Form>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default TablesPage;