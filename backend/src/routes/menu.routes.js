import express from 'express';
import { getMenuItems, createMenuItem,getMenuCategories ,getItemsByCategory, getAllItemsController } from '../controllers/menu.controller.js';

const router = express.Router();

router.get('/cus/menus/:name', getMenuItems);    // Lấy danh sách món
router.get('/cus/menus/categories', getMenuCategories); // Lấy danh mục món 
router.get("/cus/menus/category/:id", getItemsByCategory); // Lấy món theo danh mục
router.get("/cus/menus/all", getAllItemsController); // Lấy tất cả món (Admin)
router.post('/', createMenuItem);      // (Admin) Thêm món ăn mới



export default router;
