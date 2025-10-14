import express from 'express';
import {
    submitReview,
    getReviews,
    getAllReviews,
    removeReview,
    getReviewsByItem,
    submitMenuReview,
    removeMenuReview,
} from '../controllers/review.controller.js';

const router = express.Router();

// ========== RESTAURANT REVIEWS ==========
// Khách gửi review nhà hàng
router.post('/', submitReview);

// Lấy review nhà hàng theo qr_session_id
router.get('/restaurant/:qr_session_id', getReviews);

// Lấy toàn bộ review nhà hàng (admin)
router.get('/restaurant', getAllReviews);

// Xoá review nhà hàng
router.delete('/restaurant/:id', removeReview);

// ========== MENU ITEM REVIEWS ==========
// Submit menu item review
router.post('/menu', submitMenuReview);

// Lấy review theo menu item ID
router.get('/menu/item/:item_id', getReviewsByItem);

// Xóa menu review
router.delete('/menu/:id', removeMenuReview);

export default router;
