import React, { useState } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Pagination,
  Drawer,
  Form,
  message,
} from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom"; // Thêm vào đầu file nếu chưa có

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CustomerPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Khách hàng");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate(); // Thêm trong component CustomerPage

  // Dữ liệu mẫu, bổ sung lịch sử đơn hàng cho mỗi khách
  const dataSource = [
    {
      key: "1",
      phone: "0912345678", // <-- Hiển thị full số
      point: 156,
      orders: 12,
      total: "2,450,000đ",
      lastVisit: "28/08/2025 14:30",
      status: "Khách cũ",
      orderHistory: [
        { code: "#DH001", date: "25/08/2025", amount: "350,000đ", status: "Hoàn tất" },
        { code: "#DH002", date: "20/08/2025", amount: "420,000đ", status: "Hoàn tất" },
      ],
    },
    {
      key: "2",
      phone: "08xx xxx 146",
      point: 0,
      orders: 1,
      total: "320,000đ",
      lastVisit: "27/08/2025 19:15",
      status: "Khách mới",
      orderHistory: [
        {
          code: "#DH003",
          date: "27/08/2025",
          amount: "320,000đ",
          status: "Hoàn tất",
        },
      ],
    },
    {
      key: "3",
      phone: "08xx xxx 456",
      point: 89,
      orders: 8,
      total: "1,780,000đ",
      lastVisit: "25/08/2025 12:45",
      status: "Khách cũ",
      orderHistory: [],
    },
  ];

  // Cột bảng
  const columns = [
    { title: "SDT", dataIndex: "phone", key: "phone" },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      render: (point) =>
        point > 0 ? (
          <span style={{ color: "#226533", fontWeight: 500 }}>{point} điểm</span>
        ) : (
          <span style={{ color: "#999" }}>0 điểm</span>
        ),
    },
    { title: "Số đơn hàng", dataIndex: "orders", key: "orders" },
    {
      title: "Tổng chi tiêu",
      dataIndex: "total",
      key: "total",
      render: (total) => (
        <span style={{ color: "orange", fontWeight: 500 }}>{total}</span>
      ),
    },
    { title: "Lần cuối ghé", dataIndex: "lastVisit", key: "lastVisit" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Khách cũ" ? "green" : "blue"}>{status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedCustomer(record);
              setDetailDrawerOpen(true);
            }}
          >
            Xem chi tiết
          </Button>
          <Button
            size="small"
            type="dashed"
            onClick={() => {
              setEditingCustomer(record);
              editForm.setFieldsValue({ phone: record.phone });
              setEditDrawerOpen(true);
            }}
          >
            Chỉnh sửa
          </Button>
        </Space>
      ),
    },
  ];

  // Lọc dữ liệu theo searchText và statusFilter
  const filteredData = dataSource.filter((item) => {
    // Lọc theo SDT
    const searchMatch =
      !searchText ||
      (item.phone || "").toLowerCase().includes(searchText.trim().toLowerCase());
    // Lọc theo trạng thái
    let statusMatch = true;
    if (statusFilter === "old") statusMatch = item.status === "Khách cũ";
    else if (statusFilter === "new") statusMatch = item.status === "Khách mới";
    return searchMatch && statusMatch;
  });

  // Phân trang dữ liệu đã lọc
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Hàm xử lý submit thêm khách hàng
  const handleAddCustomer = async () => {
    try {
      const values = await addForm.validateFields();
      // Kiểm tra trùng số điện thoại
      const existed = dataSource.some(
        (item) => item.phone === values.phone
      );
      if (existed) {
        message.error("Số điện thoại này đã tồn tại trong danh sách!");
        return;
      }
      // Xử lý thêm khách hàng ở đây (gọi API hoặc cập nhật state)
      setAddDrawerOpen(false);
      addForm.resetFields();
      message.success("Đăng ký khách hàng thành công!");
    } catch (err) {
      // Nếu validate lỗi thì không làm gì
    }
  };

  // Hàm xuất danh sách khách hàng ra file Excel
  const handleExportExcel = () => {
    // Chuyển dữ liệu hiện tại thành sheet
    const exportData = dataSource.map((item) => ({
      "Số điện thoại": item.phone,
      "Điểm tích lũy": item.point,
      "Số đơn hàng": item.orders,
      "Tổng chi tiêu": item.total,
      "Lần cuối ghé": item.lastVisit,
      "Trạng thái": item.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KhachHang");
    XLSX.writeFile(wb, "danh_sach_khach_hang.xlsx");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar dùng chung */}
      <AppSidebar collapsed={collapsed} currentPageKey="customers" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        {/* Header dùng chung */}
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
          {/* Bộ lọc khách hàng */}
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Input.Search
                placeholder="Tìm kiếm theo SDT"
                style={{ width: 420 }}
                value={searchText}
                onChange={e => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
              />
              <Select
                value={statusFilter}
                style={{ width: 120 }}
                onChange={val => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="old">Khách cũ</Option>
                <Option value="new">Khách mới</Option>
              </Select>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: "#226533" }}
                onClick={() => setAddDrawerOpen(true)}
              >
                Đăng ký
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                Xuất danh sách
              </Button>
            </Space>
          </div>

          {/* Bảng khách hàng */}
          <Table
            rowKey="key"
            loading={loading}
            columns={columns}
            dataSource={pagedData}
            pagination={false}
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
              Hiển thị{" "}
              {filteredData.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {" "}
              đến{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} trong tổng số{" "}
              {filteredData.length} khách hàng
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              showSizeChanger
              pageSizeOptions={["5", "8", "10", "20", "50"]}
              showQuickJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>

          {/* Drawer thêm khách hàng */}
          <Drawer
            title="Đăng ký khách hàng mới"
            placement="right"
            width={600}
            open={addDrawerOpen}
            onClose={() => {
              setAddDrawerOpen(false);
              addForm.resetFields();
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setAddDrawerOpen(false);
                    addForm.resetFields();
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button type="primary" onClick={handleAddCustomer}>
                  Thêm
                </Button>
              </div>
            }
          >
            <Form
              form={addForm}
              layout="vertical"
              initialValues={{}}
            >
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Nhập số điện thoại!" },
                  { pattern: /^0\d{9,10}$/, message: "Số điện thoại không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại khách hàng" maxLength={11} />
              </Form.Item>
            </Form>
          </Drawer>

          {/* Drawer xem chi tiết khách hàng */}
          <Drawer
            title="Chi tiết khách hàng"
            placement="right"
            width={800}
            open={detailDrawerOpen}
            onClose={() => {
              setDetailDrawerOpen(false);
              setSelectedCustomer(null);
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    setSelectedCustomer(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            }
          >
            {selectedCustomer ? (
              <div style={{ lineHeight: 2 }}>
                <b>Số điện thoại:</b> {selectedCustomer.phone} <br />
                <b>Điểm tích lũy:</b> {selectedCustomer.point} <br />
                <b>Số đơn hàng:</b> {selectedCustomer.orders} <br />
                <b>Tổng chi tiêu:</b> {selectedCustomer.total} <br />
                <b>Lần cuối ghé:</b> {selectedCustomer.lastVisit} <br />
                <b>Trạng thái:</b>{" "}
                <Tag color={selectedCustomer.status === "Khách cũ" ? "green" : "blue"}>
                  {selectedCustomer.status}
                </Tag>
                <div style={{ marginTop: 24 }}>
                  <b>Lịch sử đặt hàng:</b>
                  <Table
                    style={{ marginTop: 8 }}
                    size="small"
                    bordered
                    columns={[
                      { title: "Mã đơn", dataIndex: "code", key: "code" },
                      { title: "Ngày đặt", dataIndex: "date", key: "date" },
                      { title: "Số tiền", dataIndex: "amount", key: "amount" },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        key: "status",
                        render: (status) =>
                          status === "Hoàn tất" ? (
                            <Tag color="green">Hoàn tất</Tag>
                          ) : (
                            <Tag color="red">{status}</Tag>
                          ),
                      },
                      {
                        title: "Chi tiết",
                        key: "detail",
                        render: (_, record) => (
                          <Button
                            size="small"
                            type="link"
                            onClick={() => navigate(`/main/orders/${record.code}`)}
                          >
                            Xem chi tiết
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={selectedCustomer.orderHistory || []}
                    rowKey="code"
                    pagination={false}
                    locale={{ emptyText: "Chưa có đơn hàng nào" }}
                  />
                </div>
              </div>
            ) : (
              <span>Không có dữ liệu</span>
            )}
          </Drawer>

          {/* Drawer chỉnh sửa khách hàng */}
          <Drawer
            title="Chỉnh sửa khách hàng"
            placement="right"
            width={400}
            open={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditingCustomer(null);
              editForm.resetFields();
            }}
            footer={
              <div style={{ textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setEditDrawerOpen(false);
                    setEditingCustomer(null);
                    editForm.resetFields();
                  }}
                  style={{ marginRight: 8 }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      const values = await editForm.validateFields();
                      // Xử lý cập nhật SĐT ở đây (nếu dùng API thì gọi API, nếu dùng data mẫu thì cập nhật state)
                      // Ví dụ với data mẫu:
                      // Tìm vị trí khách hàng trong dataSource và cập nhật SĐT
                      if (editingCustomer) {
                        editingCustomer.phone = values.phone;
                        message.success("Cập nhật khách hàng thành công!");
                      }
                      setEditDrawerOpen(false);
                      setEditingCustomer(null);
                      editForm.resetFields();
                    } catch (err) {
                      // Nếu validate lỗi thì không làm gì
                    }
                  }}
                >
                  Lưu
                </Button>
              </div>
            }
          >
            <Form
              form={editForm}
              layout="vertical"
              initialValues={{}}
            >
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Nhập số điện thoại!" },
                  { pattern: /^0\d{9,10}$/, message: "Số điện thoại không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại khách hàng" maxLength={11} />
              </Form.Item>
            </Form>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CustomerPage;
