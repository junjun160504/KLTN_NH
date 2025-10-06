import express from 'express';
import {
    submitReview,
    getReviews,
    getAllReviews,
    removeReview
} from '../controllers/review.controller.js';

const router = express.Router();

// Khách gửi review
router.post('/', submitReview);

// Lấy review theo qr_session_id
router.get('/:qr_session_id', getReviews);

// Lấy toàn bộ review (admin)
router.get('/', getAllReviews);

// Xoá review
router.delete('/:id', removeReview);

export default router;
