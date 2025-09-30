import express from "express";
import {
  createOrder,
  addItemToOrder,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Tạo đơn mới
router.post("/", createOrder);

// Thêm món vào đơn
router.post("/:id/items", addItemToOrder);

// Xem đơn hàng theo ID
router.get("/:id", getOrderById);

// Cập nhật trạng thái đơn
router.put("/:id/status", updateOrderStatus);

export default router;
