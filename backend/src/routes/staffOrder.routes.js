import express from "express";
import { confirmOrder, rejectOrder, updateOrderItem } from "../controllers/staffOrder.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/:id/confirm", verifyToken, confirmOrder);
router.put("/:id/reject", verifyToken, rejectOrder);
router.put("/item/:itemId", verifyToken, updateOrderItem);

export default router;
