import express from "express";
import { addCustomer, getCustomers } from "../controllers/customer.controller.js";

const router = express.Router();

// Thêm khách mới
router.post("/", addCustomer);

// Lấy danh sách khách
router.get("/", getCustomers);

export default router;
