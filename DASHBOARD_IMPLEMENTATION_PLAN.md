# 📊 DASHBOARD IMPLEMENTATION PLAN

## 🎯 Tổng quan dự án
Xây dựng Dashboard Analytics hoàn chỉnh cho hệ thống quản lý nhà hàng với real-time data từ database.

**Timeline:** 18-20 giờ  
**Phases:** 7 phases  
**Status:** Phase 1 & 2 ✅ Completed

---

## ✅ PHASE 1: SETUP CƠ BẢN & BỘ LỌC THỜI GIAN (0.5h) - COMPLETED

### Mục tiêu:
- Setup state management
- Integrate CustomDateRangePicker
- Thêm nút Refresh

### Công việc đã hoàn thành:
- [x] Import CustomDateRangePicker component
- [x] Import dayjs và các dependencies
- [x] Setup date range state với default value (Today)
- [x] Setup loading states (loading, statsLoading, revenueLoading)
- [x] Thay thế Segmented component bằng CustomDateRangePicker
- [x] Thêm nút "Làm mới" với RefreshCw icon
- [x] Layout responsive với Tailwind CSS
- [x] MetricCard component với Tailwind (thay thế 350 dòng code)
- [x] Fix lỗi preset "Tất cả" và nút "Áp dụng"

### Kết quả:
- ✅ Code giảm 21% (từ 1,288 → 1,013 dòng)
- ✅ DateRangePicker hoạt động với presets
- ✅ UI gọn gàng với Tailwind CSS

---

## ✅ PHASE 2: KEY METRICS API + FRONTEND (3h) - COMPLETED

### Mục tiêu:
Hiển thị 4 chỉ số chính với dữ liệu thật từ database và tính growth rate.

### Backend Implementation:

#### 1. Dashboard Service ✅
**File:** `backend/src/services/dashboard.service.js`

**Functions:**
- [x] `getKeyMetrics({ startDate, endDate })` - Main function
- [x] `getStatsForPeriod(startDate, endDate)` - Query stats
- [x] `calculateGrowth(current, previous)` - Tính % tăng trưởng

**Business Logic:**
```sql
-- Số đơn hàng = COUNT DISTINCT qr_sessions
-- Số khách hàng = COUNT DISTINCT qr_sessions
-- Doanh thu = SUM payments (status = PAID)
-- Trung bình/đơn = Revenue / Paid sessions
```

**SQL Query:**
```sql
SELECT 
  COUNT(DISTINCT qs.id) as total_sessions,
  COALESCE(SUM(p.amount), 0) as total_revenue,
  COUNT(DISTINCT CASE WHEN p.payment_status = 'PAID' THEN qs.id END) as paid_sessions
FROM qr_sessions qs
LEFT JOIN orders o ON o.qr_session_id = qs.id
LEFT JOIN payments p ON p.order_id = o.id AND p.payment_status = 'PAID'
WHERE qs.created_at BETWEEN ? AND ?
  AND qs.status IN ('ACTIVE', 'COMPLETED')
```

#### 2. Dashboard Controller ✅
**File:** `backend/src/controllers/dashboard.controller.js`

- [x] Validate query params (startDate, endDate)
- [x] Validate date format
- [x] Error handling với proper HTTP codes

#### 3. Routes ✅
**File:** `backend/src/routes/dashboard.routes.js`

```javascript
GET /api/dashboard/stats?startDate=...&endDate=...
```

#### 4. App Integration ✅
**File:** `backend/src/app.js`

- [x] Import dashboardRoutes
- [x] Register route: `app.use('/api/dashboard', dashboardRoutes)`

### Frontend Implementation:

#### 1. API Service ✅
**File:** `frontend/src/services/dashboardApi.js`

- [x] `getKeyMetrics(startDate, endDate)` function
- [x] Axios integration
- [x] Error handling

#### 2. Homes.js Updates ✅
**File:** `frontend/src/page/management/Main/Homes.js`

