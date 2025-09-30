import express from "express";
import { scanQr, endQr } from "../controllers/qrSession.controller.js";

const router = express.Router();

router.post("/scan", scanQr);   // quét QR, mở session
router.put("/:id/end", endQr);  // kết thúc session

export default router;
