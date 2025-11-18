import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import { dashboardApi } from '../../../services/dashboardApi'
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Progress,
  Spin,
  Segmented,
  message
} from 'antd'
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Award,
  CheckCircle,
  Package,
  RefreshCw
} from 'react-feather'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const { Content } = Layout
const { Title, Text } = Typography

const Home = () => {
  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Tổng quan')

  // Date Range Filter State - Default: Today (00:00 - 23:59)
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ])

  // Loading States
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [revenueLoading, setRevenueLoading] = useState(false)

  // Data States
  const [stats, setStats] = useState({
    orders: { value: 0, growth: 0, previousValue: 0 },
    revenue: { value: 0, growth: 0, previousValue: 0 },
    customers: { value: 0, growth: 0, previousValue: 0 },
    avgOrderValue: { value: 0, growth: 0, previousValue: 0 }
  })

  // Revenue Chart Data (Phase 3)
  const [revenueData, setRevenueData] = useState([])
  const [revenueGroupBy, setRevenueGroupBy] = useState('auto') // auto, hour, day, week, month

  // Chart Configuration
  const [revenueViewType, setRevenueViewType] = useState('hour') // hour, day, week, month
  const [revenueChartType, setRevenueChartType] = useState('area') // area, bar

  // Phase 4: Top Dishes & Order Status Data
  const [topDishes, setTopDishes] = useState([])
  const [orderStatusData, setOrderStatusData] = useState([])
  const [topDishesLoading, setTopDishesLoading] = useState(false)
  const [orderStatusLoading, setOrderStatusLoading] = useState(false)

  // Phase 5: Table Status & Recent Orders (Real-time data)
  const [tableStatus, setTableStatus] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [tableStatusLoading, setTableStatusLoading] = useState(false)
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(false)

  // Phase 6: Performance Metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    completionRate: 0,
    avgServiceTime: 0,
    occupancyRate: 0
  })
  const [performanceLoading, setPerformanceLoading] = useState(false)

  // Get current revenue data - Chỉ dùng real data từ API
  const getCurrentRevenueData = () => {
    return revenueData || []
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  const getStatusColor = (status) => {
    // Đồng bộ với backend: NEW, IN_PROGRESS, PAID, CANCELLED
    const colors = {
      NEW: '#1890ff',          // Chờ xác nhận - Xanh dương
      IN_PROGRESS: '#faad14',  // Đang phục vụ - Vàng
      PAID: '#52c41a',         // Hoàn thành - Xanh lá
      CANCELLED: '#ff4d4f'     // Đã hủy - Đỏ
    }
    return colors[status] || '#d9d9d9'
  }

  const getStatusText = (status) => {
    // Đồng bộ với backend: NEW, IN_PROGRESS, PAID, CANCELLED
    const texts = {
      NEW: 'Chờ xác nhận',
      IN_PROGRESS: 'Đang phục vụ',
      PAID: 'Hoàn thành',
      CANCELLED: 'Đã hủy'
    }
    return texts[status] || status
  }

  // Fetch Key Metrics từ API
  const fetchKeyMetrics = async () => {
    try {
      setStatsLoading(true)

      const response = await dashboardApi.getKeyMetrics(
        dateRange[0].toDate(),
        dateRange[1].toDate()
      )

      if (response.status === 200) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching key metrics:', error)
      message.error('Không thể tải dữ liệu thống kê')
    } finally {
      setStatsLoading(false)
    }
  }

  // Fetch Revenue Chart Data (Phase 3)
  const fetchRevenueData = async () => {
    try {
      setRevenueLoading(true)

      const response = await dashboardApi.getRevenueChart(
        dateRange[0].toDate(),
        dateRange[1].toDate(),
        revenueGroupBy === 'auto' ? undefined : revenueGroupBy
      )

      if (response.status === 200) {
        // Transform data để phù hợp với chart format
        const chartData = response.data.chartData.map(item => ({
          name: item.label, // label đã được format từ backend
          value: item.revenue,
          orders: item.orders
        }))

        setRevenueData(chartData)
        // Update view type dựa trên groupBy thực tế từ backend
        setRevenueViewType(response.data.groupBy)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      message.error('Không thể tải dữ liệu doanh thu')
    } finally {
      setRevenueLoading(false)
    }
  }

  // Fetch Top Dishes (Phase 4)
  const fetchTopDishes = async () => {
    try {
      setTopDishesLoading(true)

      const response = await dashboardApi.getTopDishes(
        dateRange[0].toDate(),
        dateRange[1].toDate(),
        5 // TOP 5
      )

      if (response.status === 200) {
        setTopDishes(response.data)
      }
    } catch (error) {
      console.error('Error fetching top dishes:', error)
      message.error('Không thể tải món bán chạy')
    } finally {
      setTopDishesLoading(false)
    }
  }

  // Fetch Order Status Distribution (Phase 4)
  const fetchOrderStatus = async () => {
    try {
      setOrderStatusLoading(true)

      const response = await dashboardApi.getOrderStatus(
        dateRange[0].toDate(),
        dateRange[1].toDate()
      )

      if (response.status === 200) {
        setOrderStatusData(response.data)
      }
    } catch (error) {
      console.error('Error fetching order status:', error)
      message.error('Không thể tải trạng thái đơn hàng')
    } finally {
      setOrderStatusLoading(false)
    }
  }

  // Fetch Table Status (Phase 5 - Real-time)
  const fetchTableStatus = async () => {
    try {
      setTableStatusLoading(true)
      const response = await dashboardApi.getTableStatus()
      if (response.status === 200) {
        setTableStatus(response.data)
      }
    } catch (error) {
      console.error('Error fetching table status:', error)
      message.error('Không thể tải trạng thái bàn')
    } finally {
      setTableStatusLoading(false)
    }
  }

  // Fetch Recent Orders (Phase 5 - Real-time)
  const fetchRecentOrders = async () => {
    try {
      setRecentOrdersLoading(true)
      const response = await dashboardApi.getRecentOrders(5)
      if (response.status === 200) {
        setRecentOrders(response.data)
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      message.error('Không thể tải đơn hàng gần đây')
    } finally {
      setRecentOrdersLoading(false)
    }
  }

  // Fetch Performance Metrics (Phase 6)
  const fetchPerformance = async () => {
    try {
      setPerformanceLoading(true)
      const response = await dashboardApi.getPerformance(
        dateRange[0].toDate(),
        dateRange[1].toDate()
      )
      if (response.status === 200) {
        setPerformanceMetrics(response.data)
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
      message.error('Không thể tải dữ liệu hiệu suất')
    } finally {
      setPerformanceLoading(false)
    }
  }

  // Auto-fetch khi dateRange hoặc revenueGroupBy thay đổi
  useEffect(() => {
    fetchKeyMetrics()
    fetchRevenueData()
    fetchTopDishes()
    fetchOrderStatus()
    fetchPerformance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, revenueGroupBy])

  // Auto-refresh cho real-time data (Phase 5)
  // Table Status & Recent Orders không phụ thuộc dateRange
  useEffect(() => {
    // Fetch lần đầu
    fetchTableStatus()
    fetchRecentOrders()

    // Auto-refresh mỗi 30 giây
    const interval = setInterval(() => {
      fetchTableStatus()
      fetchRecentOrders()
    }, 30000) // 30 seconds

    // Cleanup interval khi component unmount
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency vì không phụ thuộc dateRange

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([
      fetchKeyMetrics(),
      fetchRevenueData(),
      fetchTopDishes(),
      fetchOrderStatus(),
      fetchPerformance(),
      fetchTableStatus(),
      fetchRecentOrders()
    ])
    setLoading(false)
  }

  // MetricCard Component - Reusable metric card với Tailwind
  const MetricCard = ({ icon: Icon, title, value, trend, trendLabel, valueSize = 'large' }) => {
    // Parse trend value để xác định màu
    const trendValue = parseFloat(trend)
    const isPositive = trendValue >= 0
    const trendColor = isPositive ? 'text-green-500' : 'text-red-500'

    // SVG path vẽ mũi tên hướng LÊN (↑) mặc định với đỉnh ở trên
    // Positive (tăng) → Không xoay (0°) → Mũi tên LÊN ↑
    // Negative (giảm) → Xoay 180° → Mũi tên XUỐNG ↓
    const arrowRotation = isPositive ? 'rotate(0 6 6)' : 'rotate(180 6 6)'

    return (
      <Card
        bordered={false}
        className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-40 overflow-hidden"
        bodyStyle={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
        hoverable
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon size={22} strokeWidth={2} color="#1890ff" />
          </div>
          <Text className="text-gray-500 text-xs font-medium tracking-wide mt-1">
            {title}
          </Text>
        </div>
        <div>
          <Title
            level={2}
            className={`text-gray-800 ${valueSize === 'large' ? 'text-3xl' : 'text-2xl'} font-semibold leading-none tracking-tight`}
            style={{ margin: '12px 0 4px 0' }}
          >
            {value}
          </Title>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 10L6 2M6 2L9 5M6 2L3 5"
                stroke={isPositive ? '#52c41a' : '#ff4d4f'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={arrowRotation}
              />
            </svg>
            <Text className={`${trendColor} text-xs font-medium`}>{trend}</Text>
            <Text className="text-gray-400 text-xs">{trendLabel}</Text>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="homes" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        <Content
          style={{
            marginTop: 64,
            padding: '24px',
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}
        >
          {/* Date Range Filter & Refresh */}
          <div className="mb-6 flex justify-end gap-3 flex-wrap">
            <CustomDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button
              type="primary"
              size='medium'
              icon={<RefreshCw size={16} />}
              loading={loading}
              onClick={handleRefresh}
              className="rounded-lg h-8 flex items-center gap-1.5"
            >
              Làm mới
            </Button>
          </div>

          {/* Key Metrics Cards - Japanese Minimalist Design */}
          <Spin spinning={statsLoading}>
            <Row gutter={[20, 20]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={ShoppingCart}
                  title="Đơn hàng"
                  value={stats.orders.value}
                  trend={`${Number(stats.orders.growth) > 0 ? '+' : ''}${stats.orders.growth}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={DollarSign}
                  title="Doanh thu"
                  value={formatCurrency(stats.revenue.value)}
                  trend={`${stats.revenue.growth > 0 ? '+' : ''}${stats.revenue.growth}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="medium"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={Users}
                  title="Khách hàng"
                  value={stats.customers.value}
                  trend={`${stats.customers.growth > 0 ? '+' : ''}${stats.customers.growth}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={TrendingUp}
                  title="Trung bình/đơn"
                  value={formatCurrency(stats.avgOrderValue.value)}
                  trend={`${stats.avgOrderValue.growth > 0 ? '+' : ''}${stats.avgOrderValue.growth}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="medium"
                />
              </Col>
            </Row>
          </Spin>

          {/* Revenue Statistics Chart */}
          <Row gutter={[20, 20]} className="mb-6">
            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                className="rounded-2xl border border-gray-100 shadow-sm"
                title={
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2 pt-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <TrendingUp size={18} strokeWidth={2} color="#1890ff" />
                      </div>
                      <div>
                        <Text strong className="text-base text-gray-800 block leading-tight ">
                          Thống kê doanh thu
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {revenueViewType === 'hour' && 'Theo giờ'}
                          {revenueViewType === 'day' && 'Theo ngày'}
                          {revenueViewType === 'week' && 'Theo tuần'}
                          {revenueViewType === 'month' && 'Theo tháng'}
                        </Text>
                      </div>
                    </div>

                    <div className="flex gap-3 items-center flex-wrap">
                      {/* View Type Filter - Controls API groupBy */}
                      <Segmented
                        value={revenueGroupBy}
                        onChange={setRevenueGroupBy}
                        options={[
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <Clock size={14} strokeWidth={2} />
                                <span className="text-xs">Giờ</span>
                              </div>
                            ),
                            value: 'hour'
                          },
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span className="text-xs">Ngày</span>
                              </div>
                            ),
                            value: 'day'
                          },
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                  <line x1="8" y1="14" x2="8" y2="14" />
                                  <line x1="12" y1="14" x2="12" y2="14" />
                                  <line x1="16" y1="14" x2="16" y2="14" />
                                </svg>
                                <span className="text-xs">Tuần</span>
                              </div>
                            ),
                            value: 'week'
                          },
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                  <line x1="8" y1="14" x2="8" y2="14" />
                                  <line x1="12" y1="14" x2="12" y2="14" />
                                  <line x1="16" y1="14" x2="16" y2="14" />
                                </svg>
                                <span className="text-xs">Tháng</span>
                              </div>
                            ),
                            value: 'month'
                          },
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                <span className="text-xs">Auto</span>
                              </div>
                            ),
                            value: 'auto'
                          }
                        ]}
                        size="middle"
                        className="bg-gray-50 rounded-lg p-0.5"
                      />

                      {/* Chart Type Filter */}
                      <Segmented
                        value={revenueChartType}
                        onChange={setRevenueChartType}
                        options={[
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 12 L7 8 L13 14 L21 6" />
                                  <path d="M3 22 L21 22" strokeLinecap="round" />
                                </svg>
                                <span className="text-xs">Diện tích</span>
                              </div>
                            ),
                            value: 'area'
                          },
                          {
                            label: (
                              <div className="flex items-center gap-1 py-1 px-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="6" y="14" width="4" height="8" />
                                  <rect x="14" y="8" width="4" height="14" />
                                  <line x1="3" y1="22" x2="21" y2="22" strokeLinecap="round" />
                                </svg>
                                <span className="text-xs">Cột</span>
                              </div>
                            ),
                            value: 'bar'
                          }
                        ]}
                        size="middle"
                        className="bg-gray-50 rounded-lg p-0.5"
                      />
                    </div>
                  </div>
                }
                bodyStyle={{ padding: '24px' }}
              >
                <Spin spinning={revenueLoading}>
                  <ResponsiveContainer width="100%" height={340}>
                    {revenueChartType === 'area' ? (
                      <AreaChart data={getCurrentRevenueData()}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            padding: '12px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                          itemStyle={{ color: '#1890ff', fontSize: '13px' }}
                          formatter={(value, name) => {
                            if (name === 'value') return [formatCurrency(value), 'Doanh thu']
                            return [value, 'Đơn hàng']
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#1890ff"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          dot={{ fill: '#1890ff', strokeWidth: 2, r: 4, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={getCurrentRevenueData()}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1890ff" stopOpacity={1} />
                            <stop offset="100%" stopColor="#69b1ff" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            padding: '12px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                          itemStyle={{ color: '#1890ff', fontSize: '13px' }}
                          formatter={(value, name) => {
                            if (name === 'value') return [formatCurrency(value), 'Doanh thu']
                            return [value, 'Đơn hàng']
                          }}
                          cursor={{ fill: 'rgba(24, 144, 255, 0.05)' }}
                        />
                        <Bar
                          dataKey="value"
                          fill="url(#barGradient)"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Spin>

                {/* Summary Stats */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Tổng doanh thu
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {formatCurrency(getCurrentRevenueData().reduce((acc, item) => acc + item.value, 0))}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Tổng đơn hàng
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {getCurrentRevenueData().reduce((acc, item) => acc + item.orders, 0)}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Trung bình
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {formatCurrency(getCurrentRevenueData().reduce((acc, item) => acc + item.value, 0) / getCurrentRevenueData().length)}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Cao nhất
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                      {formatCurrency(Math.max(...getCurrentRevenueData().map(item => item.value)))}
                    </Text>
                  </div>
                </div>

                {/* Performance Metrics - Integrated */}
                <Spin spinning={performanceLoading}>
                  <div style={{ marginTop: '24px' }}>
                    <Text strong style={{ fontSize: '14px', color: '#262626', display: 'block', marginBottom: '16px' }}>
                      Hiệu suất hoạt động
                    </Text>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <div style={{
                          padding: '16px',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            margin: '0 auto 12px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle size={24} strokeWidth={2} color="#1890ff" />
                          </div>
                          <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                            {performanceMetrics.completionRate}%
                          </Title>
                          <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                            Tỷ lệ hoàn thành
                          </Text>
                          <Progress
                            percent={performanceMetrics.completionRate}
                            strokeColor="#1890ff"
                            trailColor="#f0f0f0"
                            showInfo={false}
                            strokeWidth={6}
                          />
                          <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                            +2.4% từ tuần trước
                          </Text>
                        </div>
                      </Col>

                      <Col xs={24} sm={8}>
                        <div style={{
                          padding: '16px',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            margin: '0 auto 12px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Clock size={24} strokeWidth={2} color="#1890ff" />
                          </div>
                          <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                            {performanceMetrics.avgServiceTime}
                          </Title>
                          <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                            Thời gian TB (phút)
                          </Text>
                          <Progress
                            percent={Math.min(100, (performanceMetrics.avgServiceTime / 30) * 100)}
                            strokeColor="#1890ff"
                            trailColor="#f0f0f0"
                            showInfo={false}
                            strokeWidth={6}
                          />
                          <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                            Giảm 3 phút
                          </Text>
                        </div>
                      </Col>

                      <Col xs={24} sm={8}>
                        <div style={{
                          padding: '16px',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            margin: '0 auto 12px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Users size={24} strokeWidth={2} color="#1890ff" />
                          </div>
                          <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                            {performanceMetrics.occupancyRate}%
                          </Title>
                          <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                            Lấp đầy bàn
                          </Text>
                          <Progress
                            percent={performanceMetrics.occupancyRate}
                            strokeColor="#1890ff"
                            trailColor="#f0f0f0"
                            showInfo={false}
                            strokeWidth={6}
                          />
                          <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                            +5% từ tuần trước
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Spin>
              </Card>
            </Col>

            {/* Table Status & Order Status */}
            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '16px'
                }}
                title={<div className="flex items-center">
                  <div style={{
                    background: '#fff7e6',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <Package size={18} color="#fa8c16" strokeWidth={2.5} />
                  </div>
                  <Text strong>Tình trạng bàn</Text>
                </div>}
              >
                <Spin spinning={tableStatusLoading}>
                  {tableStatus.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">Chưa có dữ liệu trạng thái bàn</Text>
                    </div>
                  ) : (
                    <Row gutter={[8, 8]}>
                      {tableStatus.map((item) => (
                        <Col span={12} key={item.status}>
                          <div
                            style={{
                              background: '#fafafa',
                              borderRadius: '8px',
                              padding: '16px',
                              textAlign: 'center',
                              border: `2px solid ${item.color}`
                            }}
                          >
                            <Title level={2} style={{ margin: 0, color: item.color }}>
                              {item.count}
                            </Title>
                            <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                              {item.label}
                            </Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Spin>
              </Card>

              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={<div className="flex items-center">
                  <div style={{
                    background: '#f6ffed',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <CheckCircle size={18} color="#52c41a" strokeWidth={2.5} />
                  </div>
                  <Text strong>Trạng thái đơn hàng</Text>
                </div>}
              >
                <Spin spinning={orderStatusLoading}>
                  {orderStatusData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">Chưa có dữ liệu đơn hàng</Text>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4">
                        {orderStatusData.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between mb-2"
                          >
                            <div className="flex items-center">
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: item.color,
                                  marginRight: '8px'
                                }}
                              />
                              <Text style={{ fontSize: '13px' }}>{item.name}</Text>
                            </div>
                            <Text strong style={{ fontSize: '14px' }}>
                              {item.value}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Spin>
              </Card>
            </Col>
          </Row>

          {/* Top Dishes & Recent Orders */}
          <Row gutter={[16, 16]}>
            {/* Top Selling Dishes */}
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={
                  <div className="flex items-center">
                    <div style={{
                      background: '#fff1f0',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px'
                    }}>
                      <Award size={18} color="#ff4d4f" strokeWidth={2.5} />
                    </div>
                    <Text strong style={{ fontSize: '16px' }}>Món bán chạy</Text>
                  </div>
                }
              >
                <Spin spinning={topDishesLoading}>
                  {topDishes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text type="secondary">Chưa có dữ liệu món bán chạy</Text>
                    </div>
                  ) : (
                    <div>
                      {topDishes.map((dish, index) => (
                        <div
                          key={dish.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px',
                            background: index % 2 === 0 ? '#fafafa' : '#fff',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                              fontSize: '20px',
                              overflow: 'hidden'
                            }}
                          >
                            {dish.image && dish.image.startsWith('http') ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = '🍽️' }}
                              />
                            ) : (
                              <span style={{ fontSize: '20px' }}>{dish.image || '🍽️'}</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: '14px', display: 'block' }}>
                              {dish.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Đã bán: {dish.sold} • {formatCurrency(dish.revenue)}
                            </Text>
                          </div>
                          <div className="text-right">
                            <div style={{ marginBottom: '4px' }}>
                              <Award
                                size={16}
                                color={'#faad14'}
                                strokeWidth={2}
                                fill={'#faad14'}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              #{index + 1}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Spin>
              </Card>
            </Col>

            {/* Recent Orders */}
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={
                  <div className="flex items-center">
                    <div style={{
                      background: '#e6f7ff',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px'
                    }}>
                      <Clock size={18} color="#1890ff" strokeWidth={2.5} />
                    </div>
                    <Text strong style={{ fontSize: '16px' }}>Đơn hàng gần đây</Text>
                  </div>
                }
              >
                <Spin spinning={recentOrdersLoading}>
                  <Table
                    dataSource={recentOrders}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    locale={{
                      emptyText: (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <Text type="secondary">Chưa có đơn hàng gần đây</Text>
                        </div>
                      )
                    }}
                    columns={[
                      {
                        title: 'Mã đơn',
                        dataIndex: 'id',
                        key: 'id',
                        width: '15%',
                        render: (text) => (
                          <Text strong style={{ fontSize: '13px' }}>
                            {text}
                          </Text>
                        )
                      },
                      {
                        title: 'Bàn',
                        dataIndex: 'table',
                        key: 'table',
                        width: '10%',
                        render: (text) => (
                          <Tag color="blue" style={{ fontSize: '12px' }}>
                            {text}
                          </Tag>
                        )
                      },
                      {
                        title: 'Thời gian',
                        dataIndex: 'time',
                        key: 'time',
                        width: '15%',
                        render: (text) => (
                          <Text style={{ fontSize: '12px' }}>{text}</Text>
                        )
                      },
                      {
                        title: 'Số món',
                        dataIndex: 'items',
                        key: 'items',
                        width: '15%',
                        render: (text) => (
                          <Text style={{ fontSize: '12px' }}>{text} món</Text>
                        )
                      },
                      {
                        title: 'Tổng tiền',
                        dataIndex: 'amount',
                        key: 'amount',
                        width: '20%',
                        render: (value) => (
                          <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
                            {formatCurrency(value)}
                          </Text>
                        )
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: '23%',
                        render: (status) => (
                          <Tag
                            color={getStatusColor(status)}
                            style={{
                              fontSize: '11px',
                              border: 'none',
                              borderRadius: '4px'
                            }}
                          >
                            {getStatusText(status)}
                          </Tag>
                        )
                      }
                    ]}
                  // scroll={{ x: 600 }}
                  />
                </Spin>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Home