- [x] Import dashboardApi
- [x] Add stats state
- [x] Create fetchKeyMetrics() function
- [x] Add useEffect for auto-fetch on dateRange change
- [x] Update refresh button onClick
- [x] Wrap MetricCards with Spin component
- [x] Update MetricCard values từ stats state
- [x] Dynamic trend colors (green/red)
- [x] Dynamic arrow direction (up/down)

### Kết quả:
- ✅ 4 Metric Cards hiển thị dữ liệu thật
- ✅ Growth rates tự động tính toán
- ✅ Auto-refresh khi thay đổi date range
- ✅ Loading states hoạt động
- ✅ Error handling với message.error

---

## 🚧 PHASE 3: REVENUE CHART WITH SMART GROUPBY (5h) - PENDING

### Mục tiêu:
Biểu đồ doanh thu tự động group by hour/day/week/month dựa trên date range.

### Backend Tasks:

#### 1. Dashboard Service - Revenue Data
**File:** `backend/src/services/dashboard.service.js`

**Function mới:**
```javascript
export async function getRevenueData({ startDate, endDate, groupBy }) {
  // Auto-detect groupBy nếu không được chỉ định
  const autoGroupBy = groupBy || determineGroupBy(startDate, endDate)
  
  // Query dựa theo groupBy
  switch (autoGroupBy) {
    case 'hour': return getRevenueByHour(startDate, endDate)
    case 'day': return getRevenueByDay(startDate, endDate)
    case 'week': return getRevenueByWeek(startDate, endDate)
    case 'month': return getRevenueByMonth(startDate, endDate)
  }
}

function determineGroupBy(startDate, endDate) {
  const hours = (endDate - startDate) / (1000 * 60 * 60)
  
  if (hours <= 24) return 'hour'      // 1 ngày -> group by hour
  if (hours <= 168) return 'day'      // 1 tuần -> group by day
  if (hours <= 720) return 'week'     // 1 tháng -> group by week
  return 'month'                       // > 1 tháng -> group by month
}
```

**SQL Queries:**

**A. By Hour:**
```sql
SELECT 
  DATE_FORMAT(p.paid_at, '%Y-%m-%d %H:00:00') as time_bucket,
  HOUR(p.paid_at) as hour,
  COUNT(DISTINCT o.qr_session_id) as order_count,
  COALESCE(SUM(p.amount), 0) as revenue
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.paid_at BETWEEN ? AND ?
  AND p.payment_status = 'PAID'
GROUP BY time_bucket, hour
ORDER BY time_bucket
```

**B. By Day:**
```sql
SELECT 
  DATE(p.paid_at) as time_bucket,
  DAYNAME(p.paid_at) as day_name,
  COUNT(DISTINCT o.qr_session_id) as order_count,
  COALESCE(SUM(p.amount), 0) as revenue
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.paid_at BETWEEN ? AND ?
  AND p.payment_status = 'PAID'
GROUP BY time_bucket, day_name
ORDER BY time_bucket
```

**C. By Week:**
```sql
SELECT 
  YEARWEEK(p.paid_at, 1) as week_number,
  DATE(DATE_SUB(p.paid_at, INTERVAL WEEKDAY(p.paid_at) DAY)) as week_start,
  COUNT(DISTINCT o.qr_session_id) as order_count,
  COALESCE(SUM(p.amount), 0) as revenue
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.paid_at BETWEEN ? AND ?
  AND p.payment_status = 'PAID'
GROUP BY week_number, week_start
ORDER BY week_start
```

**D. By Month:**
```sql
SELECT 
  DATE_FORMAT(p.paid_at, '%Y-%m') as time_bucket,
  MONTHNAME(p.paid_at) as month_name,
  COUNT(DISTINCT o.qr_session_id) as order_count,
  COALESCE(SUM(p.amount), 0) as revenue
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.paid_at BETWEEN ? AND ?
  AND p.payment_status = 'PAID'
GROUP BY time_bucket, month_name
ORDER BY time_bucket
```

