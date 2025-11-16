import express from "express";
import { createLog, listLogs, getLog } from "../controllers/audit.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Ghi log
router.post("/", verifyToken, createLog);

// Lấy danh sách log (filter theo query: actor, action, target_type, from, to)
router.get("/", verifyToken, listLogs);

// Lấy chi tiết log
router.get("/:id", verifyToken, getLog);

export default router;
