import { pool } from '../config/db.js'

/**
 * Report Sales Service
 * Xử lý logic nghiệp vụ cho báo cáo bán hàng chi tiết
 */

/**
 * Helper: Calculate growth percentage
 */
function calculateGrowth(current, previous) {
  if (!previous || previous === 0) return 0
  return (((current - previous) / previous) * 100).toFixed(1)
}

/**
 * Get business trend data với dynamic grouping
 * @param {Object} params - { startDate, endDate, groupBy }
 * @returns {Object} Trend data với summary metrics
 */
export async function getBusinessTrend({ startDate, endDate, groupBy = 'day' }) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Build dynamic query based on groupBy
  let dateFormat, labelFormat, groupByClause

  switch (groupBy) {
    case 'hour':
      dateFormat = "DATE_FORMAT(o.created_at, '%Y-%m-%d %H:00:00')"
      labelFormat = "DATE_FORMAT(o.created_at, '%H:00')"
      groupByClause = "DATE_FORMAT(o.created_at, '%Y-%m-%d %H:00:00'), DATE_FORMAT(o.created_at, '%H:00')"
      break
    case 'week':
      dateFormat = "DATE(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY))"
      labelFormat = "CONCAT('Tuần ', WEEK(o.created_at, 1))"
      groupByClause = "DATE(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY)), CONCAT('Tuần ', WEEK(o.created_at, 1))"
      break
    case 'month':
      dateFormat = "DATE_FORMAT(o.created_at, '%Y-%m-01')"
      labelFormat = "DATE_FORMAT(o.created_at, '%m/%Y')"
      groupByClause = "DATE_FORMAT(o.created_at, '%Y-%m-01'), DATE_FORMAT(o.created_at, '%m/%Y')"
      break
    default: // 'day'
      dateFormat = "DATE(o.created_at)"
      labelFormat = "DATE_FORMAT(o.created_at, '%d/%m')"
      groupByClause = "DATE(o.created_at), DATE_FORMAT(o.created_at, '%d/%m')"
  }

  // Query for current period trend with payment method breakdown
  const trendQuery = `
    SELECT 
      ${dateFormat} as date,
      ${labelFormat} as label,
      COALESCE(SUM(o.total_price), 0) as revenue,
      COALESCE(SUM(CASE WHEN p.method = 'BANKING' THEN p.amount ELSE 0 END), 0) as revenue_qr_banking,
      COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END), 0) as revenue_cash,
      COUNT(DISTINCT o.qr_session_id) as orders,
      COUNT(DISTINCT qs.customer_id) as customers,
      ROUND(COALESCE(SUM(o.total_price) / NULLIF(COUNT(DISTINCT o.qr_session_id), 0), 0), 2) as avgOrderValue
    FROM orders o
    LEFT JOIN qr_sessions qs ON o.qr_session_id = qs.id
    LEFT JOIN payments p ON o.id = p.order_id AND p.payment_status = 'PAID'
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
    GROUP BY ${groupByClause}
    ORDER BY date ASC
  `

  const [trend] = await pool.query(trendQuery, [start, end])

  // Calculate summary metrics
  const totalRevenue = trend.reduce((sum, item) => sum + parseFloat(item.revenue), 0)
  const totalOrders = trend.reduce((sum, item) => sum + parseInt(item.orders), 0)
  const totalCustomers = trend.reduce((sum, item) => sum + parseInt(item.customers), 0)
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0

  // Calculate growth (compare with previous period)
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - (daysDiff * 24 * 60 * 60 * 1000))

  const prevQuery = `
    SELECT 
      COALESCE(SUM(o.total_price), 0) as revenue,
      COUNT(DISTINCT o.qr_session_id) as orders,
      COUNT(DISTINCT qs.customer_id) as customers
    FROM orders o
    LEFT JOIN qr_sessions qs ON o.qr_session_id = qs.id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
  `

  const [[prevData]] = await pool.query(prevQuery, [prevStart, prevEnd])

  const growth = {
    revenue: calculateGrowth(totalRevenue, parseFloat(prevData?.revenue || 0)),
    orders: calculateGrowth(totalOrders, parseInt(prevData?.orders || 0)),
    customers: calculateGrowth(totalCustomers, parseInt(prevData?.customers || 0))
  }

  return {
    trend: trend.map(item => ({
      date: item.date,
      label: item.label,
      revenue: parseFloat(item.revenue),
      revenueQrBanking: parseFloat(item.revenue_qr_banking),
      revenueCash: parseFloat(item.revenue_cash),
      orders: parseInt(item.orders),
      customers: parseInt(item.customers),
      avgOrderValue: parseFloat(item.avgOrderValue)
    })),
    summary: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      totalCustomers,
      avgOrderValue: parseFloat(avgOrderValue),
      growth: {
        revenue: parseFloat(growth.revenue),
        orders: parseFloat(growth.orders),
        customers: parseFloat(growth.customers)
      }
    }
  }
}