#### 2. Dashboard Controller - Revenue Endpoint
**File:** `backend/src/controllers/dashboard.controller.js`

```javascript
export async function getRevenueChart(req, res) {
  try {
    const { startDate, endDate, groupBy } = req.query
    
    // Validation...
    
    const data = await dashboardService.getRevenueData({
      startDate,
      endDate,
      groupBy // optional, auto-detect nếu không có
    })
    
    res.json({
      status: 200,
      data: {
        groupBy: data.groupBy,
        chartData: data.data
      }
    })
  } catch (err) {
    // Error handling...
  }
}
```

#### 3. Routes Update
**File:** `backend/src/routes/dashboard.routes.js`

```javascript
router.get('/revenue', dashboardController.getRevenueChart)
```

### Frontend Tasks:

#### 1. API Service Update
**File:** `frontend/src/services/dashboardApi.js`

```javascript
getRevenueChart: async (startDate, endDate, groupBy) => {
  const response = await axios.get(`${API_URL}/dashboard/revenue`, {
    params: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy // optional
    }
  })
  return response.data
}
```

#### 2. Homes.js Updates
**File:** `frontend/src/page/management/Main/Homes.js`

**States:**
```javascript
const [revenueData, setRevenueData] = useState([])
const [revenueGroupBy, setRevenueGroupBy] = useState('auto')
```

**Fetch Function:**
```javascript
const fetchRevenueData = async () => {
  try {
    setRevenueLoading(true)
    const response = await dashboardApi.getRevenueChart(
      dateRange[0].toDate(),
      dateRange[1].toDate(),
      revenueGroupBy === 'auto' ? undefined : revenueGroupBy
    )
    
    if (response.status === 200) {
      setRevenueData(response.data.chartData)
      setRevenueViewType(response.data.groupBy) // Update UI
    }
  } catch (error) {
    message.error('Không thể tải dữ liệu doanh thu')
  } finally {
    setRevenueLoading(false)
  }
}
```

**Chart Update:**
```javascript
<Spin spinning={revenueLoading}>
  <ResponsiveContainer width="100%" height={340}>
    {revenueChartType === 'area' ? (
      <AreaChart data={revenueData}>
        {/* Chart config... */}
      </AreaChart>
    ) : (
      <BarChart data={revenueData}>
        {/* Chart config... */}
      </BarChart>
    )}
  </ResponsiveContainer>
</Spin>
```

### Checklist:
- [ ] Backend: getRevenueData() function
- [ ] Backend: determineGroupBy() logic
- [ ] Backend: 4 SQL queries (hour/day/week/month)
- [ ] Backend: getRevenueChart controller
- [ ] Backend: Route registration
- [ ] Frontend: getRevenueChart API
- [ ] Frontend: fetchRevenueData function
- [ ] Frontend: Loading state integration
- [ ] Frontend: Chart data binding
- [ ] Test với different date ranges
- [ ] Verify auto-groupBy logic

**Estimated Time:** 5 hours

---

## 🚧 PHASE 4: TOP DISHES & ORDER STATUS (3.5h) - PENDING

### Mục tiêu:
Top 5 món bán chạy và phân bố trạng thái đơn hàng.

### Backend Tasks:

#### 1. Top Dishes Endpoint
**File:** `backend/src/services/dashboard.service.js`

**Function:**
```javascript
export async function getTopDishes({ startDate, endDate, limit = 5 }) {
  const query = `
    SELECT 
      mi.id,
      mi.name,
      mi.image_url,
      COUNT(oi.id) as total_sold,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at BETWEEN ? AND ?
      AND o.status IN ('DONE', 'PAID')
    GROUP BY mi.id, mi.name, mi.image_url
    ORDER BY total_quantity DESC
    LIMIT ?
  `
  
  const [dishes] = await pool.query(query, [startDate, endDate, limit])
  
  // Calculate trend (so sánh với kỳ trước)
  // ...
  
  return dishes
}
```

