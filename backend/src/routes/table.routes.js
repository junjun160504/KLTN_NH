import express from "express";
import { createTable, updateTable, deleteTable, listTables, getTableById } from "../controllers/table.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ========== ADMIN ROUTES ==========
router.post("/", verifyToken, createTable);
router.get("/", verifyToken, listTables);
router.put("/:id", verifyToken, updateTable);
router.delete("/:id", verifyToken, deleteTable);

// ========== PUBLIC ROUTES (Customer needs to get table info) ==========
router.get("/:id", getTableById); // Customer cần lấy table_number từ QR session

export default router;
