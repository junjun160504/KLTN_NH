import express from 'express';
import { submitReview } from '../controllers/review.controller.js';

const router = express.Router();

router.post('/', submitReview);

export default router;
