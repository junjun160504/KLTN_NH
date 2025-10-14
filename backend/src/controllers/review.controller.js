import * as reviewService from '../services/review.service.js';

// ========== RESTAURANT REVIEWS ==========

export async function submitReview(req, res) {
    try {
        const result = await reviewService.saveReview(req.body);
        res.status(201).json({ status: 201, data: result });
    } catch (err) {
        console.error('submitReview error:', err);
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function getReviews(req, res) {
    try {
        const { qr_session_id } = req.params;
        const result = await reviewService.getReviewsBySession(qr_session_id);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('getReviews error:', err);
        res.status(500).json({ status: 500, message: err.message });
    }
}

export async function getAllReviews(req, res) {
    try {
        const result = await reviewService.getAllReviews();
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('getAllReviews error:', err);
        res.status(500).json({ status: 500, message: err.message });
    }
}

export async function removeReview(req, res) {
    try {
        const { id } = req.params;
        const success = await reviewService.deleteReview(id);
        if (!success) {
            return res.status(404).json({ status: 404, message: "Review not found" });
        }
        res.status(200).json({ status: 200, message: "Review deleted" });
    } catch (err) {
        console.error('removeReview error:', err);
        res.status(500).json({ status: 500, message: err.message });
    }
}

// Lấy reviews theo menu item
export async function getReviewsByItem(req, res) {
    try {
        const { item_id } = req.params;
        const { limit, offset } = req.query;

        const result = await reviewService.getReviewsByItemId(item_id, {
            limit: limit ? parseInt(limit) : 10,
            offset: offset ? parseInt(offset) : 0
        });

        res.json({ status: 200, data: result });
    } catch (err) {
        console.error('getReviewsByItem error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

// ========== MENU ITEM REVIEWS ==========

// Submit menu item review
export async function submitMenuReview(req, res) {
    try {
        const result = await reviewService.saveMenuReview(req.body);
        res.status(201).json({ status: 201, data: result });
    } catch (err) {
        console.error('submitMenuReview error:', err);
        res.status(400).json({ status: 400, message: err.message });
    }
}

// Delete menu review
export async function removeMenuReview(req, res) {
    try {
        const { id } = req.params;
        const success = await reviewService.deleteMenuReview(id);
        if (!success) {
            return res.status(404).json({ status: 404, message: "Menu review not found" });
        }
        res.status(200).json({ status: 200, message: "Menu review deleted" });
    } catch (err) {
        console.error('removeMenuReview error:', err);
        res.status(500).json({ status: 500, message: err.message });
    }
}
