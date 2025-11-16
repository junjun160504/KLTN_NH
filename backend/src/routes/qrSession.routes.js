import express from "express";
import { scanQr, endQr, validateSession, updateSessionCustomer, getSessionById } from "../controllers/qrSession.controller.js";

const router = express.Router();

router.post("/scan", scanQr);                      // quét QR, mở session
router.get("/:id/validate", validateSession);      // validate session từ localStorage (PHẢI ĐẶT TRƯỚC /:id)
router.put("/:id/end", endQr);                     // kết thúc session
router.put("/:sessionId/customer", updateSessionCustomer); // update customer_id vào session
router.get("/:id", getSessionById);                // lấy thông tin session (cho admin) - ĐẶT CUỐI CÙNG

export default router;
