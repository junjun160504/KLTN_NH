import { pool } from '../config/db.js'

/**
 * Get loyalty program trend data
 * Returns registrations, points issued, and participation rate by date
 */
export const getLoyaltyTrend = async (startDate, endDate) => {
  try {
    // Query chính: Lấy các session có customer_id và đã thanh toán
    const query = `
      SELECT 
        DATE(p.paid_at) as date,
        COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN qs.id END) as registrations,
        COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN c.points ELSE 0 END), 0) as points_issued
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN qr_sessions qs ON o.qr_session_id = qs.id
      LEFT JOIN customers c ON qs.customer_id = c.id
      WHERE DATE(p.paid_at) BETWEEN ? AND ?
        AND p.payment_status = 'PAID'
      GROUP BY DATE(p.paid_at)
      ORDER BY date ASC
    `

    // Query phụ: Đếm tổng số sessions (có order và đã thanh toán) để tính tỷ lệ
    const totalSessionsQuery = `
      SELECT 
        DATE(p.paid_at) as date,
        COUNT(DISTINCT qs.id) as total_sessions
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN qr_sessions qs ON o.qr_session_id = qs.id
      WHERE DATE(p.paid_at) BETWEEN ? AND ?
        AND p.payment_status = 'PAID'
      GROUP BY DATE(p.paid_at)
    `

    const [rows] = await pool.query(query, [startDate, endDate])
    const [totalSessionsRows] = await pool.query(totalSessionsQuery, [startDate, endDate])

    // Map total_sessions vào rows theo date
    const totalSessionsMap = {}
    totalSessionsRows.forEach(row => {
      totalSessionsMap[row.date] = parseInt(row.total_sessions || 0)
    })

    // Calculate participation rate for each day
    const trendData = rows.map(row => {
      const totalSessions = totalSessionsMap[row.date] || 0
      const registrations = parseInt(row.registrations) || 0

      return {
        date: row.date,
        registrations: registrations,
        pointsIssued: parseInt(row.points_issued) || 0,
        orders: totalSessions,
        participationRate: totalSessions > 0
          ? ((registrations / totalSessions) * 100).toFixed(1)
          : 0
      }
    })

    // Calculate summary metrics with growth comparison
    const currentPeriodDays = rows.length
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - currentPeriodDays)
    const previousEndDate = new Date(startDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)

    const [previousRows] = await pool.query(query, [
      previousStartDate.toISOString().split('T')[0],
      previousEndDate.toISOString().split('T')[0]
    ])

    const [previousTotalSessionsRows] = await pool.query(totalSessionsQuery, [
      previousStartDate.toISOString().split('T')[0],
      previousEndDate.toISOString().split('T')[0]
    ])

    const currentTotal = {
      registrations: rows.reduce((sum, r) => sum + parseInt(r.registrations || 0), 0),
      pointsIssued: rows.reduce((sum, r) => sum + parseInt(r.points_issued || 0), 0),
      orders: Object.values(totalSessionsMap).reduce((sum, val) => sum + val, 0)
    }

    const previousTotal = {
      registrations: previousRows.reduce((sum, r) => sum + parseInt(r.registrations || 0), 0),
      pointsIssued: previousRows.reduce((sum, r) => sum + parseInt(r.points_issued || 0), 0),
      orders: previousTotalSessionsRows.reduce((sum, r) => sum + parseInt(r.total_sessions || 0), 0)
    }

    const growth = {
      registrations: previousTotal.registrations > 0
        ? (((currentTotal.registrations - previousTotal.registrations) / previousTotal.registrations) * 100).toFixed(1)
        : 0,
      pointsIssued: previousTotal.pointsIssued > 0
        ? (((currentTotal.pointsIssued - previousTotal.pointsIssued) / previousTotal.pointsIssued) * 100).toFixed(1)
        : 0,
      participationRate: previousTotal.orders > 0
        ? (((currentTotal.registrations / currentTotal.orders) - (previousTotal.registrations / previousTotal.orders)) * 100).toFixed(1)
        : 0
    }

    return {
      success: true,
      data: {
        trend: trendData,
        summary: {
          totalRegistrations: currentTotal.registrations,
          totalPointsIssued: currentTotal.pointsIssued,
          totalOrders: currentTotal.orders,
          participationRate: currentTotal.orders > 0
            ? ((currentTotal.registrations / currentTotal.orders) * 100).toFixed(1)
            : 0,
          avgPointsPerCustomer: currentTotal.registrations > 0
            ? Math.round(currentTotal.pointsIssued / currentTotal.registrations)
            : 0,
          growth
        }
      }
    }
  } catch (error) {
    console.error('Error in getLoyaltyTrend:', error)
    throw error
  }
}

