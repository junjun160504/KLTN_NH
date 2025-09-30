import express from 'express';
import { getCart, addToCart } from '../controllers/cart.controller.js';

const router = express.Router();

// Xem giỏ hàng theo qr_session
router.get('/cus/cart', getCart);

// Thêm món vào giỏ hàng
router.post('/cus/cart', addToCart);

export default router;
