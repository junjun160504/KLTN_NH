import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import reportSalesService from '../../../services/reportSalesService'
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Spin,
  Segmented,
  message
} from 'antd'
import {
  ShoppingCart,
  DollarSign,
  Award,
  Clock,
  Download,
  RefreshCw,
  Package,
  Users
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
import * as XLSX from 'xlsx'

const { Content } = Layout
const { Title, Text } = Typography

// ==================== MOCK DATA ====================
// 1. Mock Xu Hướng Kinh Doanh (linh hoạt theo thời gian)
const generateMockBusinessTrend = (viewType = 'day', dateRange) => {
  const data = []
  const start = dateRange[0]
  const end = dateRange[1]

  if (viewType === 'hour') {
    // 24 giờ trong ngày
    for (let i = 0; i < 24; i++) {
      const baseRevenue = 500000 + Math.random() * 1500000
      const orders = Math.floor(3 + Math.random() * 10)
      const customers = Math.floor(2 + Math.random() * 8)

      data.push({
        date: start.hour(i).format('YYYY-MM-DD HH:00'),
        label: `${i}h`,
        revenue: Math.floor(baseRevenue),
        orders: orders,
        customers: customers,
        profit: Math.floor(baseRevenue * 0.35),
        avgOrderValue: orders > 0 ? Math.floor(baseRevenue / orders) : 0
      })
    }
  } else if (viewType === 'day') {
    // Số ngày giữa dateRange
    const days = end.diff(start, 'day') + 1
    for (let i = 0; i < days; i++) {
      const date = start.add(i, 'day')
      const baseRevenue = 15000000 + Math.random() * 10000000
      const orders = Math.floor(80 + Math.random() * 50)
      const customers = Math.floor(60 + Math.random() * 40)

      data.push({
        date: date.format('YYYY-MM-DD'),
        label: date.format('DD/MM'),
        revenue: Math.floor(baseRevenue),
        orders: orders,
        customers: customers,
        profit: Math.floor(baseRevenue * 0.35),
        avgOrderValue: Math.floor(baseRevenue / orders)
      })
    }
  } else if (viewType === 'week') {
    // Theo tuần
    const weeks = Math.ceil(end.diff(start, 'week', true))
    for (let i = 0; i < weeks; i++) {
      const weekStart = start.add(i, 'week')
      const baseRevenue = 100000000 + Math.random() * 50000000
      const orders = Math.floor(500 + Math.random() * 300)
      const customers = Math.floor(400 + Math.random() * 250)

      data.push({
        date: weekStart.format('YYYY-MM-DD'),
        label: `Tuần ${i + 1}`,
        revenue: Math.floor(baseRevenue),
        orders: orders,
        customers: customers,
        profit: Math.floor(baseRevenue * 0.35),
        avgOrderValue: Math.floor(baseRevenue / orders)
      })
    }
  } else if (viewType === 'month') {
    // Theo tháng
    const months = Math.ceil(end.diff(start, 'month', true))
    for (let i = 0; i < months; i++) {
      const monthStart = start.add(i, 'month')
      const baseRevenue = 400000000 + Math.random() * 200000000
      const orders = Math.floor(2000 + Math.random() * 1000)
      const customers = Math.floor(1600 + Math.random() * 800)

      data.push({
        date: monthStart.format('YYYY-MM-DD'),
        label: monthStart.format('MM/YYYY'),
        revenue: Math.floor(baseRevenue),
        orders: orders,
        customers: customers,
        profit: Math.floor(baseRevenue * 0.35),
        avgOrderValue: Math.floor(baseRevenue / orders)
      })
    }
  }

  return data
}

const ReportsSalesPage = () => {
  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Báo Cáo Bán Hàng')

  // Date Range State
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day')
  ])

  // Loading States
  const [loading, setLoading] = useState(false)
  const [revenueLoading, setRevenueLoading] = useState(false)

  // Data States
  const [businessTrendData, setBusinessTrendData] = useState([])
  const [dishRevenueData, setDishRevenueData] = useState([])
  const [categoryRevenueData, setCategoryRevenueData] = useState([])

  // Summary Metrics from API
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    growth: { revenue: 0, orders: 0, customers: 0 }
  })

  // Chart Configuration
  const [trendChartType, setTrendChartType] = useState('area')
  const [dishChartType, setDishChartType] = useState('bar')
  const [trendViewType, setTrendViewType] = useState('day') // 'hour', 'day', 'week', 'month'
  const [dishLimit, setDishLimit] = useState(15) // Top N món ăn

  // ==================== DATA FETCHING ====================
  const fetchReportData = async () => {
    try {
      setRevenueLoading(true)

      // Fetch Business Trend Data với summary metrics
      const trendResponse = await reportSalesService.getBusinessTrend(
        dateRange[0],
        dateRange[1],
        trendViewType
      )

      if (trendResponse.success) {
        // Transform data từ backend sang chart format
        const chartData = trendResponse.data.trend.map(item => ({
          date: item.date,
          label: item.label,
          revenue: item.revenue,
          orders: item.orders,
          customers: item.customers,
          avgOrderValue: item.avgOrderValue
        }))

        setBusinessTrendData(chartData)
        setSummaryMetrics(trendResponse.data.summary)
      } else {
        // Fallback to empty data on error
        setBusinessTrendData([])
        setSummaryMetrics({
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          avgOrderValue: 0,
          growth: { revenue: 0, orders: 0, customers: 0 }
        })
      }

      // Fetch Dish Revenue Data
      const dishResponse = await reportSalesService.getDishRevenue(
        dateRange[0],
        dateRange[1],
        dishLimit
      )

      if (dishResponse.success && Array.isArray(dishResponse.data)) {
        // Transform data từ backend sang chart format
        const dishData = dishResponse.data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          image: item.image,
          quantity: item.quantity,
          revenue: item.revenue,
          growth: item.growth
        }))
        setDishRevenueData(dishData)
      } else {
        setDishRevenueData([])
      }

      // Fetch Category Revenue Data
      const categoryResponse = await reportSalesService.getCategoryRevenue(
        dateRange[0],
        dateRange[1]
      )

      if (categoryResponse.success && Array.isArray(categoryResponse.data)) {
        // Transform data từ backend sang chart format
        const categoryData = categoryResponse.data.map(item => ({
          id: item.id,
          category: item.category,
          name: item.name,
          quantity: item.quantity,
          revenue: item.revenue,
          percentOfTotal: item.percentOfTotal,
          dishes: item.dishes,
          color: item.color
        }))
        setCategoryRevenueData(categoryData)
      } else {
        setCategoryRevenueData([])
      }

    } catch (error) {
      console.error('Error fetching report data:', error)
      message.error('Không thể tải dữ liệu báo cáo. Vui lòng thử lại!')

      // Fallback to empty arrays
      setBusinessTrendData([])
      setDishRevenueData([])
      setCategoryRevenueData([])
      setSummaryMetrics({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        growth: { revenue: 0, orders: 0, customers: 0 }
      })
    } finally {
      setRevenueLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, trendViewType, dishLimit])

  const handleRefresh = async () => {
    setLoading(true)
    await fetchReportData()
    setLoading(false)
    message.success('Đã làm mới dữ liệu')
  }

  // ==================== CALCULATIONS ====================
  // Use summary metrics from API instead of local calculations
  const totalRevenue = summaryMetrics.totalRevenue || 0
  const totalOrders = summaryMetrics.totalOrders || 0
  const totalCustomers = summaryMetrics.totalCustomers || 0
  const avgOrderValue = summaryMetrics.avgOrderValue || 0

  // Calculate additional metrics for charts if needed
  const totalProfit = businessTrendData.reduce((sum, item) => sum + (item.profit || 0), 0)
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

  // ==================== EXPORT FUNCTION ====================
  const handleExport = () => {
    try {
      const summaryData = [
        { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': `${totalRevenue.toLocaleString()} VNĐ` },
        { 'Chỉ số': 'Tổng lợi nhuận', 'Giá trị': `${totalProfit.toLocaleString()} VNĐ` },
        { 'Chỉ số': 'Tỷ suất lợi nhuận', 'Giá trị': `${profitMargin}%` },
        { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': `${totalOrders.toLocaleString()}` },
        { 'Chỉ số': 'Giá trị TB/đơn', 'Giá trị': `${avgOrderValue.toLocaleString()} VNĐ` },
        { 'Chỉ số': 'Tổng khách hàng', 'Giá trị': `${totalCustomers.toLocaleString()}` }
      ]

      const dishData = dishRevenueData.map((item, index) => ({
        'STT': index + 1,
        'Tên món': item.name,
        'Danh mục': item.category,
        'Số lượng': item.quantity,
        'Doanh thu': item.revenue,
        'Chi phí': item.cost,
        'Lợi nhuận': item.profit,
        'Tỷ suất LN (%)': item.profitMargin,
        'Tăng trưởng (%)': item.growth
      }))

      const categoryExport = categoryRevenueData.map(item => ({
        'Danh mục': item.category,
        'Số món': item.dishes,
        'Số lượng bán': item.quantity,
        'Doanh thu': item.revenue,
        'Chi phí': item.cost,
        'Lợi nhuận': item.profit,
        'Tỷ suất LN (%)': item.profitMargin,
        'Tỷ trọng (%)': item.percentOfTotal
      }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Tổng quan')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dishData), 'Doanh thu món ăn')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryExport), 'Doanh thu danh mục')

      const fileName = `BaoCaoBanHang_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      XLSX.writeFile(wb, fileName)

      message.success('Xuất báo cáo thành công!')
    } catch (error) {
      message.error('Có lỗi xảy ra khi xuất báo cáo')
      console.error('Export error:', error)
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  // ==================== METRIC CARD COMPONENT ====================
  const MetricCard = ({ icon: Icon, title, value, trend, trendLabel, valueSize = 'large', suffix = '' }) => {
    const trendValue = parseFloat(trend)
    const isPositive = trendValue >= 0
    const trendColor = isPositive ? 'text-green-500' : 'text-red-500'
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
            {value}{suffix}
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
            <Text className={`${trendColor} text-xs font-medium`}>{trend}%</Text>
            <Text className="text-gray-400 text-xs">{trendLabel}</Text>
          </div>
        </div>
      </Card>
    )
  }

  // ==================== RENDER ====================
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="report_sales" />

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
          {/* Header & Filters */}
          <div className="mb-6 flex justify-between items-start gap-3 flex-wrap">
            <div>
              <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                Báo Cáo Bán Hàng
              </Title>
              <Text className="text-gray-500">
                Phân tích hiệu suất kinh doanh theo xu hướng, món ăn và danh mục
              </Text>
            </div>

            <div className="flex gap-3 items-center">
              <CustomDateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Button
                icon={<Download size={16} />}
                onClick={handleExport}
                className="rounded-lg h-8 flex items-center gap-1.5"
              >
                Xuất Excel
              </Button>
              <Button
                type="primary"
                icon={<RefreshCw size={16} />}
                loading={loading}
                onClick={handleRefresh}
                className="rounded-lg h-8 flex items-center gap-1.5"
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <Spin spinning={revenueLoading}>
            <Row gutter={[20, 20]} className="mb-6">
              <Col xs={24} sm={12} lg={8}>
                <MetricCard
                  icon={DollarSign}
                  title="Tổng doanh thu"
                  value={formatCurrency(totalRevenue)}
                  trend={`${summaryMetrics.growth?.revenue > 0 ? '+' : ''}${summaryMetrics.growth?.revenue || 0}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="medium"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <MetricCard
                  icon={ShoppingCart}
                  title="Tổng đơn hàng"
                  value={totalOrders.toLocaleString()}
                  trend={`${summaryMetrics.growth?.orders > 0 ? '+' : ''}${summaryMetrics.growth?.orders || 0}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <MetricCard
                  icon={Users}
                  title="Tổng khách hàng"
                  value={totalCustomers.toLocaleString()}
                  trend={`${summaryMetrics.growth?.customers > 0 ? '+' : ''}${summaryMetrics.growth?.customers || 0}%`}
                  trendLabel="từ kỳ trước"
                  valueSize="large"
                />
              </Col>
            </Row>            {/* 1. BIỂU ĐỒ XU HƯỚNG KINH DOANH */}
            <Row gutter={[20, 20]} className="mb-6">
              <Col xs={24}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <Clock size={20} strokeWidth={2.5} color="#1890ff" />
                        </div>
                        <div>
                          <Text strong className="text-lg text-gray-800 block leading-tight">
                            Xu Hướng Kinh Doanh
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Doanh thu và đơn hàng theo thời gian (30 ngày)
                          </Text>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Bộ lọc thời gian */}
                        <Segmented
                          value={trendViewType}
                          onChange={setTrendViewType}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Giờ</span>
                              </div>,
                              value: 'hour'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Ngày</span>
                              </div>,
                              value: 'day'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Tuần</span>
                              </div>,
                              value: 'week'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Tháng</span>
                              </div>,
                              value: 'month'
                            }
                          ]}
                          size="middle"
                          className="bg-gray-50 rounded-lg p-0.5"
                        />

                        {/* Loại biểu đồ */}
                        <Segmented
                          value={trendChartType}
                          onChange={setTrendChartType}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Diện tích</span>
                              </div>,
                              value: 'area'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Đường</span>
                              </div>,
                              value: 'line'
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
                  <ResponsiveContainer width="100%" height={400}>
                    {trendChartType === 'area' ? (
                      <AreaChart data={businessTrendData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '12px', fontSize: '13px' }}
                          formatter={(value, name) => {
                            const labels = {
                              revenue: 'Doanh thu',
                              profit: 'Lợi nhuận',
                              orders: 'Đơn hàng'
                            }
                            const formattedValue = name === 'orders'
                              ? value.toLocaleString()
                              : formatCurrency(value)
                            return [formattedValue, labels[name]]
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#1890ff"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          dot={{ fill: '#1890ff', strokeWidth: 2, r: 5, stroke: '#fff' }}
                          activeDot={{ r: 7, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={businessTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '12px', fontSize: '13px' }}
                          formatter={(value, name) => {
                            const labels = {
                              revenue: 'Doanh thu',
                              orders: 'Đơn hàng'
                            }
                            const formattedValue = name === 'orders'
                              ? value.toLocaleString()
                              : formatCurrency(value)
                            return [formattedValue, labels[name]]
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#1890ff"
                          strokeWidth={3}
                          fill="none"
                          dot={{ fill: '#1890ff', strokeWidth: 2, r: 5, stroke: '#fff' }}
                          activeDot={{ r: 7, strokeWidth: 2 }}
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="#52c41a"
                          strokeWidth={2.5}
                          fill="none"
                          strokeDasharray="5 5"
                          dot={{ fill: '#52c41a', strokeWidth: 2, r: 4, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <Text className="text-sm text-gray-600">Doanh thu</Text>
                    </div>
                    {trendChartType === 'line' && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-green-500" style={{ borderTop: '2px dashed #52c41a' }}></div>
                        <Text className="text-sm text-gray-600">Đơn hàng</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 2. BIỂU ĐỒ DOANH THU THEO MÓN ĂN & 3. BIỂU ĐỒ DOANH THU THEO DANH MỤC */}
            <Row gutter={[20, 20]} className="mb-6">
              {/* Doanh Thu Theo Món Ăn */}
              <Col xs={24} xl={14}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                          <Package size={20} strokeWidth={2.5} color="#722ed1" />
                        </div>
                        <div>
                          <Text strong className="text-lg text-gray-800 block leading-tight">
                            Doanh Thu Theo Món Ăn
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Top {dishLimit} món có doanh thu cao nhất
                          </Text>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Segmented
                          value={dishLimit}
                          onChange={setDishLimit}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Top 5</span>
                              </div>,
                              value: 5
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Top 10</span>
                              </div>,
                              value: 10
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Top 15</span>
                              </div>,
                              value: 15
                            }
                          ]}
                          size="middle"
                          className="bg-gray-50 rounded-lg p-0.5"
                        />

                        <Segmented
                          value={dishChartType}
                          onChange={setDishChartType}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Cột</span>
                              </div>,
                              value: 'bar'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Ngang</span>
                              </div>,
                              value: 'horizontal'
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
                  <ResponsiveContainer width="100%" height={500}>
                    {dishChartType === 'bar' ? (
                      <BarChart data={dishRevenueData}>
                        <defs>
                          <linearGradient id="dishGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#722ed1" stopOpacity={1} />
                            <stop offset="100%" stopColor="#b37feb" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          angle={-45}
                          textAnchor="end"
                          height={120}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
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
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                          formatter={(value, name) => {
                            if (name === 'revenue') return [formatCurrency(value), 'Doanh thu']
                            if (name === 'quantity') return [value.toLocaleString(), 'Số lượng']
                            return [value, name]
                          }}
                          cursor={{ fill: 'rgba(114, 46, 209, 0.05)' }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="url(#dishGradient)"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    ) : (
                      <BarChart data={dishRevenueData} layout="vertical">
                        <defs>
                          <linearGradient id="dishGradientH" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#722ed1" stopOpacity={1} />
                            <stop offset="100%" stopColor="#b37feb" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          width={120}
                          tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                          formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                          cursor={{ fill: 'rgba(114, 46, 209, 0.05)' }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="url(#dishGradientH)"
                          radius={[0, 8, 8, 0]}
                          maxBarSize={25}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Card>
              </Col>

              {/* Doanh Thu Theo Danh Mục */}
              <Col xs={24} xl={10}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm h-full"
                  title={
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                        <Award size={20} strokeWidth={2.5} color="#fa8c16" />
                      </div>
                      <div>
                        <Text strong className="text-lg text-gray-800 block leading-tight">
                          Doanh Thu Theo Danh Mục
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Phân tích theo loại món
                        </Text>
                      </div>
                    </div>
                  }
                  bodyStyle={{ padding: '24px' }}
                >
                  {/* Pie Chart */}
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        {categoryRevenueData.map((item, index) => (
                          <linearGradient key={`gradient-${index}`} id={`categoryGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoryRevenueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="revenue"
                        label={({ percentOfTotal }) => `${percentOfTotal}%`}
                        labelLine={false}
                      >
                        {categoryRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#categoryGradient${index})`} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          padding: '16px'
                        }}
                        formatter={(value, name, props) => [formatCurrency(value), props.payload.name || 'Doanh thu']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Category Details */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 gap-3">
                      {categoryRevenueData.map((item) => (
                        <div key={item.category} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '3px',
                                  background: item.color
                                }}
                              />
                              <Text strong className="text-sm">{item.category}</Text>
                            </div>
                            <div className="flex items-center gap-3">
                              <Text className="text-xs text-gray-500">{item.dishes} món</Text>
                              <Text strong className="text-sm">{formatCurrency(item.revenue)}</Text>
                              <Tag color={item.color} className="font-semibold ml-2">
                                {item.percentOfTotal}%
                              </Tag>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Spin>
        </Content>
      </Layout>

      <style>{`
        .ant-table-thead > tr > th {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6) !important;
          border-bottom: 2px solid #e5e7eb !important;
          font-weight: 600 !important;
          padding: 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px !important;
          transition: all 0.2s ease !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f0f9ff !important;
        }
      `}</style>
    </Layout>
  )
}

export default ReportsSalesPage
