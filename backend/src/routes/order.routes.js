import express from "express";
import {
  getAllOrders,
  createOrder,
  addItemToOrder,
  getOrderById,
  updateOrderStatus,
  getOrdersBySession,
  getOrdersByTable,
} from "../controllers/order.controller.js";

const router = express.Router();

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
router.post("/:id/items", addItemToOrder); // thừa 

// Cập nhật trạng thái đơn
router.put("/:id/status", updateOrderStatus);

export default router;

