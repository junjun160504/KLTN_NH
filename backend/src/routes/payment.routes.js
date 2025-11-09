import express from "express";
import {
  processPayment,
  callbackPayment,
  refundPayment,
  getPayment,
  listPayments,
  paymentByAdmin,
  notifyForUser
} from "../controllers/payment.controller.js";

const router = express.Router();

// Thanh toán
router.post("/", processPayment);

// Callback Napas/VietQR
router.post("/callback", callbackPayment);

// Hoàn tiền
router.post("/refund", refundPayment);

// Lấy 1 giao dịch
router.get("/:id", getPayment);

// Danh sách giao dịch
router.get("/", listPayments);

// Payment by admin 
router.post("/admin", paymentByAdmin);

router.post("/noti", notifyForUser);

export default router;
