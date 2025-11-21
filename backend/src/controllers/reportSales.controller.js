import * as reportSalesService from '../services/reportSales.service.js'

/**
 * GET /api/dashboard/sales/trend
 * Lấy dữ liệu xu hướng kinh doanh
 * Query params: startDate, endDate, groupBy (hour|day|week|month)
 */
export async function getBusinessTrend(req, res) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate groupBy
    const validGroupBy = ['hour', 'day', 'week', 'month']
    if (!validGroupBy.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: 'groupBy phải là: hour, day, week, hoặc month'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    const data = await reportSalesService.getBusinessTrend({
      startDate: start,
      endDate: end,
      groupBy
    })

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in getBusinessTrend:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu xu hướng kinh doanh',
      error: error.message
    })
  }
}

/**
 * GET /api/dashboard/sales/dishes
 * Lấy doanh thu theo món ăn (TOP N)
 * Query params: startDate, endDate, limit (default: 15)
 */
export async function getDishRevenue(req, res) {
  try {
    const { startDate, endDate, limit = 15 } = req.query

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    // Validate limit
    const parsedLimit = parseInt(limit)
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'limit phải là số từ 1 đến 100'
      })
    }

    const data = await reportSalesService.getDishRevenue({
      startDate: start,
      endDate: end,
      limit: parsedLimit
    })

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in getDishRevenue:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu doanh thu món ăn',
      error: error.message
    })
  }
}

/**
 * GET /api/dashboard/sales/categories
 * Lấy doanh thu theo danh mục
 * Query params: startDate, endDate
 */
export async function getCategoryRevenue(req, res) {
  try {
    const { startDate, endDate } = req.query

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    const data = await reportSalesService.getCategoryRevenue({
      startDate: start,
      endDate: end
    })

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in getCategoryRevenue:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu doanh thu danh mục',
      error: error.message
    })
  }
}
