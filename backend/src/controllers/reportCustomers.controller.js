import * as reportCustomersService from '../services/reportCustomers.service.js'

/**
 * Get loyalty program trend
 * GET /api/dashboard/customers/loyalty-trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getLoyaltyTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      })
    }

    // Validate date range (max 90 days)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0) {
      return res.status(400).json({
        success: false,
        message: 'endDate must be after startDate'
      })
    }

    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 90 days'
      })
    }

    const result = await reportCustomersService.getLoyaltyTrend(startDate, endDate)
    return res.json(result)
  } catch (error) {
    console.error('Error in getLoyaltyTrend controller:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

/**
 * Get top customers by points
 * GET /api/dashboard/customers/top?limit=10&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getTopCustomers = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query

    // Validate limit
    const limitNum = parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be between 1 and 100'
      })
    }

    const result = await reportCustomersService.getTopCustomers(limitNum, startDate, endDate)
    return res.json(result)
  } catch (error) {
    console.error('Error in getTopCustomers controller:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

/**
 * Get point distribution
 * GET /api/dashboard/customers/point-distribution
 */
export const getPointDistribution = async (req, res) => {
  try {
    const result = await reportCustomersService.getPointDistributionV2()
    return res.json(result)
  } catch (error) {
    console.error('Error in getPointDistribution controller:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}
