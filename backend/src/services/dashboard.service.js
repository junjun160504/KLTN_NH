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
 * - Orders = Số sessions CÓ ORDERS hợp lệ (không tính CANCELLED)
 * - Customers = Số khách hàng đăng ký tích điểm (customer_id NOT NULL)
 * - Revenue = Tổng revenue từ orders hoàn thành (DONE, PAID)
 * - Avg Order Value = Trung bình revenue/session có payment
 */
async function getStatsForPeriod(startDate, endDate) {
  const query = `
    SELECT 
      -- Đếm số sessions có orders hợp lệ (không tính CANCELLED)
      COUNT(DISTINCT o.qr_session_id) as total_orders,
      
      -- Tổng doanh thu từ orders hoàn thành
      COALESCE(SUM(CASE 
        WHEN o.status IN ('DONE', 'PAID') 
        THEN o.total_price 
        ELSE 0 
      END), 0) as total_revenue,
      
      -- Số sessions có payment
      COUNT(DISTINCT CASE 
        WHEN o.status IN ('DONE', 'PAID') AND o.total_price > 0
        THEN o.qr_session_id 
      END) as paid_sessions,
      
      -- Số khách hàng đăng ký tích điểm (có customer_id)
      COUNT(DISTINCT CASE 
        WHEN qs.customer_id IS NOT NULL THEN qs.customer_id 
      END) as registered_customers
      
    FROM orders o
    JOIN qr_sessions qs ON qs.id = o.qr_session_id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status != 'CANCELLED'
  `

  const [rows] = await pool.query(query, [startDate, endDate])
  const stats = rows[0]

  const totalOrders = parseInt(stats.total_orders) || 0
  const totalRevenue = parseFloat(stats.total_revenue) || 0
  const paidSessions = parseInt(stats.paid_sessions) || 0
  const registeredCustomers = parseInt(stats.registered_customers) || 0

  // Tính trung bình giá trị đơn hàng (revenue / số sessions có payment)
  const avgOrderValue = paidSessions > 0 ? totalRevenue / paidSessions : 0

  return {
    orders: totalOrders, // Số sessions có orders hợp lệ
    revenue: totalRevenue, // Tổng doanh thu
    customers: registeredCustomers, // Số khách hàng đăng ký tích điểm
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

/**
 * ==================== PHASE 3: REVENUE CHART ====================
 */

/**
 * Lấy dữ liệu doanh thu với auto-groupBy thông minh
 * @param {Object} params - { startDate, endDate, groupBy }
 * @returns {Object} { groupBy, data }
 */
export async function getRevenueData({ startDate, endDate, groupBy }) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Auto-detect groupBy nếu không được chỉ định
  const autoGroupBy = groupBy || determineGroupBy(start, end)

  let data = []

  // Query dựa theo groupBy
  switch (autoGroupBy) {
    case 'hour':
      data = await getRevenueByHour(start, end)
      break
    case 'day':
      data = await getRevenueByDay(start, end)
      break
    case 'week':
      data = await getRevenueByWeek(start, end)
      break
    case 'month':
      data = await getRevenueByMonth(start, end)
      break
    default:
      data = await getRevenueByDay(start, end)
  }

  return {
    groupBy: autoGroupBy,
    data
  }
}

/**
 * Tự động xác định groupBy dựa trên khoảng thời gian
 * Logic:
 * - ≤ 2 ngày (48h) → group by hour
 * - ≤ 45 ngày → group by day
 * - ≤ 180 ngày (6 tháng) → group by week
 * - > 180 ngày → group by month
 */
function determineGroupBy(startDate, endDate) {
  const hours = (endDate - startDate) / (1000 * 60 * 60)

  if (hours <= 48) return 'hour' // ≤ 2 ngày
  if (hours <= 1080) return 'day' // ≤ 45 ngày (45*24)
  if (hours <= 4320) return 'week' // ≤ 180 ngày (6 tháng)
  return 'month' // > 6 tháng
}

/**
 * Lấy revenue TỔNG HỢP theo GIỜ TRONG NGÀY (0-23h)
 * Logic: Tổng hợp doanh thu theo từng giờ bất kể ngày nào trong date range
 * VD: Date Range 01/11-05/11 → 24 điểm dữ liệu
 *   - 00:00 = Tổng revenue của TẤT CẢ đơn hàng từ 00:00-00:59 trong 5 ngày
 *   - 08:00 = Tổng revenue của TẤT CẢ đơn hàng từ 08:00-08:59 trong 5 ngày
 * 
 * Business Value: Phân tích "Khung giờ vàng" để tối ưu nhân sự và marketing
 */
async function getRevenueByHour(startDate, endDate) {
  const query = `
    SELECT 
      HOUR(o.created_at) as hour_of_day,
      CONCAT(LPAD(HOUR(o.created_at), 2, '0'), ':00') as label,
      COUNT(DISTINCT o.qr_session_id) as order_count,
      COALESCE(SUM(CASE WHEN o.status IN ('DONE', 'PAID') THEN o.total_price ELSE 0 END), 0) as revenue
    FROM orders o
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status != 'CANCELLED'
    GROUP BY hour_of_day, label
    ORDER BY hour_of_day
  `

  const [rows] = await pool.query(query, [startDate, endDate])

  return rows.map(row => ({
    time: row.hour_of_day,
    label: row.label,
    revenue: parseFloat(row.revenue) || 0,
    orders: parseInt(row.order_count) || 0
  }))
}

/**
 * Lấy revenue group by DAY
 */
async function getRevenueByDay(startDate, endDate) {
  const query = `
    SELECT 
      DATE(o.created_at) as time_bucket,
      DATE_FORMAT(o.created_at, '%d/%m') as label,
      DAYNAME(o.created_at) as day_name,
      COUNT(DISTINCT o.qr_session_id) as order_count,
      COALESCE(SUM(CASE WHEN o.status IN ('DONE', 'PAID') THEN o.total_price ELSE 0 END), 0) as revenue
    FROM orders o
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status != 'CANCELLED'
    GROUP BY time_bucket, label, day_name
    ORDER BY time_bucket
  `

  const [rows] = await pool.query(query, [startDate, endDate])

  return rows.map(row => ({
    time: row.time_bucket,
    label: row.label,
    dayName: row.day_name,
    revenue: parseFloat(row.revenue) || 0,
    orders: parseInt(row.order_count) || 0
  }))
}

/**
 * Lấy revenue group by WEEK
 */
async function getRevenueByWeek(startDate, endDate) {
  const query = `
    SELECT 
      YEARWEEK(o.created_at, 1) as week_number,
      DATE(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY)) as week_start,
      DATE_FORMAT(DATE(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY)), '%d/%m') as label,
      COUNT(DISTINCT o.qr_session_id) as order_count,
      COALESCE(SUM(CASE WHEN o.status IN ('DONE', 'PAID') THEN o.total_price ELSE 0 END), 0) as revenue
    FROM orders o
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status != 'CANCELLED'
    GROUP BY week_number, week_start, label
    ORDER BY week_start
  `

  const [rows] = await pool.query(query, [startDate, endDate])

  return rows.map(row => ({
    time: row.week_start,
    label: `Tuần ${row.label}`,
    revenue: parseFloat(row.revenue) || 0,
    orders: parseInt(row.order_count) || 0
  }))
}

/**
 * Lấy revenue group by MONTH
 */
async function getRevenueByMonth(startDate, endDate) {
  const query = `
    SELECT 
      DATE_FORMAT(o.created_at, '%Y-%m') as time_bucket,
      DATE_FORMAT(o.created_at, '%m/%Y') as label,
      MONTHNAME(o.created_at) as month_name,
      COUNT(DISTINCT o.qr_session_id) as order_count,
      COALESCE(SUM(CASE WHEN o.status IN ('DONE', 'PAID') THEN o.total_price ELSE 0 END), 0) as revenue
    FROM orders o
    WHERE o.created_at BETWEEN ? AND ?
    GROUP BY time_bucket, label, month_name
    ORDER BY time_bucket
  `

  const [rows] = await pool.query(query, [startDate, endDate])

  return rows.map(row => ({
    time: row.time_bucket,
    label: row.label,
    monthName: row.month_name,
    revenue: parseFloat(row.revenue) || 0,
    orders: parseInt(row.order_count) || 0
  }))
}

/**
 * ===================================
 * PHASE 4: TOP DISHES & ORDER STATUS
 * ===================================
 */

/**
 * Lấy TOP N món bán chạy nhất trong khoảng thời gian
 * @param {Object} params - { startDate, endDate, limit }
 * @returns {Array} Top dishes với thông tin bán hàng
 */
export async function getTopDishes({ startDate, endDate, limit = 5 }) {
  const query = `
    SELECT 
      mi.id,
      mi.name,
      mi.image_url,
      mi.price as base_price,
      COUNT(DISTINCT oi.order_id) as order_count,
      SUM(oi.quantity) as total_sold,
      SUM(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
      AND o.status != 'CANCELLED'
      -- AND mi.deleted_at IS NULL
    GROUP BY mi.id, mi.name, mi.image_url, mi.price
    ORDER BY total_sold DESC
    LIMIT ?
  `

  const [dishes] = await pool.query(query, [startDate, endDate, limit])

  // TODO Phase 7: Có thể tính trend so với kỳ trước nếu cần
  // const previousDishes = await getTopDishes({ 
  //   startDate: prevStart, 
  //   endDate: prevEnd, 
  //   limit 
  // })

  return dishes.map(dish => ({
    id: dish.id,
    name: dish.name,
    image: dish.image_url || '🍽️', // Fallback emoji nếu không có image
    sold: parseInt(dish.total_sold) || 0,
    revenue: parseFloat(dish.total_revenue) || 0,
    orderCount: parseInt(dish.order_count) || 0,
    basePrice: parseFloat(dish.base_price) || 0
  }))
}

/**
 * Lấy phân bố trạng thái đơn hàng trong khoảng thời gian
 * @param {Object} params - { startDate, endDate }
 * @returns {Array} Status distribution với count và label tiếng Việt
 */
export async function getOrderStatusDistribution({ startDate, endDate }) {
  const query = `
    SELECT 
      o.status,
      COUNT(*) as count
    FROM orders o
    WHERE o.created_at BETWEEN ? AND ?
    GROUP BY o.status
    ORDER BY count DESC
  `

  const [statuses] = await pool.query(query, [startDate, endDate])

  // Map status sang tiếng Việt và màu sắc
  // Theo yêu cầu: Chờ xác nhận (NEW), Đang phục vụ (IN_PROGRESS), Hoàn thành (PAID), Đã hủy (CANCELLED)
  const statusMap = {
    NEW: { name: 'Chờ xác nhận', color: '#1890ff' },
    IN_PROGRESS: { name: 'Đang phục vụ', color: '#faad14' },
    PAID: { name: 'Hoàn thành', color: '#52c41a' },
    CANCELLED: { name: 'Đã hủy', color: '#ff4d4f' }
  }

  // Tạo object để map count từ DB
  const statusCount = {}
  statuses.forEach(s => {
    statusCount[s.status] = parseInt(s.count) || 0
  })

  // Luôn trả về đầy đủ 4 status (count = 0 nếu không có dữ liệu)
  return Object.keys(statusMap).map(status => ({
    status,
    name: statusMap[status].name,
    value: statusCount[status] || 0,
    color: statusMap[status].color
  }))
}

/**
 * Lấy trạng thái bàn real-time
 * @returns {Array} Table status distribution với count cho mỗi trạng thái
 */
export async function getTableStatus() {
  const query = `
    SELECT 
      t.id,
      t.table_number,
      CASE 
        WHEN qs.id IS NOT NULL AND qs.status = 'ACTIVE' THEN 'occupied'
        ELSE 'available'
      END as status
    FROM tables t
    LEFT JOIN qr_sessions qs ON qs.table_id = t.id 
      AND qs.status = 'ACTIVE'
    WHERE t.is_active = TRUE AND t.deleted_at IS NULL
    ORDER BY t.table_number
  `

  const [tables] = await pool.query(query)

  // Group by status và đếm số lượng - Chỉ 2 trạng thái: Đang sử dụng & Trống
  const statusCount = {
    occupied: 0,
    available: 0
  }

  tables.forEach(t => {
    statusCount[t.status]++
  })

  // Return array với 2 trạng thái: Đang sử dụng & Trống
  return [
    { status: 'occupied', count: statusCount.occupied, label: 'Đang sử dụng', color: '#52c41a' },
    { status: 'available', count: statusCount.available, label: 'Trống', color: '#d9d9d9' }
  ]
}

/**
 * Lấy danh sách đơn hàng gần đây (24h gần nhất)
 * @param {Object} params - { limit }
 * @returns {Array} Recent orders với thông tin table, time, amount, status
 */
export async function getRecentOrders({ limit = 5 }) {
  const query = `
    SELECT 
      o.id,
      t.table_number,
      o.created_at,
      o.total_price,
      o.status,
      COUNT(oi.id) as item_count
    FROM orders o
    JOIN qr_sessions qs ON qs.id = o.qr_session_id
    JOIN tables t ON t.id = qs.table_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY o.id, t.table_number, o.created_at, o.total_price, o.status
    ORDER BY o.created_at DESC
    LIMIT ?
  `

  const [orders] = await pool.query(query, [limit])

  // Format data cho frontend
  return orders.map(o => ({
    id: `#ORD-${o.id}`,
    table: o.table_number,
    time: new Date(o.created_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    amount: parseFloat(o.total_price) || 0,
    status: o.status,
    items: parseInt(o.item_count) || 0
  }))
}

/**
 * Lấy performance metrics - 3 chỉ số hiệu suất
 * @param {Object} params - { startDate, endDate }
 * @returns {Object} Performance metrics: completionRate, avgServiceTime, occupancyRate
 */
export async function getPerformanceMetrics({ startDate, endDate }) {
  // 1. Completion Rate - Tỷ lệ hoàn thành đơn hàng
  const completionQuery = `
    SELECT 
      COUNT(CASE WHEN status IN ('PAID') THEN 1 END) as completed_orders,
      COUNT(*) as total_orders
    FROM orders
    WHERE created_at BETWEEN ? AND ?
      AND status != 'CANCELLED'
  `
  const [completionData] = await pool.query(completionQuery, [startDate, endDate])

  const totalOrders = parseInt(completionData[0].total_orders) || 0
  const completedOrders = parseInt(completionData[0].completed_orders) || 0
  const completionRate = totalOrders > 0
    ? parseFloat(((completedOrders / totalOrders) * 100).toFixed(1))
    : 0

  // 2. Average Service Time - Thời gian phục vụ trung bình (từ tạo order đến thanh toán)
  const serviceTimeQuery = `
    SELECT 
      AVG(TIMESTAMPDIFF(MINUTE, o.created_at, p.paid_at)) as avg_minutes
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    WHERE o.created_at BETWEEN ? AND ?
      AND p.payment_status = 'PAID'
      AND p.paid_at IS NOT NULL
  `
  const [serviceTimeData] = await pool.query(serviceTimeQuery, [startDate, endDate])

  const avgServiceTime = Math.round(parseFloat(serviceTimeData[0].avg_minutes) || 0)

  // 3. Table Occupancy Rate - Tỷ lệ lấp đầy bàn trong khoảng thời gian
  const occupancyQuery = `
    SELECT 
      COUNT(DISTINCT t.id) as total_tables,
      COUNT(DISTINCT CASE 
        WHEN qs.status IN ('ACTIVE', 'COMPLETED') THEN qs.table_id 
      END) as occupied_sessions
    FROM tables t
    LEFT JOIN qr_sessions qs ON qs.table_id = t.id 
      AND qs.created_at BETWEEN ? AND ?
    WHERE t.is_active = TRUE AND t.deleted_at IS NULL
  `
  const [occupancyData] = await pool.query(occupancyQuery, [startDate, endDate])

  const totalTables = parseInt(occupancyData[0].total_tables) || 0
  const occupiedSessions = parseInt(occupancyData[0].occupied_sessions) || 0
  const occupancyRate = totalTables > 0
    ? parseFloat(((occupiedSessions / totalTables) * 100).toFixed(1))
    : 0

  return {
    completionRate,       // Tỷ lệ % đơn hàng hoàn thành
    avgServiceTime,       // Thời gian trung bình (phút)
    occupancyRate,        // Tỷ lệ % lấp đầy bàn
    // Metadata cho frontend tính growth
    metadata: {
      totalOrders,
      completedOrders,
      totalTables,
      occupiedSessions
    }
  }
}