#### 2. Order Status Distribution
**File:** `backend/src/services/dashboard.service.js`

**Function:**
```javascript
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
  
  // Map status names to Vietnamese
  const statusMap = {
    'NEW': 'Mới',
    'IN_PROGRESS': 'Đang nấu',
    'DONE': 'Đang phục vụ',
    'PAID': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  }
  
  return statuses.map(s => ({
    name: statusMap[s.status] || s.status,
    value: s.count,
    status: s.status
  }))
}
```

#### 3. Controller
**File:** `backend/src/controllers/dashboard.controller.js`

```javascript
export async function getTopDishes(req, res) {
  try {
    const { startDate, endDate, limit } = req.query
    const data = await dashboardService.getTopDishes({
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 5
    })
    res.json({ status: 200, data })
  } catch (err) {
    // Error handling
  }
}

export async function getOrderStatus(req, res) {
  try {
    const { startDate, endDate } = req.query
    const data = await dashboardService.getOrderStatusDistribution({
      startDate,
      endDate
    })
    res.json({ status: 200, data })
  } catch (err) {
    // Error handling
  }
}
```

#### 4. Routes
```javascript
router.get('/top-dishes', dashboardController.getTopDishes)
router.get('/order-status', dashboardController.getOrderStatus)
```

### Frontend Tasks:

#### 1. API Service
```javascript
getTopDishes: async (startDate, endDate, limit = 5) => {
  const response = await axios.get(`${API_URL}/dashboard/top-dishes`, {
    params: { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      limit 
    }
  })
  return response.data
},

getOrderStatus: async (startDate, endDate) => {
  const response = await axios.get(`${API_URL}/dashboard/order-status`, {
    params: { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    }
  })
  return response.data
}
```

#### 2. Homes.js Updates
```javascript
const [topDishes, setTopDishes] = useState([])
const [orderStatusData, setOrderStatusData] = useState([])

const fetchTopDishes = async () => {
  try {
    const response = await dashboardApi.getTopDishes(
      dateRange[0].toDate(),
      dateRange[1].toDate()
    )
    if (response.status === 200) {
      setTopDishes(response.data)
    }
  } catch (error) {
    message.error('Không thể tải món bán chạy')
  }
}

const fetchOrderStatus = async () => {
  try {
    const response = await dashboardApi.getOrderStatus(
      dateRange[0].toDate(),
      dateRange[1].toDate()
    )
    if (response.status === 200) {
      setOrderStatusData(response.data)
    }
  } catch (error) {
    message.error('Không thể tải trạng thái đơn hàng')
  }
}
```

#### 3. UI Updates
- Bind topDishes data to Top Dishes list
- Bind orderStatusData to PieChart
- Add loading states

### Checklist:
- [ ] Backend: getTopDishes() function
- [ ] Backend: getOrderStatusDistribution() function
- [ ] Backend: Controllers
- [ ] Backend: Routes
- [ ] Frontend: API functions
- [ ] Frontend: Fetch functions
- [ ] Frontend: State management
- [ ] Frontend: UI data binding
- [ ] Test with real data

**Estimated Time:** 3.5 hours

---

## 🚧 PHASE 5: TABLE STATUS & RECENT ORDERS (2h) - PENDING

### Mục tiêu:
Real-time table status và danh sách đơn hàng gần đây.

### Backend Tasks:

#### 1. Table Status (Real-time)
**File:** `backend/src/services/dashboard.service.js`

