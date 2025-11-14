import express from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'

const router = express.Router()

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 */

// GET /api/dashboard/stats?startDate=2024-11-13T00:00:00&endDate=2024-11-13T23:59:59
router.get('/stats', dashboardController.getKeyMetrics)

export default router
