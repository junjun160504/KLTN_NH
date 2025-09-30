<<<<<<< HEAD
import express from 'express';
import { getMenuItems, createMenuItem, getMenuCategories, getItemsByCategory, getAllItemsController } from '../controllers/menu.controller.js';

const router = express.Router();
router.get('/cus/menus/categories', getMenuCategories); // Lấy danh mục món 
router.get('/cus/menus/:name', getMenuItems);    // Lấy danh sách món
router.get("/cus/menus/category/:id", getItemsByCategory); // Lấy món theo danh mục
router.get("/cus/menus/all", getAllItemsController); // Lấy tất cả món (Admin)
router.post('/', createMenuItem);      // (Admin) Thêm món ăn mới
=======
import express from "express";
import {
  getMenuItems,
  createMenuItem,
  getMenuCategories,
  getItemsByCategory,
  getAllItemsController,
} from "../controllers/menu.controller.js";

const router = express.Router();

// Khách hàng xem món theo tên
router.get("/cus/menus/:name", getMenuItems);
>>>>>>> 8ed25645198c7ffebd23054b37902835d3d60089

// Khách hàng xem danh mục
router.get("/cus/menus/categories", getMenuCategories);

// Khách hàng xem món theo danh mục
router.get("/cus/menus/category/:id", getItemsByCategory);

// Admin: xem tất cả món
router.get("/cus/menus/all", getAllItemsController);

// Admin: thêm món
router.post("/admin/menus", createMenuItem);

export default router;