```javascript
export async function getTableStatus() {
  const query = `
    SELECT 
      t.id,
      t.table_number,
      CASE 
        WHEN qs.id IS NOT NULL AND qs.status = 'ACTIVE' THEN 'occupied'
        WHEN qs.id IS NOT NULL AND qs.status = 'COMPLETED' THEN 'cleaning'
        ELSE 'available'
      END as status
    FROM tables t
    LEFT JOIN qr_sessions qs ON qs.table_id = t.id 
      AND qs.status IN ('ACTIVE', 'COMPLETED')
      AND (qs.expired_at IS NULL OR qs.expired_at > NOW())
    WHERE t.is_active = TRUE
  `
  
  const [tables] = await pool.query(query)
  
  // Group by status
  const statusCount = {
    occupied: 0,
    available: 0,
    cleaning: 0,
    reserved: 0
  }
  
  tables.forEach(t => {
    statusCount[t.status]++
  })
  
  return [
    { status: 'occupied', count: statusCount.occupied, label: 'Đang sử dụng', color: '#52c41a' },
    { status: 'reserved', count: statusCount.reserved, label: 'Đã đặt trước', color: '#1890ff' },
    { status: 'available', count: statusCount.available, label: 'Còn trống', color: '#d9d9d9' },
    { status: 'cleaning', count: statusCount.cleaning, label: 'Đang dọn', color: '#faad14' }
  ]
}
```

#### 2. Recent Orders
**File:** `backend/src/services/dashboard.service.js`

```javascript
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
  
  return orders.map(o => ({
    id: `#ORD-${o.id}`,
    table: t.table_number,
    time: dayjs(o.created_at).format('HH:mm'),
    amount: o.total_price,
    status: o.status,
    items: o.item_count
  }))
}
```

#### 3. Controller & Routes
```javascript
// Controller
export async function getTableStatus(req, res) {
  try {
    const data = await dashboardService.getTableStatus()
    res.json({ status: 200, data })
  } catch (err) {
    // Error handling
  }
}

export async function getRecentOrders(req, res) {
  try {
    const { limit } = req.query
    const data = await dashboardService.getRecentOrders({
      limit: limit ? parseInt(limit) : 5
    })
    res.json({ status: 200, data })
  } catch (err) {
    // Error handling
  }
}

// Routes
router.get('/table-status', dashboardController.getTableStatus)
router.get('/recent-orders', dashboardController.getRecentOrders)
```

### Frontend Tasks:

#### 1. API Service
```javascript
getTableStatus: async () => {
  const response = await axios.get(`${API_URL}/dashboard/table-status`)
  return response.data
},

getRecentOrders: async (limit = 5) => {
  const response = await axios.get(`${API_URL}/dashboard/recent-orders`, {
    params: { limit }
  })
  return response.data
}
```

#### 2. Homes.js Updates
```javascript
const [tableStatus, setTableStatus] = useState([])
const [recentOrders, setRecentOrders] = useState([])

const fetchTableStatus = async () => {
  try {
    const response = await dashboardApi.getTableStatus()
    if (response.status === 200) {
      setTableStatus(response.data)
    }
  } catch (error) {
    message.error('Không thể tải trạng thái bàn')
  }
}

const fetchRecentOrders = async () => {
  try {
    const response = await dashboardApi.getRecentOrders()
    if (response.status === 200) {
      setRecentOrders(response.data)
    }
  } catch (error) {
    message.error('Không thể tải đơn hàng gần đây')
  }
}

