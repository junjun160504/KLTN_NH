import express from 'express'
import * as reportCustomersController from '../controllers/reportCustomers.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// GET /api/dashboard/customers/loyalty-trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/loyalty-trend', reportCustomersController.getLoyaltyTrend)

// GET /api/dashboard/customers/top?limit=10
router.get('/top', reportCustomersController.getTopCustomers)

// GET /api/dashboard/customers/point-distribution
router.get('/point-distribution', reportCustomersController.getPointDistribution)

export default router
