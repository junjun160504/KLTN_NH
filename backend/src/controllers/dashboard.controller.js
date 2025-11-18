import * as dashboardService from '../services/dashboard.service.js'

/**
 * GET /api/dashboard/stats
 * Lấy key metrics cho dashboard
 * Query params: startDate, endDate
 */
export async function getKeyMetrics(req, res) {
  try {
    const { startDate, endDate } = req.query

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        status: 400,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    const stats = await dashboardService.getKeyMetrics({
      startDate: start,
      endDate: end
    })

    res.json({
      status: 200,
      data: stats
    })
  } catch (err) {
    console.error('getKeyMetrics error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/revenue
 * Lấy dữ liệu doanh thu với auto-groupBy
 * Query params: startDate, endDate, groupBy (optional: hour|day|week|month)
 */
export async function getRevenueChart(req, res) {
  try {
    const { startDate, endDate, groupBy } = req.query

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        status: 400,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    // Validate groupBy nếu có
    if (groupBy && !['hour', 'day', 'week', 'month'].includes(groupBy)) {
      return res.status(400).json({
        status: 400,
        message: 'groupBy phải là hour, day, week hoặc month'
      })
    }

    const data = await dashboardService.getRevenueData({
      startDate: start,
      endDate: end,
      groupBy // optional, auto-detect nếu undefined
    })

    res.json({
      status: 200,
      data: {
        groupBy: data.groupBy,
        chartData: data.data
      }
    })
  } catch (err) {
    console.error('getRevenueChart error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/top-dishes
 * Lấy TOP N món bán chạy nhất
 * Query params: startDate, endDate, limit (optional, default: 5)
 */
export async function getTopDishes(req, res) {
  try {
    const { startDate, endDate, limit } = req.query

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        status: 400,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    // Validate limit (optional)
    const parsedLimit = limit ? parseInt(limit) : 5
    if (parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        status: 400,
        message: 'limit phải từ 1 đến 50'
      })
    }

    const dishes = await dashboardService.getTopDishes({
      startDate: start,
      endDate: end,
      limit: parsedLimit
    })

    res.json({
      status: 200,
      data: dishes
    })
  } catch (err) {
    console.error('getTopDishes error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/order-status
 * Lấy phân bố trạng thái đơn hàng
 * Query params: startDate, endDate
 */
export async function getOrderStatus(req, res) {
  try {
    const { startDate, endDate } = req.query

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    if (start > end) {
      return res.status(400).json({
        status: 400,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    const statusData = await dashboardService.getOrderStatusDistribution({
      startDate: start,
      endDate: end
    })

    res.json({
      status: 200,
      data: statusData
    })
  } catch (err) {
    console.error('getOrderStatus error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/table-status
 * Lấy trạng thái bàn real-time (không cần date filter vì là real-time)
 */
export async function getTableStatus(req, res) {
  try {
    const tableStatus = await dashboardService.getTableStatus()

    res.json({
      status: 200,
      data: tableStatus
    })
  } catch (err) {
    console.error('getTableStatus error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/recent-orders?limit=5
 * Lấy danh sách đơn hàng gần đây (24h)
 */
export async function getRecentOrders(req, res) {
  try {
    const { limit } = req.query

    // Validate limit (optional, default 5)
    let parsedLimit = 5
    if (limit) {
      parsedLimit = parseInt(limit)
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({
          status: 400,
          message: 'limit phải từ 1 đến 50'
        })
      }
    }

    const orders = await dashboardService.getRecentOrders({
      limit: parsedLimit
    })

    res.json({
      status: 200,
      data: orders
    })
  } catch (err) {
    console.error('getRecentOrders error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}

/**
 * GET /api/dashboard/performance?startDate=...&endDate=...
 * Lấy performance metrics: completionRate, avgServiceTime, occupancyRate
 */
export async function getPerformance(req, res) {
  try {
    const { startDate, endDate } = req.query

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        message: 'startDate và endDate là bắt buộc'
      })
    }

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 400,
        message: 'Định dạng ngày không hợp lệ'
      })
    }

    // Validate date range (start <= end)
    if (start > end) {
      return res.status(400).json({
        status: 400,
        message: 'startDate phải nhỏ hơn hoặc bằng endDate'
      })
    }

    const performanceMetrics = await dashboardService.getPerformanceMetrics({
      startDate: start,
      endDate: end
    })

    res.json({
      status: 200,
      data: performanceMetrics
    })
  } catch (err) {
    console.error('getPerformance error:', err)
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    })
  }
}
