import express from "express";
import { createLog, listLogs, getLog } from "../controllers/audit.controller.js";

const router = express.Router();

// Ghi log
router.post("/", createLog);

// Lấy danh sách log (filter theo query: actor, action, target_type, from, to)
router.get("/", listLogs);

// Lấy chi tiết log
router.get("/:id", getLog);

export default router;