// Auto-refresh every 30 seconds for real-time data
useEffect(() => {
  fetchTableStatus()
  fetchRecentOrders()
  
  const interval = setInterval(() => {
    fetchTableStatus()
    fetchRecentOrders()
  }, 30000) // 30 seconds
  
  return () => clearInterval(interval)
}, []) // Không depend vào dateRange vì là real-time
```

#### 3. UI Updates
- Bind tableStatus to status cards
- Bind recentOrders to Table component
- Add auto-refresh indicator

### Checklist:
- [ ] Backend: getTableStatus() function
- [ ] Backend: getRecentOrders() function
- [ ] Backend: Controllers & Routes
- [ ] Frontend: API functions
- [ ] Frontend: Fetch functions
- [ ] Frontend: Auto-refresh logic
- [ ] Frontend: UI data binding
- [ ] Test real-time updates

**Estimated Time:** 2 hours

---

## 🚧 PHASE 6: PERFORMANCE METRICS (2h) - PENDING

### Mục tiêu:
3 chỉ số hiệu suất: Completion Rate, Service Time, Table Occupancy.

### Backend Tasks:

#### 1. Performance Metrics Service
**File:** `backend/src/services/dashboard.service.js`

```javascript
export async function getPerformanceMetrics({ startDate, endDate }) {
  // 1. Completion Rate
  const [completionData] = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status IN ('DONE', 'PAID') THEN 1 END) as completed_orders,
      COUNT(*) as total_orders
    FROM orders
    WHERE created_at BETWEEN ? AND ?
      AND status != 'CANCELLED'
  `, [startDate, endDate])
  
  const completionRate = (completionData[0].completed_orders / completionData[0].total_orders * 100) || 0
  
  // 2. Average Service Time
  const [serviceTimeData] = await pool.query(`
    SELECT 
      AVG(TIMESTAMPDIFF(MINUTE, o.created_at, p.paid_at)) as avg_minutes
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    WHERE o.created_at BETWEEN ? AND ?
      AND p.payment_status = 'PAID'
  `, [startDate, endDate])
  
  const avgServiceTime = Math.round(serviceTimeData[0].avg_minutes) || 0
  
  // 3. Table Occupancy Rate
  const [occupancyData] = await pool.query(`
    SELECT 
      COUNT(DISTINCT t.id) as total_tables,
      COUNT(DISTINCT CASE 
        WHEN qs.status = 'ACTIVE' THEN t.id 
      END) as occupied_tables
    FROM tables t
    LEFT JOIN qr_sessions qs ON qs.table_id = t.id 
      AND qs.created_at BETWEEN ? AND ?
      AND qs.status = 'ACTIVE'
    WHERE t.is_active = TRUE
  `, [startDate, endDate])
  
  const occupancyRate = (occupancyData[0].occupied_tables / occupancyData[0].total_tables * 100) || 0
  
  return {
    completionRate: parseFloat(completionRate.toFixed(1)),
    avgServiceTime,
    occupancyRate: parseFloat(occupancyRate.toFixed(1))
  }
}
```

#### 2. Controller & Routes
```javascript
export async function getPerformance(req, res) {
  try {
    const { startDate, endDate } = req.query
    const data = await dashboardService.getPerformanceMetrics({
      startDate,
      endDate
    })
    res.json({ status: 200, data })
  } catch (err) {
    // Error handling
  }
}

// Route
router.get('/performance', dashboardController.getPerformance)
```

### Frontend Tasks:

#### 1. API Service
```javascript
getPerformance: async (startDate, endDate) => {
  const response = await axios.get(`${API_URL}/dashboard/performance`, {
    params: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  })
  return response.data
}
```

#### 2. Homes.js Updates
```javascript
const [performanceMetrics, setPerformanceMetrics] = useState({
  completionRate: 0,
  avgServiceTime: 0,
  occupancyRate: 0
})

const fetchPerformance = async () => {
  try {
    const response = await dashboardApi.getPerformance(
      dateRange[0].toDate(),
      dateRange[1].toDate()
    )
    if (response.status === 200) {
      setPerformanceMetrics(response.data)
    }
  } catch (error) {
    message.error('Không thể tải dữ liệu hiệu suất')
  }
}
```

#### 3. UI Updates
- Update 3 performance cards với real data
- Add loading states
- Update Progress components

### Checklist:
- [ ] Backend: getPerformanceMetrics() function
- [ ] Backend: 3 SQL queries
- [ ] Backend: Controller & Route
- [ ] Frontend: API function
- [ ] Frontend: Fetch function
- [ ] Frontend: UI data binding
- [ ] Test calculations

**Estimated Time:** 2 hours

---

## 🚧 PHASE 7: OPTIMIZATION & POLISH (2.5h) - PENDING

### Mục tiêu:
Tối ưu hóa performance, user experience và stability.

