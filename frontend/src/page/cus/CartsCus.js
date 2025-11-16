import React, { useEffect, useState } from "react";
import CustomerFooterNav from "../../components/CustomerFooterNav";
import {
  Layout,
  Typography,
  Button,
  Checkbox,
  Modal,
  Input,
  App,
} from "antd";
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL; export default function CustomerCartPage() {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.cart.order);
  const { message } = App.useApp(); // ✅ Use App hook for message

  const [cart, setCart] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState("");

  useEffect(() => {
    if (order && order.foodOrderList) {
      const updatedCart = order.foodOrderList.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: item.quantity,
        img: item.image_url || "https://source.unsplash.com/80x80/?food",
        note: item.note || "",
      }));
      setCart(updatedCart);
    }
  }, [order]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  // ✅ tổng số lượng trong giỏ
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // ✅ tổng số lượng món được chọn
  const totalSelectedQty = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, item) => sum + item.qty, 0);

  // ✅ tổng tiền các món được chọn
  const totalPrice = cart
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

  // ✅ Cập nhật số lượng món
  const updateQty = (id, qty) => {
    if (qty <= 0) return;

    // Cập nhật state
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, qty } : item
    );
    setCart(updatedCart);

    // ✅ Đồng bộ sessionStorage
    const savedOrder = JSON.parse(sessionStorage.getItem("order")) || { orderId: null, foodOrderList: [] };
    savedOrder.foodOrderList = savedOrder.foodOrderList.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    sessionStorage.setItem("order", JSON.stringify(savedOrder));

    // ✅ Đồng bộ Redux
    dispatch(addToCart(savedOrder));
  };

  // ✅ Cập nhật ghi chú món ăn
  const updateNote = (id, note) => {
    // Cập nhật state
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, note } : item
    );
    setCart(updatedCart);

    // ✅ Đồng bộ sessionStorage
    const savedOrder = JSON.parse(sessionStorage.getItem("order")) || { orderId: null, foodOrderList: [] };
    savedOrder.foodOrderList = savedOrder.foodOrderList.map((item) =>
      item.id === id ? { ...item, note } : item
    );
    sessionStorage.setItem("order", JSON.stringify(savedOrder));

    // ✅ Đồng bộ Redux
    dispatch(addToCart(savedOrder));

    setEditingNoteId(null);
    message.success("Đã lưu ghi chú");
  };

  // ✅ Bắt đầu chỉnh sửa ghi chú
  const startEditNote = (id, currentNote) => {
    setEditingNoteId(id);
    setTempNote(currentNote || "");
  };

  // ✅ Hủy chỉnh sửa ghi chú
  const cancelEditNote = () => {
    setEditingNoteId(null);
    setTempNote("");
  };

  // ✅ Xóa các món đã chọn sau khi đặt hàng
  const handleCloseModal = () => {
    setIsModalVisible(false);

    // Lọc bỏ các món đã chọn
    const remainingCart = cart.filter((item) => !selectedItems.includes(item.id));
    setCart(remainingCart);
    setSelectedItems([]);

    // ✅ Đồng bộ sessionStorage
    const savedOrder = JSON.parse(sessionStorage.getItem("order")) || { orderId: null, foodOrderList: [] };
    savedOrder.foodOrderList = savedOrder.foodOrderList.filter(
      (item) => !selectedItems.includes(item.id)
    );
    sessionStorage.setItem("order", JSON.stringify(savedOrder));

    // ✅ Đồng bộ Redux
    dispatch(addToCart(savedOrder));
  };

  // ✅ Xóa một món khỏi giỏ hàng
  const removeItem = (id) => {
    // Cập nhật state
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);

    // Xóa khỏi selectedItems nếu có
    setSelectedItems(selectedItems.filter((sid) => sid !== id));

    // ✅ Đồng bộ sessionStorage
    const savedOrder = JSON.parse(sessionStorage.getItem("order")) || { orderId: null, foodOrderList: [] };
    savedOrder.foodOrderList = savedOrder.foodOrderList.filter((item) => item.id !== id);
    sessionStorage.setItem("order", JSON.stringify(savedOrder));

    // ✅ Đồng bộ Redux
    dispatch(addToCart(savedOrder));

    message.success("Đã xóa món khỏi giỏ hàng");
  };

  const toggleSelect = (id, checked) => {
    if (checked) setSelectedItems([...selectedItems, id]);
    else setSelectedItems(selectedItems.filter((sid) => sid !== id));
  };

  const toggleSelectAll = (checked) => {
    if (checked) setSelectedItems(cart.map((i) => i.id));
    else setSelectedItems([]);
  };

  // ✅ Đặt hàng với API mới (optimized)
  const handleOrderNow = async () => {
    if (selectedItems.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 món để đặt hàng!");
      return;
    }

    try {
      // Get qr_session_id from localStorage (created when QR scanned)
      const sessionData = localStorage.getItem("qr_session");
      if (!sessionData) {
        message.error("Không tìm thấy phiên đặt bàn. Vui lòng quét lại QR!");
        navigate("/cus/qr-scan");
        return;
      }

      const { session_id: qr_session_id, status } = JSON.parse(sessionData);

      // Validate session is still active
      if (status !== "ACTIVE") {
        if (status === "COMPLETED") {
          message.error("Phiên đã thanh toán xong. Vui lòng quét QR mới để đặt hàng!");
        } else {
          message.error("Phiên đặt bàn đã kết thúc. Vui lòng quét lại QR!");
        }
        navigate("/cus/homes"); // Navigate to homes instead of qr-scan
        return;
      }

      // Prepare items for order (only selected items from cart)
      const orderItems = cart
        .filter((item) => selectedItems.includes(item.id))
        .map((item) => ({
          menu_item_id: item.id,
          quantity: item.qty,
          note: item.note || null,
        }));

      console.log("Creating order:", {
        qr_session_id,
        items: orderItems,
      });

      // Create order with items (single API call)
      await axios.post(`${REACT_APP_API_URL}/orders`, {
        qr_session_id,
        items: orderItems,
      });

      // Show success message
      message.success("Đơn hàng đã được gửi đến bếp! 🎉");

      // Remove ordered items from cart
      const remainingCart = cart.filter((item) => !selectedItems.includes(item.id));
      setCart(remainingCart);
      setSelectedItems([]);

      // Update sessionStorage and Redux (remove ordered items)
      const savedOrder = JSON.parse(sessionStorage.getItem("order")) || {
        orderId: null,
        foodOrderList: [],
      };
      savedOrder.foodOrderList = savedOrder.foodOrderList.filter(
        (item) => !selectedItems.includes(item.id)
      );
      sessionStorage.setItem("order", JSON.stringify(savedOrder));
      dispatch(addToCart(savedOrder));

      // Show success modal
      setIsModalVisible(true);

    } catch (error) {
      console.error("Order error:", error);
      const errorMsg = error.response?.data?.message || "Đặt hàng thất bại! Vui lòng thử lại.";
      message.error(errorMsg);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* -------- HEADER -------- */}
      <Header
        className="transition-all duration-300"
        style={{
          background: "#fff",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ color: "#333", fontSize: 18 }} />}
          onClick={() => navigate(-1)}
        />
        <div className="text-center">
          <Title level={5} style={{ margin: 0, color: "#226533", fontWeight: 600 }}>
            Giỏ hàng của bạn
          </Title>
        </div>
        <div style={{ width: 40 }}></div>
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{
          padding: "12px",
          paddingTop: "76px",
          paddingBottom: "190px",
        }}
      >
        {/* Chọn tất cả */}
        <div
          className="bg-white rounded-lg border border-gray-200 transition-all hover:shadow-sm"
          style={{ marginBottom: 12, padding: "10px 12px" }}
        >
          <Checkbox
            checked={selectedItems.length === cart.length && cart.length > 0}
            indeterminate={
              selectedItems.length > 0 && selectedItems.length < cart.length
            }
            onChange={(e) => toggleSelectAll(e.target.checked)}
          >
            <Text strong style={{ fontSize: 14 }}>
              Chọn tất cả ({selectedItems.length}/{cart.length})
            </Text>
          </Checkbox>
        </div>

        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md"
            style={{
              padding: 12,
              marginBottom: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Progress bar decoration */}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Checkbox */}
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onChange={(e) => toggleSelect(item.id, e.target.checked)}
                style={{ flexShrink: 0 }}
              />

              {/* Image - Clickable */}
              <img
                src={item.img}
                alt={item.name}
                className="rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
                onClick={() => navigate(`/food/${item.id}`)}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <Text
                    strong
                    className="cursor-pointer hover:text-[#226533] transition-colors"
                    style={{
                      fontSize: 14,
                      display: "block",
                      marginRight: 8,
                    }}
                    onClick={() => navigate(`/food/${item.id}`)}
                  >
                    {item.name}
                  </Text>
                  <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    size="small"
                    onClick={() => removeItem(item.id)}
                    style={{ flexShrink: 0 }}
                  />
                </div>

                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginBottom: 6 }}
                >
                  {Number(item.price).toLocaleString()}đ
                </Text>

                {/* Quantity Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div
                    className="transition-all duration-200"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      background: "#f5f7fa",
                      borderRadius: 8,
                      padding: "4px 6px",
                      border: "1px solid #e8e8e8",
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="hover:bg-red-50 transition-all"
                      style={{
                        width: 26,
                        height: 26,
                        padding: 0,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "#fff",
                        color: item.qty <= 1 ? "#d9d9d9" : "#ff4d4f",
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      −
                    </Button>
                    <div
                      style={{
                        minWidth: 36,
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#226533",
                        padding: "0 8px",
                      }}
                    >
                      {item.qty}
                    </div>
                    <Button
                      size="small"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="hover:bg-green-50 transition-all"
                      style={{
                        width: 26,
                        height: 26,
                        padding: 0,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "#fff",
                        color: "#226533",
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      +
                    </Button>
                  </div>

                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      color: "#226533",
                      fontWeight: 700,
                    }}
                  >
                    {(Number(item.price) * item.qty).toLocaleString()}đ
                  </Text>
                </div>

                {/* Note Section - Matching BillsCus.js style */}
                {editingNoteId === item.id ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 6,
                      background: "rgba(34, 101, 51, 0.05)",
                      border: "1px solid #226533",
                    }}
                  >
                    <TextArea
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Ví dụ: Ít đá, không đường..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{
                        fontSize: 12,
                        marginBottom: 6,
                        borderRadius: 6,
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={cancelEditNote}
                        style={{ fontSize: 11 }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => updateNote(item.id, tempNote)}
                        style={{
                          fontSize: 11,
                          background: "#226533",
                          borderColor: "#226533",
                        }}
                      >
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.note ? (
                      <div
                        onClick={() => startEditNote(item.id, item.note)}
                        style={{
                          marginTop: 6,
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.03)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        className="hover:bg-gray-100"
                      >
                        <Text style={{ fontSize: 11, color: "#666" }}>
                          💬 {item.note}
                        </Text>
                      </div>
                    ) : (
                      <Button
                        type="dashed"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEditNote(item.id, "")}
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          height: 26,
                          borderColor: "#d9d9d9",
                        }}
                      >
                        Thêm ghi chú
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </Content>

      {/* -------- FIXED FOOTER PAYMENT -------- */}
      <div
        className="animate-slide-up"
        style={{
          position: "fixed",
          bottom: 60,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "2px solid #f0f0f0",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          zIndex: 1000,
        }}
      >
        {/* Compact Summary */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}>
          {/* Left: Total Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
              <Text strong style={{ fontSize: 16, color: "#226533" }}>
                {totalPrice.toLocaleString()}đ
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({totalSelectedQty} món)
              </Text>
            </div>
          </div>

          {/* Right: Order Button */}
          <Button
            type="primary"
            size="large"
            disabled={selectedItems.length === 0}
            style={{
              fontSize: 15,
              fontWeight: 600,
              height: 44,
              paddingLeft: 24,
              paddingRight: 24,
              background: selectedItems.length === 0
                ? "#d9d9d9"
                : "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
              border: "none",
              borderRadius: 10,
              boxShadow: selectedItems.length > 0 ? "0 4px 12px rgba(34, 101, 51, 0.3)" : "none",
              flexShrink: 0,
            }}
            onClick={handleOrderNow}
          >
            🛒 Đặt hàng
          </Button>
        </div>
      </div>

      {/* -------- FOOTER NAV -------- */}
      <CustomerFooterNav cartCount={cartCount} />

      {/* -------- MODAL ĐẶT HÀNG THÀNH CÔNG -------- */}
      <Modal
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        centered
        width={360}
      >
        <div style={{ textAlign: "center", padding: "24px 8px" }}>
          <div
            className="animate-bounce"
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40 }}>🎉</span>
          </div>

          <Title level={3} style={{ marginBottom: 8, color: "#226533" }}>
            Đặt hàng thành công!
          </Title>
          <Text style={{ fontSize: 15, color: "#666", display: "block", marginBottom: 24 }}>
            Đơn hàng của bạn đã được gửi đến bếp.
            <br />
            Bạn có muốn order thêm không? 🍽️
          </Text>

          <div className="flex gap-3" style={{ display: "flex", gap: 12 }}>
            <Button
              type="primary"
              size="large"
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                border: "none",
                borderRadius: 12,
              }}
              onClick={() => {
                handleCloseModal();
                navigate("/cus/menus");
              }}
            >
              🍜 Order tiếp
            </Button>
            <Button
              size="large"
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                borderColor: "#226533",
                color: "#226533",
              }}
              onClick={() => {
                handleCloseModal();
                navigate("/cus/bills");
              }}
            >
              📋 Xem đơn
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
