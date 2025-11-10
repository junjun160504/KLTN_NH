import React, { useState, useEffect } from 'react'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  Button,
  DatePicker,
  Select,
  Table,
  Tag,
  Space,
  Skeleton,
  Empty,
  message
} from 'antd'
import { Line, Bar } from '@ant-design/plots'
import {
  CalendarOutlined,
  FilterOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import * as XLSX from 'xlsx'

dayjs.extend(isBetween)

const { Content } = Layout
const { RangePicker } = DatePicker
const { Option } = Select

// Mock dữ liệu - Sẽ thay bằng API thực tế
const mockProducts = [
  { date: '2025-10-20', product: 'Phở Bò Tái', category: 'Món chính', quantity: 342, revenue: 4500000, cost: 2700000 },
  { date: '2025-10-20', product: 'Bún Chả', category: 'Món chính', quantity: 500, revenue: 8000000, cost: 4800000 },
  { date: '2025-10-20', product: 'Trà Sữa', category: 'Đồ uống', quantity: 280, revenue: 4200000, cost: 2100000 },
  { date: '2025-10-21', product: 'Cơm Tấm', category: 'Món chính', quantity: 200, revenue: 4000000, cost: 2400000 },
  { date: '2025-10-21', product: 'Cà Phê', category: 'Đồ uống', quantity: 180, revenue: 2700000, cost: 1350000 },
  { date: '2025-10-22', product: 'Nem Rán', category: 'Khai vị', quantity: 90, revenue: 1800000, cost: 900000 },
  { date: '2025-10-22', product: 'Gỏi Cuốn', category: 'Khai vị', quantity: 70, revenue: 1400000, cost: 700000 },
  { date: '2025-10-22', product: 'Nước Cam', category: 'Đồ uống', quantity: 150, revenue: 3000000, cost: 1500000 },
  { date: '2025-10-23', product: 'Phở Bò Tái', category: 'Món chính', quantity: 380, revenue: 5016000, cost: 3009600 },
  { date: '2025-10-23', product: 'Trà Sữa', category: 'Đồ uống', quantity: 320, revenue: 4800000, cost: 2400000 },
  { date: '2025-10-24', product: 'Bún Chả', category: 'Món chính', quantity: 450, revenue: 7200000, cost: 4320000 },
  { date: '2025-10-24', product: 'Cà Phê', category: 'Đồ uống', quantity: 200, revenue: 3000000, cost: 1500000 },
  { date: '2025-10-25', product: 'Cơm Tấm', category: 'Món chính', quantity: 250, revenue: 5000000, cost: 3000000 },
  { date: '2025-10-25', product: 'Nem Rán', category: 'Khai vị', quantity: 120, revenue: 2400000, cost: 1200000 }
]

const ReportsSalesPage = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [pageTitle] = useState('Báo Cáo Bán Hàng')
  const [filteredSales, setFilteredSales] = useState(mockProducts)
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [quickFilter, setQuickFilter] = useState('week')

  // ====== Quick Filter Presets (Enterprise Standard) ======
  const applyQuickFilter = (type) => {
    setQuickFilter(type)
    const today = dayjs()
    let start, end

    switch (type) {
      case 'today':
        start = today.startOf('day')
        end = today.endOf('day')
        break
      case 'yesterday':
        start = today.subtract(1, 'day').startOf('day')
        end = today.subtract(1, 'day').endOf('day')
        break
      case 'week':
        start = today.subtract(7, 'day')
        end = today
        break
      case 'month':
        start = today.startOf('month')
        end = today.endOf('month')
        break
      case 'quarter':
        start = today.startOf('quarter')
        end = today.endOf('quarter')
        break
      case 'year':
        start = today.startOf('year')
        end = today.endOf('year')
        break
      default:
        start = today.subtract(7, 'day')
        end = today
    }

    setDateRange([start, end])
  }

  // ====== Auto filter on mount ======
  useEffect(() => {
    handleFilter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ====== Export to Excel (Enterprise Feature) ======
  const handleExport = () => {
    try {
      const exportData = topProducts.map((item, index) => ({
        'Thứ hạng': index + 1,
        'Sản phẩm': item.product,
        'Loại món': item.category,
        'Số lượng': item.quantity,
        'Doanh thu (VNĐ)': item.revenue,
        'Chi phí (VNĐ)': item.cost,
        'Lợi nhuận (VNĐ)': item.profit,
        'Tỷ suất LN (%)': ((item.profit / item.revenue) * 100).toFixed(2)
      }))

      const categoryExport = categoryData.map(item => ({
        'Loại món': item.category,
        'Số lượng': item.quantity,
        'Doanh thu (VNĐ)': item.revenue,
        'Chi phí (VNĐ)': item.cost,
        'Lợi nhuận (VNĐ)': item.profit,
        'Tỷ suất LN (%)': item.profitMargin
      }))

      const summaryData = [
        { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': totalRevenue.toLocaleString() + ' VNĐ' },
        { 'Chỉ số': 'Tổng chi phí', 'Giá trị': totalCost.toLocaleString() + ' VNĐ' },
        { 'Chỉ số': 'Tổng lợi nhuận', 'Giá trị': totalProfit.toLocaleString() + ' VNĐ' },
        { 'Chỉ số': 'Tỷ suất lợi nhuận', 'Giá trị': profitMargin + '%' },
        { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': totalOrders.toLocaleString() + ' món' },
        { 'Chỉ số': 'Giá trị TB/món', 'Giá trị': avgOrderValue.toLocaleString() + ' VNĐ' }
      ]

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(summaryData)
      const ws2 = XLSX.utils.json_to_sheet(exportData)
      const ws3 = XLSX.utils.json_to_sheet(categoryExport)

      XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan')
      XLSX.utils.book_append_sheet(wb, ws2, 'Top sản phẩm')
      XLSX.utils.book_append_sheet(wb, ws3, 'Theo loại món')

      const fileName = `BaoCaoBanHang_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      XLSX.writeFile(wb, fileName)

      message.success('Xuất báo cáo thành công!')
    } catch (error) {
      message.error('Có lỗi xảy ra khi xuất báo cáo')
      console.error('Export error:', error)
    }
  }

  // ====== Bộ lọc ======
  const handleFilter = () => {
    setLoading(true)
    setTimeout(() => {
      let data = mockProducts
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange
        data = data.filter((s) => {
          const d = dayjs(s.date)
          return d.isBetween(start, end, 'day', '[]')
        })
      }
      if (categoryFilter !== 'all') {
        data = data.filter((s) => s.category === categoryFilter)
      }
      setFilteredSales(data)
      setLoading(false)
    }, 300)
  }

  // ====== Tính toán thống kê ======
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.revenue, 0)
  const totalCost = filteredSales.reduce((sum, s) => sum + s.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0
  const totalOrders = filteredSales.reduce((sum, s) => sum + s.quantity, 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  // Top sản phẩm
  const productStats = filteredSales.reduce((acc, s) => {
    if (!acc[s.product]) {
      acc[s.product] = { product: s.product, category: s.category, quantity: 0, revenue: 0, cost: 0 }
    }
    acc[s.product].quantity += s.quantity
    acc[s.product].revenue += s.revenue
    acc[s.product].cost += s.cost
    return acc
  }, {})

  const topProducts = Object.values(productStats)
    .map(p => ({ ...p, profit: p.revenue - p.cost }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Doanh thu theo loại món
  const categoryRevenue = filteredSales.reduce((acc, s) => {
    if (!acc[s.category]) {
      acc[s.category] = { category: s.category, revenue: 0, quantity: 0, cost: 0 }
    }
    acc[s.category].revenue += s.revenue
    acc[s.category].quantity += s.quantity
    acc[s.category].cost += s.cost
    return acc
  }, {})

  const categoryData = Object.values(categoryRevenue).map(c => ({
    ...c,
    profit: c.revenue - c.cost,
    profitMargin: ((c.revenue - c.cost) / c.revenue * 100).toFixed(1)
  }))

  // Dữ liệu biểu đồ xu hướng
  const dailyRevenue = filteredSales.reduce((acc, s) => {
    if (!acc[s.date]) {
      acc[s.date] = { date: s.date, revenue: 0, quantity: 0 }
    }
    acc[s.date].revenue += s.revenue
    acc[s.date].quantity += s.quantity
    return acc
  }, {})

  const trendData = Object.values(dailyRevenue).sort((a, b) =>
    dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  )

  // So sánh với kỳ trước (mock data)
  const previousRevenue = totalRevenue * 0.85
  const revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
  const isGrowthPositive = revenueGrowth > 0

  // ====== Columns ======
  const topProductColumns = [
    {
      title: <span className="text-xs font-medium text-gray-600">Món</span>,
      dataIndex: 'product',
      key: 'product',
      render: (text, record, index) => (
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
              index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                'bg-gray-100 text-gray-600'
            }`}>
            {index + 1}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-800">{text}</div>
            <div className="text-xs text-gray-500">{record.category}</div>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Số lượng</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => <span className="font-semibold text-blue-600">{val.toLocaleString()}</span>
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Doanh thu</span>,
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (val) => <span className="font-semibold text-green-600">{val.toLocaleString()}đ</span>
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Lợi nhuận</span>,
      dataIndex: 'profit',
      key: 'profit',
      align: 'right',
      render: (val) => (
        <span className={`font-semibold ${val >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {val.toLocaleString()}đ
        </span>
      )
    }
  ]

  const categoryColumns = [
    {
      title: <span className="text-xs font-medium text-gray-600">Loại món</span>,
      dataIndex: 'category',
      key: 'category',
      render: (text) => <span className="font-medium text-gray-800">{text}</span>
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Số lượng</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => <span className="text-gray-700">{val.toLocaleString()}</span>
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Doanh thu</span>,
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-800">{val.toLocaleString()}đ</span>
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Lợi nhuận</span>,
      dataIndex: 'profit',
      key: 'profit',
      align: 'right',
      render: (val) => (
        <span className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val.toLocaleString()}đ
        </span>
      )
    },
    {
      title: <span className="text-xs font-medium text-gray-600">Tỷ suất LN</span>,
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      align: 'right',
      render: (val) => (
        <Tag color={val >= 40 ? 'green' : val >= 30 ? 'blue' : 'orange'} className="font-semibold">
          {val}%
        </Tag>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="report_sales" />
      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        <Content className="mt-16 p-5 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
          {/* Header Section - Enterprise Standard */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-1">
                  Báo Cáo Bán Hàng
                </h1>
                <p className="text-sm text-gray-500">
                  Phân tích hiệu suất kinh doanh toàn diện
                </p>
              </div>
              <Space size="middle">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  className="border-gray-300 hover:border-green-400 hover:text-green-600 transition-all"
                >
                  Xuất Excel
                </Button>
                <Button
                  icon={<SyncOutlined spin={loading} />}
                  onClick={handleFilter}
                  className="border-gray-300 hover:border-blue-400 transition-all"
                >
                  Làm mới
                </Button>
              </Space>
            </div>

            {/* Quick Filter Buttons - Enterprise Pattern */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-600 mr-2">Khoảng thời gian:</span>
                <Button
                  size="small"
                  type={quickFilter === 'today' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('today')}
                  className="rounded-lg"
                >
                  Hôm nay
                </Button>
                <Button
                  size="small"
                  type={quickFilter === 'yesterday' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('yesterday')}
                  className="rounded-lg"
                >
                  Hôm qua
                </Button>
                <Button
                  size="small"
                  type={quickFilter === 'week' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('week')}
                  className="rounded-lg"
                >
                  7 ngày qua
                </Button>
                <Button
                  size="small"
                  type={quickFilter === 'month' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('month')}
                  className="rounded-lg"
                >
                  Tháng này
                </Button>
                <Button
                  size="small"
                  type={quickFilter === 'quarter' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('quarter')}
                  className="rounded-lg"
                >
                  Quý này
                </Button>
                <Button
                  size="small"
                  type={quickFilter === 'year' ? 'primary' : 'default'}
                  onClick={() => applyQuickFilter('year')}
                  className="rounded-lg"
                >
                  Năm nay
                </Button>
              </div>
            </div>

            {/* Advanced Filter Bar */}
            <Card className="shadow-sm border-0 bg-white">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Tùy chỉnh:</span>
                  <RangePicker
                    value={dateRange}
                    format="DD/MM/YYYY"
                    onChange={(dates) => {
                      setDateRange(dates)
                      setQuickFilter(null)
                    }}
                    className="rounded-lg"
                    placeholder={['Từ ngày', 'Đến ngày']}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FilterOutlined className="text-gray-500" />
                  <Select
                    value={categoryFilter}
                    style={{ width: 200 }}
                    onChange={setCategoryFilter}
                    className="rounded-lg"
                  >
                    <Option value="all">📋 Tất cả loại món</Option>
                    <Option value="Món chính">🍜 Món chính</Option>
                    <Option value="Đồ uống">☕ Đồ uống</Option>
                    <Option value="Khai vị">🥗 Khai vị</Option>
                  </Select>
                </div>
                <Button
                  type="primary"
                  onClick={handleFilter}
                  loading={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 rounded-lg px-6 hover:shadow-lg transition-all"
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </Card>
          </div>

          {/* Loading State */}
          {loading ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : filteredSales.length === 0 ? (
            /* Empty State */
            <Card className="text-center py-16">
              <Empty
                description={
                  <span className="text-gray-500">
                    Không có dữ liệu trong khoảng thời gian đã chọn
                  </span>
                }
              />
            </Card>
          ) : (
            <>
              {/* KPI Cards - Enterprise Grid */}
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl">
                    <Statistic
                      title={<span className="text-blue-100 text-xs font-medium">Tổng Doanh Thu</span>}
                      value={totalRevenue}
                      precision={0}
                      valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                      formatter={(value) => value.toLocaleString()}
                    />
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      {isGrowthPositive ? (
                        <>
                          <RiseOutlined className="text-green-300" />
                          <span className="text-green-100">+{revenueGrowth}% so với kỳ trước</span>
                        </>
                      ) : (
                        <>
                          <FallOutlined className="text-red-300" />
                          <span className="text-red-100">{revenueGrowth}% so với kỳ trước</span>
                        </>
                      )}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl">
                    <Statistic
                      title={<span className="text-emerald-100 text-xs font-medium">Lợi Nhuận</span>}
                      value={totalProfit}
                      precision={0}
                      valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                      prefix={<TrophyOutlined />}
                      suffix="đ"
                      formatter={(value) => value.toLocaleString()}
                    />
                    <div className="mt-3 text-xs text-emerald-100">
                      Tỷ suất: <strong className="text-white">{profitMargin}%</strong>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl">
                    <Statistic
                      title={<span className="text-orange-100 text-xs font-medium">Tổng Đơn Hàng</span>}
                      value={totalOrders}
                      valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                      prefix={<ShoppingCartOutlined />}
                      suffix="món"
                    />
                    <div className="mt-3 text-xs text-orange-100">
                      Giá trị TB: <strong className="text-white">{avgOrderValue.toLocaleString()}đ</strong>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl">
                    <Statistic
                      title={<span className="text-purple-100 text-xs font-medium">Món Bán Chạy Nhất</span>}
                      value={topProducts[0]?.product || '—'}
                      valueStyle={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}
                      prefix={<FireOutlined />}
                    />
                    <div className="mt-3 text-xs text-purple-100">
                      Số lượng: <strong className="text-white">{topProducts[0]?.quantity.toLocaleString() || 0}</strong>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Charts Section */}
              <Row gutter={[16, 16]} className="mb-6">
                {/* Revenue Trend */}
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <ThunderboltOutlined className="text-blue-600" />
                        <span className="font-semibold text-gray-800">Xu Hướng Doanh Thu</span>
                      </div>
                    }
                    className="border-0 shadow-md rounded-xl h-full"
                    bodyStyle={{ padding: '24px' }}
                  >
                    <Line
                      data={trendData}
                      xField="date"
                      yField="revenue"
                      smooth
                      color="#3b82f6"
                      lineStyle={{
                        lineWidth: 3
                      }}
                      point={{
                        size: 5,
                        shape: 'circle',
                        style: {
                          fill: '#3b82f6',
                          stroke: '#fff',
                          lineWidth: 2
                        }
                      }}
                      xAxis={{
                        label: {
                          formatter: (v) => dayjs(v).format('DD/MM'),
                          style: {
                            fill: '#6b7280',
                            fontSize: 11
                          }
                        }
                      }}
                      yAxis={{
                        label: {
                          formatter: (v) => `${(v / 1000000).toFixed(1)}M`,
                          style: {
                            fill: '#6b7280',
                            fontSize: 11
                          }
                        }
                      }}
                      tooltip={{
                        formatter: (datum) => ({
                          name: 'Doanh thu',
                          value: `${datum.revenue.toLocaleString()}đ`
                        })
                      }}
                      animation={{
                        appear: {
                          animation: 'path-in',
                          duration: 1000
                        }
                      }}
                    />
                  </Card>
                </Col>

                {/* Category Revenue */}
                <Col xs={24} lg={8}>
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <TrophyOutlined className="text-emerald-600" />
                        <span className="font-semibold text-gray-800">Doanh Thu Theo Loại Món</span>
                      </div>
                    }
                    className="border-0 shadow-md rounded-xl h-full"
                    bodyStyle={{ padding: '24px' }}
                  >
                    <Bar
                      data={categoryData}
                      xField="revenue"
                      yField="category"
                      seriesField="category"
                      color={({ category }) => {
                        const colors = {
                          'Món chính': '#3b82f6',
                          'Đồ uống': '#10b981',
                          'Khai vị': '#f59e0b'
                        }
                        return colors[category] || '#6b7280'
                      }}
                      label={{
                        position: 'right',
                        formatter: ({ revenue }) => `${(revenue / 1000000).toFixed(1)}M`,
                        style: {
                          fill: '#374151',
                          fontSize: 11,
                          fontWeight: 'bold'
                        }
                      }}
                      xAxis={{
                        label: {
                          formatter: (v) => `${(v / 1000000).toFixed(0)}M`,
                          style: {
                            fill: '#6b7280',
                            fontSize: 11
                          }
                        }
                      }}
                      yAxis={{
                        label: {
                          style: {
                            fill: '#374151',
                            fontSize: 12,
                            fontWeight: 500
                          }
                        }
                      }}
                      animation={{
                        appear: {
                          animation: 'scale-in-x',
                          duration: 800
                        }
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Tables Section */}
              <Row gutter={[16, 16]}>
                {/* Top Products */}
                <Col xs={24} lg={14}>
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <FireOutlined className="text-orange-600" />
                        <span className="font-semibold text-gray-800">Top 10 Món Bán Chạy Nhất</span>
                      </div>
                    }
                    className="border-0 shadow-md rounded-xl"
                  >
                    <Table
                      columns={topProductColumns}
                      dataSource={topProducts}
                      pagination={false}
                      rowKey="product"
                      bordered={false}
                      size="small"
                      className="custom-table"
                      rowClassName={(record, index) =>
                        index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                      }
                    />
                  </Card>
                </Col>

                {/* Category Summary */}
                <Col xs={24} lg={10}>
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <DollarOutlined className="text-green-600" />
                        <span className="font-semibold text-gray-800">Tổng Hợp Theo Loại Món</span>
                      </div>
                    }
                    className="border-0 shadow-md rounded-xl"
                  >
                    <Table
                      columns={categoryColumns}
                      dataSource={categoryData}
                      pagination={false}
                      rowKey="category"
                      bordered={false}
                      size="small"
                      rowClassName={(record, index) =>
                        index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                      }
                    />
                  </Card>
                </Col>
              </Row>

              {/* Custom CSS for table styling */}
              <style>{`
            .custom-table .ant-table-thead > tr > th {
              background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
              border-bottom: 2px solid #e5e7eb;
              font-weight: 600;
              padding: 12px 16px;
            }
            .custom-table .ant-table-tbody > tr > td {
              padding: 12px 16px;
              transition: all 0.2s ease;
            }
            .custom-table .ant-table-tbody > tr:hover > td {
              background: #f0f9ff !important;
            }
          `}</style>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default ReportsSalesPage
