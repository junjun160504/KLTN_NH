import express from 'express';
import { getMenuItems, createMenuItem } from '../controllers/menu.controller.js';

const router = express.Router();

router.get('/', getMenuItems);         // Lấy danh sách món
router.post('/', createMenuItem);      // (Admin) Thêm món ăn mới

export default router;
