import express from 'express'
import * as reportSalesController from '../controllers/reportSales.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

/**
 * Report Sales Routes
 * Base path: /api/dashboard/sales
 * All routes require authentication
 */

// GET /api/dashboard/sales/trend?startDate=2024-10-01&endDate=2024-10-31&groupBy=day
router.get('/trend', verifyToken, reportSalesController.getBusinessTrend)

// GET /api/dashboard/sales/dishes?startDate=2024-10-01&endDate=2024-10-31&limit=15
router.get('/dishes', verifyToken, reportSalesController.getDishRevenue)

// GET /api/dashboard/sales/categories?startDate=2024-10-01&endDate=2024-10-31
router.get('/categories', verifyToken, reportSalesController.getCategoryRevenue)

export default router
