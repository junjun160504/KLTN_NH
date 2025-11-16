import express from "express";
import * as pointController from "../controllers/point.controller.js";

const router = express.Router();

// 📊 Lấy thông tin điểm của customer
router.get("/customer/:customerId", pointController.getCustomerPoints);

export default router;
