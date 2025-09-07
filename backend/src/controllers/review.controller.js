import * as reviewService from '../services/review.service.js';

export async function submitReview(req, res) {
    try {
        const result = await reviewService.saveReview(req.body);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('submitReview error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