### Tasks:

#### 1. Backend Optimization (1h)

**A. Parallel Data Fetching**
```javascript
export async function getDashboardData({ startDate, endDate }) {
  const [
    keyMetrics,
    revenueData,
    topDishes,
    orderStatus,
    tableStatus,
    recentOrders,
    performance
  ] = await Promise.all([
    getKeyMetrics({ startDate, endDate }),
    getRevenueData({ startDate, endDate }),
    getTopDishes({ startDate, endDate }),
    getOrderStatusDistribution({ startDate, endDate }),
    getTableStatus(),
    getRecentOrders({ limit: 5 }),
    getPerformanceMetrics({ startDate, endDate })
  ])
  
  return {
    keyMetrics,
    revenueData,
    topDishes,
    orderStatus,
    tableStatus,
    recentOrders,
    performance
  }
}
```

**B. Database Indexing**
```sql
-- Add indexes for performance
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_qr_sessions_created_at ON qr_sessions(created_at);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_qr_sessions_status ON qr_sessions(status);
```

**C. Query Optimization**
- [ ] Review all SQL queries
- [ ] Add EXPLAIN ANALYZE
- [ ] Optimize JOINs
- [ ] Add proper WHERE conditions

#### 2. Frontend Optimization (1h)

**A. Centralized Data Fetching**
```javascript
const fetchAllDashboardData = async () => {
  setLoading(true)
  
  try {
    await Promise.all([
      fetchKeyMetrics(),
      fetchRevenueData(),
      fetchTopDishes(),
      fetchOrderStatus(),
      fetchPerformance()
    ])
  } catch (error) {
    message.error('Không thể tải dữ liệu dashboard')
  } finally {
    setLoading(false)
  }
}

// Call on mount and dateRange change
useEffect(() => {
  fetchAllDashboardData()
}, [dateRange])

// Separate useEffect for real-time data
useEffect(() => {
  fetchTableStatus()
  fetchRecentOrders()
  
  const interval = setInterval(() => {
    fetchTableStatus()
    fetchRecentOrders()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

**B. Error Boundary**
```javascript
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-semibold mb-4">Có lỗi xảy ra</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button type="primary" onClick={resetErrorBoundary}>
        Tải lại
      </Button>
    </div>
  )
}

// Wrap Dashboard
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Home />
</ErrorBoundary>
```

**C. Memoization**
```javascript
import { useMemo, useCallback } from 'react'

// Memoize expensive calculations
const formattedRevenueData = useMemo(() => {
  return revenueData.map(item => ({
    ...item,
    formattedValue: formatCurrency(item.value)
  }))
}, [revenueData])

// Memoize callbacks
const handleRefresh = useCallback(async () => {
  setLoading(true)
  await fetchAllDashboardData()
  setLoading(false)
}, [fetchAllDashboardData])
```

#### 3. UX Improvements (0.5h)

**A. Loading Skeletons**
```javascript
import { Skeleton } from 'antd'

{statsLoading ? (
  <Skeleton active paragraph={{ rows: 2 }} />
) : (
  <MetricCard {...props} />
)}
```

**B. Empty States**
```javascript
{topDishes.length === 0 ? (
  <Empty description="Chưa có dữ liệu món bán chạy" />
) : (
  <DishList data={topDishes} />
)}
```

**C. Tooltips & Hints**
```javascript
import { Tooltip } from 'antd'

<Tooltip title="Số phiên phục vụ khách hàng">
  <InfoCircleOutlined className="ml-2 text-gray-400" />
</Tooltip>
```

#### 4. Testing & Documentation (0.5h)

**A. API Testing**
- [ ] Test tất cả endpoints với Postman
- [ ] Test edge cases (empty data, invalid dates)
- [ ] Test performance với large datasets

**B. Frontend Testing**
- [ ] Test responsive layout
- [ ] Test date range changes
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test auto-refresh

**C. Documentation**
```markdown
# Dashboard API Documentation

