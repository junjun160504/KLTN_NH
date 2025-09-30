import express from "express";
import { confirmOrder, rejectOrder, updateOrderItem } from "../controllers/staffOrder.controller.js";

const router = express.Router();

router.put("/:id/confirm", confirmOrder);
router.put("/:id/reject", rejectOrder);
router.put("/item/:itemId", updateOrderItem);

export default router;
