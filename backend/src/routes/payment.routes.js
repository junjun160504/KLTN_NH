import express from "express";
import {
  processPayment,
  callbackPayment,
  refundPayment,
  getPayment,
  listPayments,
  paymentByAdmin,
  notifyForUser,
  createSessionPayments,
  cancelSessionPayments
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ========== POST ROUTES (static paths first) ==========

// Payment by admin (Admin) - MUST be before POST /
router.post("/admin", verifyToken, paymentByAdmin);

// Tạo payment records cho session (Customer - Public)
router.post("/session", createSessionPayments);

// Hoàn tiền (Admin)
router.post("/refund", verifyToken, refundPayment);

// Callback Napas/VietQR (Public)
router.post("/callback", callbackPayment);

// Notification (Internal)
router.post("/noti", notifyForUser);

// Thanh toán (Customer - Public) - Default POST
router.post("/", processPayment);

// ========== GET ROUTES ==========

// Danh sách giao dịch (Admin) - MUST be before GET /:id
router.get("/", verifyToken, listPayments);

// Lấy 1 giao dịch (Admin)
router.get("/:id", verifyToken, getPayment);

// ========== PUT ROUTES ==========

// Hủy payment records cho session (Customer - Public)
router.put("/session/:sessionId/cancel", cancelSessionPayments);

export default router;