/**
 * Get top dishes by revenue
 * @param {Object} params - { startDate, endDate, limit }
 * @returns {Array} Dish revenue data với growth metrics
 */
export async function getDishRevenue({ startDate, endDate, limit = 15 }) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Current period query
  const currentQuery = `
    SELECT 
      mi.id,
      mi.name,
      mc.name as category,
      mi.image_url as image,
      SUM(oi.quantity) as quantity,
      SUM(oi.quantity * oi.unit_price) as revenue,
      COUNT(DISTINCT oi.order_id) as orderCount
    FROM menu_items mi
    LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
    LEFT JOIN menu_categories mc ON mic.category_id = mc.id
    JOIN order_items oi ON mi.id = oi.menu_item_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
      AND mi.deleted_at IS NULL
    GROUP BY mi.id, mi.name, mc.name, mi.image_url
    ORDER BY revenue DESC
    LIMIT ?
  `

  const [currentData] = await pool.query(currentQuery, [start, end, parseInt(limit)])

  if (currentData.length === 0) {
    return []
  }

  // Previous period query (for growth calculation)
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - (daysDiff * 24 * 60 * 60 * 1000))

  const dishIds = currentData.map(d => d.id)

  const prevQuery = `
    SELECT 
      mi.id,
      SUM(oi.quantity * oi.unit_price) as prevRevenue
    FROM menu_items mi
    JOIN order_items oi ON mi.id = oi.menu_item_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
      AND mi.id IN (?)
    GROUP BY mi.id
  `

  const [prevData] = await pool.query(prevQuery, [prevStart, prevEnd, dishIds])

  // Map previous data
  const prevMap = new Map(prevData.map(d => [d.id, parseFloat(d.prevRevenue)]))

  // Calculate total revenue for percentages
  const totalRevenue = currentData.reduce((sum, item) => sum + parseFloat(item.revenue), 0)

  // Combine data with growth calculation
  return currentData.map(dish => {
    const prevRevenue = prevMap.get(dish.id) || 0
    const growth = calculateGrowth(parseFloat(dish.revenue), prevRevenue)

    return {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
      quantity: parseInt(dish.quantity),
      revenue: parseFloat(dish.revenue),
      sold: parseInt(dish.quantity), // Alias for frontend compatibility
      growth: parseFloat(growth),
      percentOfTotal: parseFloat(((parseFloat(dish.revenue) / totalRevenue) * 100).toFixed(2))
    }
  })
}

/**
 * Get category revenue breakdown
 * @param {Object} params - { startDate, endDate }
 * @returns {Array} Category revenue data với percentages
 */
export async function getCategoryRevenue({ startDate, endDate }) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const query = `
    SELECT 
      mc.id,
      mc.name,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue,
      COUNT(DISTINCT mi.id) as itemCount,
      COUNT(DISTINCT oi.order_id) as orderCount,
      COALESCE(SUM(oi.quantity), 0) as quantity
    FROM menu_categories mc
    LEFT JOIN menu_item_categories mic ON mc.id = mic.category_id
    LEFT JOIN menu_items mi ON mic.item_id = mi.id AND mi.deleted_at IS NULL
    LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
    LEFT JOIN orders o ON oi.order_id = o.id 
      AND o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
    WHERE mc.deleted_at IS NULL
    GROUP BY mc.id, mc.name
    HAVING revenue > 0
    ORDER BY revenue DESC
  `

  const [data] = await pool.query(query, [start, end])

  // Calculate total for percentages
  const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.revenue), 0)

  // Assign colors (matching frontend mock data)
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']

  return data.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    category: cat.name, // Alias for frontend compatibility
    revenue: parseFloat(cat.revenue),
    percentOfTotal: parseFloat(((parseFloat(cat.revenue) / totalRevenue) * 100).toFixed(2)),
    itemCount: parseInt(cat.itemCount),
    dishes: parseInt(cat.itemCount), // Alias for frontend compatibility
    orderCount: parseInt(cat.orderCount),
    quantity: parseInt(cat.quantity),
    color: colors[index % colors.length]
  }))
}
