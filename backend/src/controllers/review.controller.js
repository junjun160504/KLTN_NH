import * as reviewService from '../services/review.service.js';

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