## GET /api/dashboard/stats
Returns key metrics for dashboard

Query Parameters:
- startDate (required): ISO date string
- endDate (required): ISO date string

Response:
{
  status: 200,
  data: {
    orders: { value, growth, previousValue },
    revenue: { value, growth, previousValue },
    ...
  }
}
```

### Checklist:
- [ ] Parallel data fetching implemented
- [ ] Database indexes added
- [ ] SQL queries optimized
- [ ] Centralized fetch function
- [ ] Error boundary added
- [ ] Memoization implemented
- [ ] Loading skeletons added
- [ ] Empty states added
- [ ] Tooltips added
- [ ] API testing completed
- [ ] Frontend testing completed
- [ ] Documentation written

**Estimated Time:** 2.5 hours

---

## 📊 IMPLEMENTATION SUMMARY

### Total Timeline:
| Phase | Description | Time | Status |
|-------|-------------|------|--------|
| Phase 1 | Setup & Date Filter | 0.5h | ✅ Done |
| Phase 2 | Key Metrics API | 3h | ✅ Done |
| Phase 3 | Revenue Chart | 5h | 🚧 Pending |
| Phase 4 | Top Dishes & Order Status | 3.5h | 🚧 Pending |
| Phase 5 | Table Status & Recent Orders | 2h | 🚧 Pending |
| Phase 6 | Performance Metrics | 2h | 🚧 Pending |
| Phase 7 | Optimization & Polish | 2.5h | 🚧 Pending |
| **TOTAL** | | **18.5h** | **11% Complete** |

### Progress:
- ✅ **Completed:** 2/7 phases (3.5h)
- 🚧 **Remaining:** 5/7 phases (15h)

---

## 🎯 NEXT STEPS

### Immediate (Phase 3):
1. Implement `getRevenueData()` service function
2. Implement auto-groupBy logic
3. Create 4 SQL queries (hour/day/week/month)
4. Create revenue endpoint controller
5. Test backend with different date ranges
6. Integrate frontend with real data
7. Test chart rendering

### Priority Order:
1. **Phase 3** (Revenue Chart) - Core feature ⭐⭐⭐
2. **Phase 4** (Top Dishes & Order Status) - Important insights ⭐⭐⭐
3. **Phase 5** (Real-time Data) - Live monitoring ⭐⭐
4. **Phase 6** (Performance) - Business metrics ⭐⭐
5. **Phase 7** (Polish) - Quality & UX ⭐

---

## 📝 NOTES & CONSIDERATIONS

### Performance:
- Use database indexes on date columns
- Implement query result caching for expensive queries
- Consider Redis for real-time data if needed
- Limit data range to prevent overload (max 1 year)

### Security:
- Add authentication middleware to dashboard routes
- Validate all date inputs
- Sanitize user inputs
- Rate limiting for API endpoints

### Scalability:
- Use connection pooling (already implemented)
- Consider pagination for large datasets
- Implement data aggregation tables for historical data
- Add database read replicas if needed

### Monitoring:
- Add logging for all API calls
- Track API response times
- Monitor database query performance
- Set up error tracking (Sentry)

---

## 🚀 LAUNCH CHECKLIST

Before production deployment:

### Backend:
- [ ] All endpoints tested
- [ ] Error handling comprehensive
- [ ] Logging implemented
- [ ] Database indexes added
- [ ] Performance tested with large data
- [ ] Security review completed
- [ ] API documentation complete

### Frontend:
- [ ] All components tested
- [ ] Responsive design verified
- [ ] Loading states working
- [ ] Error handling working
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] Accessibility checked

### Integration:
- [ ] End-to-end testing
- [ ] Date range edge cases tested
- [ ] Real-time updates working
- [ ] Auto-refresh verified
- [ ] Cross-browser testing
- [ ] Mobile testing

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Author:** AI Assistant  
**Status:** Phase 2 Completed, Phase 3-7 Pending
