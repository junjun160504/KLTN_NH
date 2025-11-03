import express from "express";
import { scanQr, endQr, validateSession } from "../controllers/qrSession.controller.js";

const router = express.Router();

router.post("/scan", scanQr);                      // quét QR, mở session
router.get("/:id/validate", validateSession);      // validate session từ localStorage
router.put("/:id/end", endQr);                     // kết thúc session

export default router;
