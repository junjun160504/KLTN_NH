import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "../../../components/AppHeader";
import AppSidebar from "../../../components/AppSidebar";
import {
  Layout,
  Button,
  Space,
  Table,
  Input,
  Select,
  Tag,
  Pagination,
  Drawer,
  Descriptions,
  List,
  message,
  Modal,
  Spin,
} from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs"; // thêm thư viện này (cài: npm install dayjs)
import axios from "axios";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const { Content } = Layout;
const { Option } = Select;

const OrderPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Đơn hàng");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalExport, setModalExport] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterTime, setFilterTime] = useState("today"); // thêm state lọc thời gian
  const [searchText, setSearchText] = useState(""); // Thêm state cho tìm kiếm
  const [loading, setLoading] = useState(false); // Loading state
  const [orders, setOrders] = useState([]); // Khởi tạo empty array

  // ==================== API CALL ====================
  // Fetch danh sách đơn hàng từ API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API lấy tất cả đơn hàng
      const response = await axios.get(`${REACT_APP_API_URL}/orders`, {
        params: {
          limit: 100, // Lấy tối đa 100 đơn
          offset: 0,
        }
      });

      const fetchedOrders = response.data.data || [];
      // Transform data từ API sang format của UI
      const transformedOrders = fetchedOrders.map((order, index) => ({
        key: order.id.toString(),
        code: `#PN${String(order.id).padStart(5, "0")}`,
        table: order.table_number ? `Bàn ${order.table_number}` : "N/A",
        phone: order.customer_phone || "-",
        point: order.loyalty_points_used || 0,
        total: order.total_price
          ? `${order.total_price.toLocaleString("vi-VN")}đ`
          : "0đ",
        status: order.status,
        createdAt: order.created_at || dayjs().toISOString(),
        items: order.items || [],
        rawData: order, // Lưu data gốc để dùng khi cần
      }));

      setOrders(transformedOrders);

    } catch (error) {
      console.error("❌ Error fetching orders:", error);

      if (error.response?.status === 404) {
        // Không có đơn hàng nào
        setOrders([]);
        message.info("Chưa có đơn hàng nào");
      } else {
        message.error(
          error.response?.data?.message || "Không thể tải danh sách đơn hàng. Vui lòng thử lại!"
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders khi component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);



  // ==================== END API CALL ====================

  const pageSize = 10; // số đơn mỗi trang

  // 👉 lọc đơn hàng theo trạng thái, thời gian và tìm kiếm
  const filteredOrders = orders.filter((o) => {
    // Lọc trạng thái
    const statusMatch = filterStatus === "ALL" ? true : o.status === filterStatus;

    // Lọc thời gian
    let timeMatch = true;
    const created = dayjs(o.createdAt);
    if (filterTime === "today") {
      timeMatch = created.isSame(dayjs(), "day");
    } else if (filterTime === "7days") {
      timeMatch = created.isAfter(dayjs().subtract(7, "day").startOf("day"));
    } else if (filterTime === "30days") {
      timeMatch = created.isAfter(dayjs().subtract(30, "day").startOf("day"));
    }

    // Lọc tìm kiếm theo mã đơn hoặc số điện thoại
    const search = searchText.trim().toLowerCase();
    const searchMatch =
      !search ||
      o.code.toLowerCase().includes(search) ||
      o.phone.toLowerCase().includes(search);

    return statusMatch && timeMatch && searchMatch;
  });

  // 👉 lấy dữ liệu cho trang hiện tại
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // hàm xuất Excel
  const handleExportExcel = () => {
    const data = filteredOrders.map((o) => ({
      "Mã đơn": o.code,
      "Bàn": o.table,
      "SĐT": o.phone,
      "Điểm": o.point,
      "Tổng tiền": o.total,
      "Trạng thái": o.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "don_hang.xlsx");

    message.success("Xuất file Excel thành công!");
  };

  const [selectedOrder, setSelectedOrder] = useState(null);

  // state modal xác nhận
  const [modalThanhToan, setModalThanhToan] = useState({ open: false, order: null });
  // cập nhật trạng thái đơn
  // ==================== HELPER COMPONENTS ====================
  
  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusVI = STATUS_MAP.EN_TO_VI[status] || status
    const color = STATUS_COLORS[status] || 'default'
    const icon = STATUS_ICONS[status]

    return (
      <Tag color={color} icon={icon} className="px-3 py-1 text-sm font-medium">
        {statusVI}
      </Tag>
    )
  }

  // ==================== EVENT HANDLERS ====================

  // Update order status với API call
  const handleUpdateStatus = useCallback(async (orderId, newStatus) => {
    const success = await updateOrderStatusAPI(orderId, newStatus)
    if (success) {
      setSelectedOrder(null)
    }
  }, [updateOrderStatusAPI])

  // Handle payment confirmation
  const handlePaymentConfirm = useCallback(async (order) => {
    Modal.confirm({
      title: 'Xác nhận thanh toán',
      content: `Xác nhận thanh toán cho đơn hàng ${order.code}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        await handleUpdateStatus(order.id, 'COMPLETED')
        setModalThanhToan({ open: false, order: null })
      },
    })
  }, [handleUpdateStatus])

  // ==================== TABLE COLUMNS ====================
  
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (text) => (
        <span className="font-semibold text-blue-600">{text}</span>
      ),
    },
    {
      title: "Bàn",
      dataIndex: "table",
      key: "table",
      width: 100,
      render: (text) => (
        <span className="font-medium">{text}</span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 130,
    },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      width: 120,
      align: 'center',
      render: (point) => (
        <span className="text-orange-600 font-medium">{point} điểm</span>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      width: 130,
      align: 'right',
      render: (text) => (
        <span className="text-red-600 font-bold text-base">{text}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: 'center',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (time) => (
        <div className="text-gray-600 text-sm">
          <div>{dayjs(time).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-400">{dayjs(time).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link"
            size="small" 
            onClick={() => setSelectedOrder(record)}
            className="text-blue-600 hover:text-blue-700"
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            size="small"
            disabled={record.status !== 'CONFIRMED' && record.status !== 'READY'}
            onClick={() => handlePaymentConfirm(record)}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
          >
            Thanh toán
          </Button>
        </Space>
      ),
    },
  ]

  // render footer Drawer chi tiết đơn
  const renderDrawerFooter = () => {
    if (!selectedOrder) return null;
    const { status, key } = selectedOrder;


    if (status === "Hủy món" || status === "Hoàn đơn") {
      return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>;
    }

    if (status === "Chờ xác nhận") {
      return (
        <>
          <Button
            type="primary"
            style={{ background: "#226533" }}
            onClick={() => {
              updateOrderStatus(key, "Đang phục vụ");
              message.success("Đơn hàng đã được xác nhận và đang phục vụ");
              setSelectedOrder(null);
            }}
          >
            Xác nhận
          </Button>
        </>
      );
    }

    if (status === "Đang phục vụ") {
      return (
        <>
          <Button
            type="primary"
            style={{ background: "#226533", marginRight: 8 }}
            onClick={() => setModalThanhToan({ open: true, order: selectedOrder })}
          >
            Thanh toán
          </Button>
          <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
        </>
      );
    }

    return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} currentPageKey="orders" />
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
          {/* Loading Spinner */}
          <Spin spinning={loading} tip="Đang tải danh sách đơn hàng...">

            {/* Filter */}
            <Space style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <Input.Search
                placeholder="Nhập mã đơn hoặc số điện thoại..."
                style={{ width: 250 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                style={{ width: 150 }}
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="NEW">Chờ xác nhận</Option>
                <Option value="IN_PROGRESS">Đang phục vụ</Option>
                <Option value="DONE">Hoàn tất</Option>
                <Option value="CANCELLED">Hủy món</Option>
                <Option value="PAID">Đã thanh toán</Option>
              </Select>
              <Select
                value={filterTime}
                onChange={setFilterTime}
                style={{ width: 120 }}
              >
                <Option value="today">Hôm nay</Option>
                <Option value="7days">7 ngày qua</Option>
                <Option value="30days">30 ngày qua</Option>
              </Select>
            </Space>

            {/* Table */}
            <Table
              dataSource={pagedOrders} // sửa lại ở đây
              columns={columns}
              pagination={false}
              bordered
              style={{ marginBottom: 16, background: "#fff" }}
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
                Hiển thị 1 đến {pagedOrders.length} trong tổng số {orders.length} đơn hàng
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredOrders.length}
                onChange={(page) => setCurrentPage(page)}
              />
            </div>

          </Spin>
          {/* End Loading Spinner */}
        </Content>

        {/* Modal Xuất Excel */}
        <Modal
          title="Xuất file Excel"
          open={modalExport}
          onCancel={() => setModalExport(false)}
          footer={[
            <Button key="back" onClick={() => setModalExport(false)}>
              Đóng
            </Button>,
            <Button
              key="submit"
              type="primary"
              style={{ background: "#226533" }}
              onClick={() => {
                setModalExport(false);
                handleExportExcel(); // ✅ gọi hàm export
              }}
            >
              Xác nhận xuất
            </Button>,
          ]}
        >
          <p>Bạn có chắc chắn muốn xuất danh sách đơn hàng ra file Excel không?</p>
        </Modal>
      </Layout>

      {/* Drawer chi tiết đơn */}
      <Drawer
        title="Chi tiết đơn hàng"
        placement="right"
        width={500}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        footer={<div style={{ textAlign: "right" }}>{renderDrawerFooter()}</div>}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã đơn">
                {selectedOrder.code}
              </Descriptions.Item>
              <Descriptions.Item label="Bàn">
                {selectedOrder.table}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {selectedOrder.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tích lũy">
                {selectedOrder.point} điểm
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <span style={{ color: "red", fontWeight: "bold" }}>
                  {selectedOrder.total}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedOrder.status}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 20 }}>Chi tiết món</h4>
            <List
              dataSource={selectedOrder.items}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ flex: 1 }}>
                    <strong>{item.menu_item_name || item.name}</strong> x{item.quantity || item.qty}
                    {item.notes && (
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Ghi chú: {item.notes}
                      </div>
                    )}
                    {item.note && (
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Ghi chú: {item.note}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {parseInt(item.unit_price || item.price || 0).toLocaleString("vi-VN")}đ
                  </div>
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>


      {/* Modal Thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        open={modalThanhToan.open}
        onCancel={() => setModalThanhToan({ open: false, order: null })}
        footer={[
          <Button key="back" onClick={() => setModalThanhToan({ open: false, order: null })}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            style={{ background: "#226533" }}
            onClick={() => {
              updateOrderStatus(modalThanhToan.order.key, "Hoàn tất");
              message.success("Đơn hàng đã được thanh toán!");
              setModalThanhToan({ open: false, order: null });
              setSelectedOrder(null);
            }}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <p>Bạn có chắc muốn thanh toán đơn {modalThanhToan.order?.code} không?</p>
      </Modal>
    </Layout>
  );
};

export default OrderPage;