/**
 * Get top customers by loyalty points
 * Chỉ tính visits và điểm tích lũy trong khoảng thời gian được chọn
 */
export const getTopCustomers = async (limit = 10, startDate = null, endDate = null) => {
  try {
    let query
    let params

    if (startDate && endDate) {
      // Lọc theo khoảng thời gian: tính điểm tích được trong khoảng thời gian đó
      query = `
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.points as total_points,
          COUNT(DISTINCT CASE 
            WHEN p.payment_status = 'PAID' AND DATE(p.paid_at) BETWEEN ? AND ? THEN qs.id 
          END) as visits,
          COALESCE(SUM(CASE 
            WHEN p.payment_status = 'PAID' AND DATE(p.paid_at) BETWEEN ? AND ? 
            THEN FLOOR(p.amount / 10000) 
            ELSE 0 
          END), 0) as points_in_period,
          MAX(CASE 
            WHEN p.payment_status = 'PAID' AND DATE(p.paid_at) BETWEEN ? AND ? THEN p.paid_at 
          END) as last_visit
        FROM customers c
        INNER JOIN qr_sessions qs ON c.id = qs.customer_id
        INNER JOIN orders o ON qs.id = o.qr_session_id
        INNER JOIN payments p ON o.id = p.order_id
        WHERE p.payment_status = 'PAID'
          AND DATE(p.paid_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name, c.phone, c.points
        HAVING visits > 0
        ORDER BY points_in_period DESC
        LIMIT ?
      `
      params = [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, limit]
    } else {
      // Không lọc thời gian: lấy theo tổng điểm
      query = `
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.points,
          c.points as points_in_period,
          COUNT(DISTINCT CASE 
            WHEN p.payment_status = 'PAID' THEN qs.id 
          END) as visits,
          MAX(CASE 
            WHEN p.payment_status = 'PAID' THEN p.paid_at 
          END) as last_visit
        FROM customers c
        LEFT JOIN qr_sessions qs ON c.id = qs.customer_id
        LEFT JOIN orders o ON qs.id = o.qr_session_id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE c.points > 0
        GROUP BY c.id, c.name, c.phone, c.points
        ORDER BY c.points DESC
        LIMIT ?
      `
      params = [limit]
    }

    const [rows] = await pool.query(query, params)

    const customers = rows.map(row => ({
      id: row.id,
      name: row.name || 'Khách hàng ẩn danh',
      phone: row.phone,
      points: parseInt(row.points_in_period || row.points || 0),
      totalPoints: parseInt(row.total_points || row.points || 0),
      visits: parseInt(row.visits || 0),
      lastVisit: row.last_visit
    }))

    return {
      success: true,
      data: customers
    }
  } catch (error) {
    console.error('Error in getTopCustomers:', error)
    throw error
  }
}

/**
 * Get point distribution by ranges
 */
