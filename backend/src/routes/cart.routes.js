import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    updateCartStatus
} from '../controllers/cart.controller.js';

const router = express.Router();

// ========== CUSTOMER CART ROUTES ==========

/**
 * GET /api/cart/cus/cart?qr_session_id=1
 * Lấy giỏ hàng theo qr_session_id
 */
router.get('/cus/cart', getCart);

/**
 * POST /api/cart/cus/cart
 * Thêm món vào giỏ hàng
 * Body: { qr_session_id, menu_item_id, quantity, note }
 */
router.post('/cus/cart', addToCart);

/**
 * DELETE /api/cart?qr_session_id=1
 * Xóa tất cả items trong giỏ hàng (Clear cart)
 */
router.delete('/', clearCart);

// ========== CART ITEM ROUTES ==========

/**
 * PUT /api/cart/items/:id
 * Cập nhật quantity hoặc note của cart item
 * Body: { quantity?, note? }
 */
router.put('/items/:id', updateCartItem);

/**
 * DELETE /api/cart/items/:id
 * Xóa một món khỏi giỏ hàng
 */
router.delete('/items/:id', removeCartItem);

// ========== CART STATUS ROUTES ==========

/**
 * PUT /api/cart/:id/status
 * Cập nhật status của cart (ACTIVE/ORDERED/CANCELLED)
 * Body: { status }
 */
router.put('/:id/status', updateCartStatus);

export default router;
