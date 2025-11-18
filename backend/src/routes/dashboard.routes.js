import express from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 */

// GET /api/dashboard/stats?startDate=2024-11-13T00:00:00&endDate=2024-11-13T23:59:59
router.get('/stats', verifyToken, dashboardController.getKeyMetrics)

// GET /api/dashboard/revenue?startDate=...&endDate=...&groupBy=day (optional)
router.get('/revenue', verifyToken, dashboardController.getRevenueChart)

// GET /api/dashboard/top-dishes?startDate=...&endDate=...&limit=5 (optional)
router.get('/top-dishes', verifyToken, dashboardController.getTopDishes)

// GET /api/dashboard/order-status?startDate=...&endDate=...
router.get('/order-status', verifyToken, dashboardController.getOrderStatus)

// GET /api/dashboard/table-status (real-time, no date filter)
router.get('/table-status', verifyToken, dashboardController.getTableStatus)

// GET /api/dashboard/recent-orders?limit=5 (optional)
router.get('/recent-orders', verifyToken, dashboardController.getRecentOrders)

// GET /api/dashboard/performance?startDate=...&endDate=...
router.get('/performance', verifyToken, dashboardController.getPerformance)

export default router