export const getPointDistribution = async () => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN points BETWEEN 0 AND 500 THEN '0-500'
          WHEN points BETWEEN 501 AND 1000 THEN '501-1000'
          WHEN points BETWEEN 1001 AND 2000 THEN '1001-2000'
          WHEN points BETWEEN 2001 AND 3000 THEN '2001-3000'
          ELSE '3000+'
        END as point_range,
        COUNT(*) as customer_count
      FROM customers
      WHERE points > 0
      GROUP BY point_range
      ORDER BY 
        CASE point_range
          WHEN '0-500' THEN 1
          WHEN '501-1000' THEN 2
          WHEN '1001-2000' THEN 3
          WHEN '2001-3000' THEN 4
          WHEN '3000+' THEN 5
        END
    `

    const [rows] = await pool.query(query)

    // Calculate percentages
    const totalCustomers = rows.reduce((sum, row) => sum + parseInt(row.customer_count || 0), 0)

    const distribution = rows.map(row => ({
      range: row.point_range,
      count: parseInt(row.customer_count || 0),
      percentage: totalCustomers > 0
        ? ((parseInt(row.customer_count || 0) / totalCustomers) * 100).toFixed(1)
        : 0
    }))

    // Ensure all ranges are present (even if 0)
    const allRanges = ['0-500', '501-1000', '1001-2000', '2001-3000', '3000+']
    const completeDistribution = allRanges.map(range => {
      const existing = distribution.find(d => d.range === range)
      return existing || { range, count: 0, percentage: 0 }
    })

    return {
      success: true,
      data: completeDistribution
    }
  } catch (error) {
    console.error('Error in getPointDistribution:', error)
    throw error
  }
}

const getSmartRoundTo = (max) => {
  if (max <= 200) return 5;
  if (max <= 500) return 10;
  if (max <= 1000) return 50;
}



export const getPointDistributionV2 = async (startDate = null, endDate = null) => {
  try {
    let maxPointsQuery, customerPointsQuery

    if (startDate && endDate) {
      // Tính điểm tích lũy trong khoảng thời gian từ payments
      // Điểm = FLOOR(amount / 10000)
      maxPointsQuery = `
        SELECT MAX(period_points) as max_points
        FROM (
          SELECT 
            c.id,
            COALESCE(SUM(FLOOR(p.amount / 10000)), 0) as period_points
          FROM customers c
          INNER JOIN qr_sessions qs ON c.id = qs.customer_id
          INNER JOIN orders o ON qs.id = o.qr_session_id
          INNER JOIN payments p ON o.id = p.order_id
          WHERE p.payment_status = 'PAID'
            AND DATE(p.paid_at) BETWEEN ? AND ?
          GROUP BY c.id
          HAVING period_points > 0
        ) as customer_points
      `

      const [maxPointsResult] = await pool.query(maxPointsQuery, [startDate, endDate])
      const maxPoints = parseInt(maxPointsResult[0]?.max_points || 0)

      if (maxPoints === 0) {
        return {
          success: true,
          data: [],
          metadata: { maxPoints: 0, totalCustomers: 0 }
        }
      }

      const roundTo = getSmartRoundTo(maxPoints) || 10
      const nice = (x) => Math.round(x / roundTo) * roundTo

      // Tính mốc dựa trên %
      const marks = [
        0,
        nice(maxPoints * 0.2),
        nice(maxPoints * 0.4),
        nice(maxPoints * 0.6),
        nice(maxPoints * 0.8),
        nice(maxPoints)
      ]

      // Tạo các range từ marks
      const ranges = []
      for (let i = 0; i < marks.length - 1; i++) {
        if (i === marks.length - 2) {
          ranges.push({
            label: `${marks[i]}+`,
            start: marks[i],
            end: null
          })
        } else {
          ranges.push({
            label: `${marks[i]} - ${marks[i + 1]}`,
            start: marks[i],
            end: marks[i + 1] - 1
          })
        }
      }

      // Tạo case sql
      const caseClauses = []
      const orderClauses = []
      ranges.forEach((range, index) => {
        if (range.end === null) {
          caseClauses.push(`WHEN period_points >= ${range.start} THEN '${range.label}'`)
          orderClauses.push(`WHEN '${range.label}' THEN ${index + 1}`)
        } else {
          caseClauses.push(`WHEN period_points BETWEEN ${range.start} AND ${range.end} THEN '${range.label}'`)
          orderClauses.push(`WHEN '${range.label}' THEN ${index + 1}`)
        }
      })

      // Query với filter thời gian
      customerPointsQuery = `
        SELECT 
          CASE
            ${caseClauses.join('\n            ')}
          END as point_range,
          COUNT(*) AS customer_count
        FROM (
          SELECT 
            c.id,
            COALESCE(SUM(FLOOR(p.amount / 10000)), 0) as period_points
          FROM customers c
          INNER JOIN qr_sessions qs ON c.id = qs.customer_id
          INNER JOIN orders o ON qs.id = o.qr_session_id
          INNER JOIN payments p ON o.id = p.order_id
          WHERE p.payment_status = 'PAID'
            AND DATE(p.paid_at) BETWEEN ? AND ?
          GROUP BY c.id
          HAVING period_points > 0
        ) as customer_points
        GROUP BY point_range
        ORDER BY
          CASE point_range
            ${orderClauses.join('\n            ')}
          END
      `

      const [rows] = await pool.query(customerPointsQuery, [startDate, endDate])

      const totalCustomers = rows.reduce((sum, row) => sum + parseInt(row.customer_count || 0), 0)

      const distribution = rows.map(row => ({
        range: row.point_range,
        count: parseInt(row.customer_count || 0),
        percentage: totalCustomers > 0
          ? ((parseInt(row.customer_count || 0) / totalCustomers) * 100).toFixed(1)
          : 0
      }))

      return {
        success: true,
        data: distribution,
        metadata: {
          maxPoints,
          roundTo,
          marks,
          totalCustomers
        }
      }
    } else {
      // Không filter thời gian - sử dụng tổng điểm từ bảng customers
      const [maxPointsResult] = await pool.query(`SELECT MAX(points) as max_points FROM customers WHERE points > 0`)
      const maxPoints = parseInt(maxPointsResult[0].max_points || 0)

      if (maxPoints === 0) {
        return {
          success: true,
          data: []
        }
      }

      const roundTo = getSmartRoundTo(maxPoints) || 10
      const nice = (x) => Math.round(x / roundTo) * roundTo

      const marks = [
        0,
        nice(maxPoints * 0.2),
        nice(maxPoints * 0.4),
        nice(maxPoints * 0.6),
        nice(maxPoints * 0.8),
        nice(maxPoints)
      ]

      const ranges = []
      for (let i = 0; i < marks.length - 1; i++) {
        if (i === marks.length - 2) {
          ranges.push({
            label: `${marks[i]}+`,
            start: marks[i],
            end: null
          })
        } else {
          ranges.push({
            label: `${marks[i]} - ${marks[i + 1]}`,
            start: marks[i],
            end: marks[i + 1] - 1
          })
        }
      }

      const caseClauses = []
      const orderClauses = []
      ranges.forEach((range, index) => {
        if (range.end === null) {
          caseClauses.push(`WHEN points >= ${range.start} THEN '${range.label}'`)
          orderClauses.push(`WHEN '${range.label}' THEN ${index + 1}`)
        } else {
          caseClauses.push(`WHEN points BETWEEN ${range.start} AND ${range.end} THEN '${range.label}'`)
          orderClauses.push(`WHEN '${range.label}' THEN ${index + 1}`)
        }
      })

      const query = `
        SELECT 
          CASE
            ${caseClauses.join('\n          ')}
          END as point_range,
          COUNT(*) AS customer_count
        FROM customers
        WHERE points > 0
        GROUP BY point_range
        ORDER BY
          CASE point_range
            ${orderClauses.join('\n          ')}
          END
      `
      const [rows] = await pool.query(query)

      const totalCustomers = rows.reduce((sum, row) => sum + parseInt(row.customer_count || 0), 0)

      const distribution = rows.map(row => ({
        range: row.point_range,
        count: parseInt(row.customer_count || 0),
        percentage: totalCustomers > 0
          ? ((parseInt(row.customer_count || 0) / totalCustomers) * 100).toFixed(1)
          : 0
      }))

      return {
        success: true,
        data: distribution,
        metadata: {
          maxPoints,
          roundTo,
          marks,
          totalCustomers
        }
      }
    }
  } catch (error) {
    throw new Error('found error in getPointDistributionV2 service: ' + error.message)
  }
}
