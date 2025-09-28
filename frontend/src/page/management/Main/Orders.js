import React, { useState } from "react";
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
} from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs"; // thêm thư viện này (cài: npm install dayjs)

const { Content } = Layout;
const { Option } = Select;

const OrderPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pageTitle] = useState("Đơn hàng");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalExport, setModalExport] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTime, setFilterTime] = useState("today"); // thêm state lọc thời gian
  const [searchText, setSearchText] = useState(""); // Thêm state cho tìm kiếm

  // danh sách món sẵn
  const menuList = [
    { name: "Cà phê sữa", price: 35000 },
    { name: "Trà đào", price: 40000 },
    { name: "Sinh tố xoài", price: 55000 },
    { name: "Khoai tây chiên", price: 65000 },
    { name: "Bánh ngọt", price: 50000 },
    { name: "Bánh mì", price: 30000 },
  ];

  // danh sách đơn hàng (thêm trường createdAt)
  const [orders, setOrders] = useState([
    {
      key: "1",
      code: "#PN0015",
      table: "Bàn 02",
      phone: "09xx xxx 123",
      point: 120,
      total: "275,000đ",
      status: "Chờ xác nhận",
      createdAt: dayjs().subtract(1, "day").toISOString(), // ví dụ: hôm qua
      items: [
        { name: "Cà phê sữa", qty: 2, price: "35000", note: "ít đá" },
        { name: "Bánh ngọt", qty: 1, price: "50000", note: "" },
      ],
    },
    {
      key: "2",
      code: "#PN0014",
      table: "Bàn 03",
      phone: "-",
      point: 0,
      total: "180,000đ",
      status: "Đang phục vụ",
      createdAt: dayjs().toISOString(), // hôm nay
      items: [
        { name: "Trà đào", qty: 2, price: "40000", note: "ít đường" },
        { name: "Bánh mì", qty: 1, price: "30000", note: "thêm pate" },
      ],
    },
    {
      key: "3",
      code: "#PN0013",
      table: "Bàn 07",
      phone: "08xx xxx 456",
      point: 85,
      total: "320,000đ",
      status: "Hoàn tất",
      createdAt: dayjs().subtract(8, "day").toISOString(), // 8 ngày trước
      items: [
        { name: "Sinh tố xoài", qty: 1, price: "55000", note: "" },
        { name: "Khoai tây chiên", qty: 2, price: "65000", note: "" },
      ],
    },
  ]);

  const pageSize = 5; // số đơn mỗi trang

  // 👉 lọc đơn hàng theo trạng thái, thời gian và tìm kiếm
  const filteredOrders = orders.filter((o) => {
    // Lọc trạng thái
    const statusMatch = filterStatus === "all" ? true : o.status === filterStatus;

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
  const [modalHuy, setModalHuy] = useState({ open: false, order: null });
  const [modalThanhToan, setModalThanhToan] = useState({ open: false, order: null });
  const [modalHoanDon, setModalHoanDon] = useState({ open: false, order: null });

  // state drawer tạo đơn mới
  const [newOrderDrawer, setNewOrderDrawer] = useState(false);
  const [newOrder, setNewOrder] = useState({ table: "", phone: "", point: 0, items: [] });
  const [newItem, setNewItem] = useState({ name: "", qty: 1, price: "", note: "" });

  // cập nhật trạng thái đơn
  const updateOrderStatus = (orderKey, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.key === orderKey ? { ...order, status: newStatus } : order
      )
    );
  };

  // thêm món mới vào đơn mới
  const addItemToNewOrder = () => {
    if (!newItem.name || !newItem.price) return message.warning("Chọn món trước!");
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewItem({ name: "", qty: 1, price: "", note: "" });
  };

  // tạo đơn mới
  const handleCreateOrder = () => {
    if (!newOrder.table) return message.error("Vui lòng chọn bàn!");
    if (newOrder.items.length === 0) return message.error("Đơn hàng chưa có món!");

    const newKey = (orders.length + 1).toString();
    const total = newOrder.items.reduce(
      (sum, i) => sum + parseInt(i.price || 0) * (i.qty || 1),
      0
    );
    const newOrderData = {
      key: newKey,
      code: `#PN00${10 + parseInt(newKey)}`,
      table: newOrder.table,
      phone: newOrder.phone || "-",
      point: 0,
      total: total.toLocaleString("vi-VN") + "đ",
      status: "Chờ xác nhận",
      items: newOrder.items,
    };
    setOrders((prev) => [newOrderData, ...prev]);
    setNewOrder({ table: "", phone: "", point: 0, items: [] });
    setNewItem({ name: "", qty: 1, price: "", note: "" });
    setNewOrderDrawer(false);
    message.success("Đơn hàng mới đã được tạo!");
  };

  // cột bảng
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      render: (t) => <strong>{t}</strong>,
    },
    { title: "Bàn", dataIndex: "table", key: "table" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      render: (p) => <span>{p} điểm</span>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (t) => (
        <span style={{ color: "red", fontWeight: "bold" }}>{t}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => {
        let color = "default";
        if (s === "Chờ xác nhận") color = "orange";
        else if (s === "Đang phục vụ") color = "blue";
        else if (s === "Hoàn tất") color = "green";
        else if (s === "Hủy món") color = "red";
        else if (s === "Hoàn đơn") color = "purple";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setSelectedOrder(record)}>
            Chi tiết
          </Button>
          <Button
            type="primary"
            size="small"
            disabled={record.status !== "Đang phục vụ"}
            style={{
              background:
                record.status === "Đang phục vụ" ? "#226533" : "#d9d9d9",
              borderColor:
                record.status === "Đang phục vụ" ? "#226533" : "#d9d9d9",
              color: record.status === "Đang phục vụ" ? "#fff" : "#999",
            }}
            onClick={() => setModalThanhToan({ open: true, order: record })}
          >
            Thanh toán
          </Button>
        </Space>
      ),
    },
  ];

  // render footer Drawer chi tiết đơn
  const renderDrawerFooter = () => {
    if (!selectedOrder) return null;
    const { status, key } = selectedOrder;

    if (status === "Hoàn tất") {
      return (
        <>
          <Button
            danger
            style={{ marginRight: 8 }}
            onClick={() => setModalHoanDon({ open: true, order: selectedOrder })}
          >
            Hoàn đơn
          </Button>
          <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
        </>
      );
    }

    if (status === "Hủy món" || status === "Hoàn đơn") {
      return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>;
    }

    if (status === "Chờ xác nhận") {
      return (
        <>
          <Button
            danger
            style={{ marginRight: 8 }}
            onClick={() => setModalHuy({ open: true, order: selectedOrder })}
          >
            Hủy
          </Button>
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
            danger
            style={{ marginRight: 8 }}
            onClick={() => setModalHuy({ open: true, order: selectedOrder })}
          >
            Hủy
          </Button>
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
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="Chờ xác nhận">Chờ xác nhận</Option>
              <Option value="Đang phục vụ">Đang phục vụ</Option>
              <Option value="Hoàn tất">Hoàn tất</Option>
              <Option value="Hủy món">Hủy món</Option>
              <Option value="Hoàn đơn">Hoàn đơn</Option>
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
            <Button
              type="primary"
              style={{ background: "#226533" }}
              onClick={() => setNewOrderDrawer(true)}
            >
              + Tạo đơn mới
            </Button>
            <Button onClick={() => setModalExport(true)}>Xuất file excel</Button>
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
                    <strong>{item.name}</strong> x{item.qty}
                    {item.note && (
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Ghi chú: {item.note}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {parseInt(item.price).toLocaleString("vi-VN")}đ
                  </div>
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>

      {/* Drawer tạo đơn mới */}
      <Drawer
        title="Tạo đơn hàng mới"
        placement="right"
        width={700}
        open={newOrderDrawer}
        onClose={() => setNewOrderDrawer(false)}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={() => setNewOrderDrawer(false)} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              style={{ background: "#226533" }}
              onClick={handleCreateOrder}
            >
              Tạo đơn
            </Button>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Chọn bàn */}
          <Select
            placeholder="Chọn bàn"
            value={newOrder.table}
            onChange={(val) => setNewOrder({ ...newOrder, table: val })}
            style={{ width: "100%" }}
          >
            {["Bàn 01", "Bàn 02", "Bàn 03", "Bàn 04", "Bàn 05"].map((b) => {
              const hasActiveOrder = orders.some(
                (o) =>
                  o.table === b &&
                  !["Hoàn tất", "Hủy món", "Hoàn đơn"].includes(o.status)
              );

              return (
                <Option key={b} value={b} disabled={hasActiveOrder}>
                  {b} {hasActiveOrder ? "(đang có đơn)" : ""}
                </Option>
              );
            })}
          </Select>

          {/* SĐT khách */}
          <Input
            placeholder="SĐT khách"
            value={newOrder.phone}
            onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
          />

          <h4>Thêm món</h4>
          {/* Chọn món từ danh sách */}
          <Select
            placeholder="Chọn món"
            value={newItem.name}
            onChange={(val) => {
              const selected = menuList.find((m) => m.name === val);
              setNewItem({
                ...newItem,
                name: selected.name,
                price: selected.price,
              });
            }}
            style={{ width: "100%" }}
          >
            {menuList.map((m) => (
              <Option key={m.name} value={m.name}>
                {m.name} - {m.price.toLocaleString("vi-VN")}đ
              </Option>
            ))}
          </Select>
          <Input
            placeholder="Số lượng"
            type="number"
            value={newItem.qty}
            onChange={(e) =>
              setNewItem({ ...newItem, qty: parseInt(e.target.value || 1) })
            }
          />
          <Input
            placeholder="Ghi chú"
            value={newItem.note}
            onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
          />
          <Button onClick={addItemToNewOrder}>+ Thêm món</Button>

          <h4>Danh sách món</h4>
          <List
            bordered
            dataSource={newOrder.items}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    danger
                    size="small"
                    onClick={() =>
                      setNewOrder((prev) => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong> x{item.qty}
                  {item.note && (
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Ghi chú: {item.note}
                    </div>
                  )}
                </div>
                <div>{parseInt(item.price).toLocaleString("vi-VN")}đ</div>
              </List.Item>
            )}
          />
        </Space>
      </Drawer>

      {/* Modal Hủy */}
      <Modal
        title="Xác nhận hủy đơn"
        open={modalHuy.open}
        onCancel={() => setModalHuy({ open: false, order: null })}
        footer={[
          <Button key="back" onClick={() => setModalHuy({ open: false, order: null })}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            style={{ background: "#226533" }}
            onClick={() => {
              updateOrderStatus(modalHuy.order.key, "Hủy món");
              message.success("Đơn hàng đã chuyển sang Hủy món");
              setModalHuy({ open: false, order: null });
              setSelectedOrder(null);
            }}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <p>Bạn có chắc muốn hủy đơn {modalHuy.order?.code} không?</p>
      </Modal>

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

      {/* Modal Hoàn đơn */}
      <Modal
        title="Xác nhận hoàn đơn"
        open={modalHoanDon.open}
        onCancel={() => setModalHoanDon({ open: false, order: null })}
        footer={[
          <Button key="back" onClick={() => setModalHoanDon({ open: false, order: null })}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            style={{ background: "#226533" }}
            onClick={() => {
              updateOrderStatus(modalHoanDon.order.key, "Hoàn đơn");
              message.success("Đơn hàng đã được hoàn đơn");
              setModalHoanDon({ open: false, order: null });
              setSelectedOrder(null);
            }}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <p>Bạn có chắc muốn hoàn đơn {modalHoanDon.order?.code} không?</p>
      </Modal>
    </Layout>
  );
};

export default OrderPage;
