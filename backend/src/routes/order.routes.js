import express from "express";
import {
  getAllOrders,
  createOrder,
  addItemToOrder,
  getOrderById,
  updateOrderStatus,
  getOrdersBySession,
  getOrdersByTable,
  removeItemFromOrder,
  updateItemQuantity,
  cancelOrder,
  createOrderByAdmin, // NEW: Admin create order
} from "../controllers/order.controller.js";

const router = express.Router();

// ========== ADMIN ROUTES ==========

/**
 * POST /api/orders/admin/create
 * Admin tạo order cho khách hàng tại quầy (không cần QR session)
 * Body: { table_id, items: [{menu_item_id, quantity, note}], customer_phone? }
 */
router.post("/admin/create", createOrderByAdmin);

// ========== CUSTOMER ROUTES ==========

// Lấy danh sách đơn (có thể filter theo status, qr_session_id, table_id)
router.get("/", getAllOrders);

// Lấy đơn theo qr_session_id
router.get("/session/:qr_session_id", getOrdersBySession);

// Lấy đơn theo table_id
router.get("/table/:table_id", getOrdersByTable);

// Xem đơn hàng theo ID
router.get("/:id", getOrderById);

// Tạo đơn mới với items
router.post("/", createOrder);

// Thêm món vào đơn (hỗ trợ 1 hoặc nhiều items)
router.post("/:id/items", addItemToOrder);

// Cập nhật trạng thái đơn
router.put("/:id/status", updateOrderStatus);

// ========== NEW FEATURES ==========

// Hủy đơn hàng (NEW hoặc IN_PROGRESS)
router.put("/:orderId/cancel", cancelOrder);

// Xóa món khỏi order (chỉ khi status = NEW)
router.delete("/:orderId/items/:itemId", removeItemFromOrder);

// Cập nhật số lượng món (chỉ khi status = NEW)
router.put("/:orderId/items/:itemId", updateItemQuantity);

export default router;

