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
  const [tables, setTables] = useState([]); // Dữ liệu từ API
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
      const res = await axios.get(`${REACT_APP_API_URL}/tables`);
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
      await axios.delete(`${REACT_APP_API_URL}/tables/${id}`);
      message.success("Xóa bàn thành công");
      fetchTables();
    } catch (err) {
      console.error("API DELETE error:", err);
      const errorMsg = err.response?.data?.message || "Xóa bàn thất bại";
      message.error(errorMsg);
    }
  }

  // Thêm bàn mới
  const handleAddTable = async () => {
    try {
      const values = await addForm.validateFields();
      await axios.post(`${REACT_APP_API_URL}/tables`, {
        table_number: values.table_number,
      });
      message.success("Thêm bàn mới thành công! QR code đã được tạo tự động.");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchTables();
    } catch (err) {
      if (err?.errorFields) return;
      const errorMsg = err.response?.data?.message || "Thêm bàn mới thất bại!";
      message.error(errorMsg);
    }
  };

  // Mở popup chỉnh sửa
  const openEditDrawer = (table) => {
    setEditingTable(table);
    editForm.setFieldsValue({
      table_number: table.table_number,
      is_active: table.is_active,
    });
    setEditDrawerOpen(true);
  };

  // Sửa bàn
  const handleEditTable = async () => {
    try {
      const values = await editForm.validateFields();
      await axios.put(`${REACT_APP_API_URL}/tables/${editingTable.id}`, {
        table_number: values.table_number,
        is_active: values.is_active,
      });
      message.success("Cập nhật bàn thành công!");
      setEditDrawerOpen(false);
      editForm.resetFields();
      fetchTables();
    } catch (err) {
      if (err?.errorFields) return;
      const errorMsg = err.response?.data?.message || "Cập nhật bàn thất bại!";
      message.error(errorMsg);
    }
  };

  // ================= Print QR Functions =================

  // Phương án in đơn giản - trực tiếp từ browser hiện tại
  const handleSimplePrint = (content, title = "In QR Code") => {
    // Tạo element ẩn để in
    const printElement = document.createElement('div');
    printElement.innerHTML = content;
    printElement.style.display = 'none';
    document.body.appendChild(printElement);

    // Backup CSS gốc
    const originalContents = document.body.innerHTML;
    const originalTitle = document.title;

    // Thay thế nội dung page
    document.title = title;
    document.body.innerHTML = content;

    // Gọi print dialog
    window.print();

    // Khôi phục nội dung gốc
    document.title = originalTitle;
    document.body.innerHTML = originalContents;

    // Remove element ẩn
    if (document.body.contains(printElement)) {
      document.body.removeChild(printElement);
    }
  };

  // In QR cho một bàn
  const handlePrintSingleQR = (table) => {
    if (!table.qr_code_url) {
      message.error("Bàn này chưa có mã QR!");
      return;
    }

    const qrUrl = `${replaceUrlServer(REACT_APP_API_URL)}${table.qr_code_url}`;

    const printStyles = `
      <style>
        body {
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: Arial, sans-serif;
        }
        .qr-container {
          text-align: center;
          page-break-inside: avoid;
          margin-bottom: 30px;
        }
        .qr-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }
        .qr-image {
          width: 200px;
          height: 200px;
          border: 2px solid #ddd;
          border-radius: 8px;
        }
        .qr-info {
          margin-top: 15px;
          font-size: 16px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .qr-container { page-break-inside: avoid; }
        }
      </style>
    `;

    const printBody = `
      <div class="qr-container">
        <div class="qr-title">Bàn ${table.table_number}</div>
        <img src="${qrUrl}" alt="QR Code Bàn ${table.table_number}" class="qr-image" />
        <div class="qr-info">Quét mã QR để xem menu</div>
      </div>
    `;

    // Thử phương án window mới trước
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>In QR Code - Bàn ${table.table_number}</title>
              ${printStyles}
            </head>
            <body>
              ${printBody}
              <script>
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              </script>
            </body>
          </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Backup timer
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.print();
            printWindow.close();
          }
        }, 1000);
      } else {
        throw new Error('Popup blocked');
      }
    } catch (error) {
      // Fallback: In trực tiếp từ trang hiện tại
      console.log('Using fallback print method');
      const fallbackContent = printStyles + printBody;
      handleSimplePrint(fallbackContent, `In QR Code - Bàn ${table.table_number}`);
    }
  };

  // In tất cả QR
  const handlePrintAllQR = () => {
    const tablesWithQR = filteredTables.filter(table => table.qr_code_url);

    if (tablesWithQR.length === 0) {
      message.error("Không có bàn nào có mã QR để in!");
      return;
    }

    let qrItems = '';
    tablesWithQR.forEach((table) => {
      const qrUrl = `${replaceUrlServer(REACT_APP_API_URL)}${table.qr_code_url}`;
      qrItems += `
        <div class="qr-container">
          <div class="qr-title">Bàn ${table.table_number}</div>
          <img src="${qrUrl}" alt="QR Code Bàn ${table.table_number}" class="qr-image" />
          <div class="qr-info">Quét mã QR để xem menu</div>
        </div>
      `;
    });

    const printStyles = `
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          font-size: 28px;
          font-weight: bold;
          color: #333;
        }
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          justify-items: center;
        }
        .qr-container {
          text-align: center;
          page-break-inside: avoid;
          border: 1px solid #eee;
          padding: 20px;
          border-radius: 8px;
        }
        .qr-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }
        .qr-image {
          width: 180px;
          height: 180px;
          border: 2px solid #ddd;
          border-radius: 8px;
        }
        .qr-info {
          margin-top: 15px;
          font-size: 14px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .qr-container { page-break-inside: avoid; }
        }
      </style>
    `;

    const printBody = `
      <div class="print-header">Danh sách QR Code các bàn</div>
      <div class="qr-grid">
        ${qrItems}
      </div>
    `;

    // Thử phương án window mới trước
    try {
      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>In tất cả QR Code</title>
              ${printStyles}
            </head>
            <body>
              ${printBody}
              <script>
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 1000);
              </script>
            </body>
          </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Backup timer
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.print();
            printWindow.close();
          }
        }, 2000);
      } else {
        throw new Error('Popup blocked');
      }
    } catch (error) {
      // Fallback: In trực tiếp từ trang hiện tại
      console.log('Using fallback print method for all QR');
      const fallbackContent = printStyles + printBody;
      handleSimplePrint(fallbackContent, 'In tất cả QR Code');
    }

    message.success(`Đang chuẩn bị in ${tablesWithQR.length} mã QR...`);
  };

  // ================= Effect =================
  useEffect(() => {
    fetchTables();
  }, []);

  // ================= Filter logic =================
  const filteredTables = tables.filter((t) => {
    // Lọc theo tên bàn
    const search = searchText.trim().toLowerCase();
    const searchMatch =
      !search || (t.table_number || "").toLowerCase().includes(search);

    // Lọc theo trạng thái
    let statusMatch = true;
    if (statusFilter !== "all") {
      statusMatch =
        (statusFilter === "active" && t.is_active === 1) ||
        (statusFilter === "inactive" && t.is_active === 0);
    }
    return searchMatch && statusMatch;
  });

  const replaceUrlServer = (url) => {
    return url.replace("/api", "");
  }

  // ================= Columns Table =================
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      align: "center",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Số bàn",
      dataIndex: "table_number",
      key: "table_number",
      align: "center",
      sorter: (a, b) => (a.table_number || "").localeCompare(b.table_number || "", "vi"),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      sorter: (a, b) => a.is_active - b.is_active,
      render: (val) =>
        val === 1 ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Tạm ngừng</Tag>
        ),
    },
    {
      title: "QR Code",
      dataIndex: "qr_code_url",
      key: "qr_code_url",
      align: "center",
      render: (qrUrl, record) => {
        if (qrUrl) {
          // Backend QR URL: /qr/table-1.png (served statically)

          const fullQrUrl = `${replaceUrlServer(REACT_APP_API_URL)}${qrUrl}`;
          return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img
                src={fullQrUrl}
                alt={`QR code for ${record.table_number}`}
                style={{ width: 60, height: 60 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span style={{ color: "#aaa", display: "none" }}>QR lỗi</span>
            </div>
          );
        } else {
          return <span style={{ color: "#aaa" }}>Chưa có QR</span>;
        }
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="default"
            disabled={!record.qr_code_url}
            onClick={() => handlePrintSingleQR(record)}
            style={{ color: "#1890ff" }}
          >
            In QR
          </Button>
          <Button size="small" onClick={() => openEditDrawer(record)}>
            Chỉnh sửa
          </Button>

          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bàn này?"
            description="Không thể xóa nếu bàn đang có khách hoặc đơn hàng pending."
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
                type="default"
                onClick={handlePrintAllQR}
                disabled={filteredTables.filter(t => t.qr_code_url).length === 0}
              >
                🖨️ In tất cả QR
              </Button>
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
              initialValues={{}}
            >
              <Form.Item
                label="Số bàn"
                name="table_number"
                rules={[
                  { required: true, message: "Nhập số bàn!" },
                  { pattern: /^[A-Za-z0-9\s]+$/, message: "Số bàn chỉ chứa chữ, số và khoảng trắng!" }
                ]}
              >
                <Input placeholder="Ví dụ: B01, VIP-1, Bàn 05..." />
              </Form.Item>
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                padding: 12,
                marginBottom: 16
              }}>
                <Text style={{ color: '#52c41a', fontSize: 14 }}>
                  💡 QR Code sẽ được tạo tự động khi tạo bàn mới
                </Text>
              </div>
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
            >
              <Form.Item
                label="Số bàn"
                name="table_number"
                rules={[
                  { required: true, message: "Nhập số bàn!" },
                  { pattern: /^[A-Za-z0-9\s]+$/, message: "Số bàn chỉ chứa chữ, số và khoảng trắng!" }
                ]}
              >
                <Input placeholder="Ví dụ: B01, VIP-1, Bàn 05..." />
              </Form.Item>
              <Form.Item
                label="Trạng thái"
                name="is_active"
                rules={[{ required: true, message: "Chọn trạng thái!" }]}
              >
                <Select>
                  <Option value={1}>Hoạt động</Option>
                  <Option value={0}>Tạm ngừng</Option>
                </Select>
              </Form.Item>
              {editingTable?.qr_code_url && (
                <Form.Item label="QR Code hiện tại">
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={`${replaceUrlServer(REACT_APP_API_URL)}${editingTable.qr_code_url}`}
                      alt="Current QR"
                      style={{ width: 180, height: 180, border: '1px solid #d9d9d9', borderRadius: 8 }}
                    />
                    <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                      QR Code cho bàn {editingTable.table_number}
                    </div>
                  </div>
                </Form.Item>
              )}
            </Form>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default TablesPage;