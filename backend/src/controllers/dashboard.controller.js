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
