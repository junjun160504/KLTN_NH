import express from 'express'
import * as reportReviewsController from '../controllers/reportReviews.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// Restaurant reviews
router.get('/restaurant/stats', verifyToken, reportReviewsController.getRestaurantReviewStats)
router.get('/restaurant/trend', verifyToken, reportReviewsController.getRestaurantReviewTrend)
router.get('/restaurant/recent', verifyToken, reportReviewsController.getRecentRestaurantReviews)

// Menu item reviews
router.get('/menu/stats', verifyToken, reportReviewsController.getMenuReviewStats)
router.get('/menu/trend', verifyToken, reportReviewsController.getMenuReviewTrend)
router.get('/menu/top-rated', verifyToken, reportReviewsController.getTopRatedMenuItems)
router.get('/menu/lowest-rated', verifyToken, reportReviewsController.getLowestRatedMenuItems)
router.get('/menu/recent', verifyToken, reportReviewsController.getRecentMenuReviews)

// Combined
router.get('/distribution', verifyToken, reportReviewsController.getCombinedRatingDistribution)

export default router
