import { pool } from '../config/db.js'

/**
 * Dashboard Service
 * Xử lý logic nghiệp vụ cho dashboard analytics
 */

/**
 * Lấy key metrics cho dashboard
 * @param {Object} params - { startDate, endDate }
 * @returns {Object} Stats with growth rates
 */
export async function getKeyMetrics({ startDate, endDate }) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Tính khoảng thời gian kỳ trước (previous period)
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(start.getTime() - 1) // 1ms trước startDate
  const prevStart = new Date(prevEnd.getTime() - (daysDiff * 24 * 60 * 60 * 1000))

  // Query song song cho hiệu suất
  const [currentStats, previousStats] = await Promise.all([
    getStatsForPeriod(start, end),
    getStatsForPeriod(prevStart, prevEnd)
  ])

  // Tính growth rates
  const ordersGrowth = calculateGrowth(currentStats.orders, previousStats.orders)
  const revenueGrowth = calculateGrowth(currentStats.revenue, previousStats.revenue)
  const customersGrowth = calculateGrowth(currentStats.customers, previousStats.customers)
  const avgOrderValueGrowth = calculateGrowth(currentStats.avgOrderValue, previousStats.avgOrderValue)

  return {
    orders: {
      value: currentStats.orders,
      growth: parseFloat(ordersGrowth),
      previousValue: previousStats.orders
    },
    revenue: {
      value: currentStats.revenue,
      growth: parseFloat(revenueGrowth),
      previousValue: previousStats.revenue
    },
    customers: {
      value: currentStats.customers,
      growth: parseFloat(customersGrowth),
      previousValue: previousStats.customers
    },
    avgOrderValue: {
      value: currentStats.avgOrderValue,
      growth: parseFloat(avgOrderValueGrowth),
      previousValue: previousStats.avgOrderValue
    }
  }
}

/**
 * Lấy stats cho một khoảng thời gian cụ thể
 * Logic:
 * - Orders = Số sessions (qr_sessions)
 * - Customers = Số sessions (vì 1 session = 1 lượt khách)
 * - Revenue = Tổng payments đã paid
 * - Avg Order Value = Trung bình revenue/session
 */
async function getStatsForPeriod(startDate, endDate) {
  const query = `
    SELECT 
      -- Đếm số sessions (= số đơn hàng = số khách)
      COUNT(DISTINCT qs.id) as total_sessions,
      
      -- Tổng doanh thu từ payments
      COALESCE(SUM(p.amount), 0) as total_revenue,
      
      -- Số sessions có payment (để tính avg)
      COUNT(DISTINCT CASE 
        WHEN p.payment_status = 'PAID' THEN qs.id 
      END) as paid_sessions
      
    FROM qr_sessions qs
    LEFT JOIN orders o ON o.qr_session_id = qs.id
    LEFT JOIN payments p ON p.order_id = o.id 
      AND p.payment_status = 'PAID'
    WHERE qs.created_at BETWEEN ? AND ?
      AND qs.status IN ('ACTIVE', 'COMPLETED')
  `

  const [rows] = await pool.query(query, [startDate, endDate])
  const stats = rows[0]

  const totalSessions = parseInt(stats.total_sessions) || 0
  const totalRevenue = parseFloat(stats.total_revenue) || 0
  const paidSessions = parseInt(stats.paid_sessions) || 0

  // Tính trung bình giá trị đơn hàng (revenue / số sessions có payment)
  const avgOrderValue = paidSessions > 0 ? totalRevenue / paidSessions : 0

  return {
    orders: totalSessions, // Số sessions
    revenue: totalRevenue, // Tổng doanh thu
    customers: totalSessions, // Số khách = số sessions
    avgOrderValue: avgOrderValue // Trung bình/session
  }
}

/**
 * Tính % tăng trưởng
 * @param {Number} current - Giá trị hiện tại
 * @param {Number} previous - Giá trị kỳ trước
 * @returns {String} Growth rate (e.g., "23.5" or "-10.2")
 */
function calculateGrowth(current, previous) {
  if (previous === 0) {
    return current > 0 ? '100.0' : '0.0'
  }
  const growth = ((current - previous) / previous) * 100
  return growth.toFixed(1)
}
