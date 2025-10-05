import express from "express";
import {
  getMenuItems,
  createMenuItem,
  getMenuCategories,
  getItemsByCategory,
  getAllItemsController,
  getMenuItemDetail,
} from "../controllers/menu.controller.js";
console.log("Mounting /api/menu routes...");
const router = express.Router();
// Khách hàng xem danh mục
router.get("/cus/menus/categories", getMenuCategories);

// Khách hàng xem chi tiết món ăn (với reviews)
router.get("/cus/menus/item/:id", getMenuItemDetail);

// Khách hàng xem món theo tên
router.get("/cus/menus/:name", getMenuItems);

// Khách hàng xem món theo danh mục
router.get("/cus/menus/category/:id", getItemsByCategory);

// Admin: xem tất cả món
router.get("/cus/menus/all", getAllItemsController);

// Admin: thêm món
router.post("/admin/menus", createMenuItem);

export default router;
