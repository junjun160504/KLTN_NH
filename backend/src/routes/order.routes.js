import express from 'express';
import {
    createOrder,
    addItemToOrder,
    getOrderById,
    updateOrderStatus
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/', createOrder);                        // Tạo đơn mới
router.put('/:id/add', addItemToOrder);               // Thêm món vào đơn
router.get('/cus/orders/:id', getOrderById);                     // Lấy đơn theo ID
router.put('/:id/status', updateOrderStatus);         // Cập nhật trạng thái đơn

export default router;
