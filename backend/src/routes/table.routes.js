import express from "express";
import { createTable, updateTable, deleteTable, listTables, getTableById } from "../controllers/table.controller.js";
import { verifyToken, verifyRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ========== ADMIN ROUTES ==========
// OWNER, MANAGER can create/update/delete tables
router.post("/", verifyToken, verifyRole(['OWNER', 'MANAGER']), createTable);
router.get("/", verifyToken, listTables);
router.put("/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), updateTable);
router.delete("/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), deleteTable);

// ========== PUBLIC ROUTES (Customer needs to get table info) ==========
router.get("/:id", getTableById); // Customer cần lấy table_number từ QR session

export default router;
