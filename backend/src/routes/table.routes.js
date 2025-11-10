import express from "express";
import { createTable, updateTable, deleteTable, listTables, getTableById } from "../controllers/table.controller.js";

const router = express.Router();

router.post("/", createTable);
router.get("/", listTables);
router.get("/:id", getTableById); // ✅ Get table by ID
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

export default router;
