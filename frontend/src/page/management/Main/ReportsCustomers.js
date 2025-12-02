import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import * as reportCustomersService from '../../../services/reportCustomersService'
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Spin,
  Segmented,
  message
} from 'antd'
import {
  Users,
  UserCheck,
  TrendingUp,
  Award,
  Download,
  RefreshCw
} from 'react-feather'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts'
import * as XLSX from 'xlsx'

const { Content } = Layout
const { Title, Text } = Typography

dayjs.extend(isBetween)

const ReportsCustomerPage = () => {
  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Báo Cáo Khách Hàng')

  // Date Range State
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, 'day').startOf('day'),
    dayjs().endOf('day')
  ])

  // Loading States
  const [loading, setLoading] = useState(false)

  // Data States - Loyalty
  const [loyaltyData, setLoyaltyData] = useState([])
  const [topCustomersData, setTopCustomersData] = useState([])
  const [pointDistributionData, setPointDistributionData] = useState([])

  // Summary Metrics from API
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRegistrations: 0,
    totalPointsIssued: 0,
    totalOrders: 0,
    participationRate: 0,
    avgPointsPerCustomer: 0,
    growth: {
      registrations: 0,
      pointsIssued: 0,
      participationRate: 0
    }
  })

  // Chart Configuration
  const [chartType, setChartType] = useState('line') // line, bar
  const [viewMode, setViewMode] = useState('registrations') // registrations, points, participation
  const [topLimit, setTopLimit] = useState(5) // 5, 8, 10

  // ==================== DATA FETCHING ====================
  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [start, end] = dateRange

      // Fetch all data in parallel
      const [trendResponse, topCustomersResponse, distributionResponse] = await Promise.all([
        reportCustomersService.getLoyaltyTrend(start, end),
        reportCustomersService.getTopCustomers(10, start, end),
        reportCustomersService.getPointDistribution()
      ])

      // Process trend data
      if (trendResponse.success) {
        const { trend, summary } = trendResponse.data
        setLoyaltyData(trend)
        setSummaryMetrics(summary)
      }

      // Process top customers
      if (topCustomersResponse.success) {
        setTopCustomersData(topCustomersResponse.data)
      }

      // Process point distribution
      if (distributionResponse.success) {
        setPointDistributionData(distributionResponse.data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      message.error('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  const handleRefresh = async () => {
    await fetchReportData()
    message.success('Đã làm mới dữ liệu')
  }

  // ====== Calculations ======
  // Use summary metrics from API
  const totalRegistrations = summaryMetrics.totalRegistrations || 0
  const totalPointsIssued = summaryMetrics.totalPointsIssued || 0
  const participationRate = summaryMetrics.participationRate || 0
  const avgPointsPerCustomer = summaryMetrics.avgPointsPerCustomer || 0

  // Pie chart data - Point distribution from API
  const pieData = pointDistributionData.map(item => ({
    range: item.range,
    value: item.count
  }))

  // Line/Bar chart data - from API
  const trendData = loyaltyData.map(d => ({
    date: d.date,
    registrations: d.registrations,
    points: d.pointsIssued,
    participation: parseFloat(d.participationRate)
  }))

  // Top customers - filter by topLimit
  const topCustomers = topCustomersData.slice(0, topLimit)

  // Pie chart colors
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']

  // ====== Export Excel ======
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new()
      const [start, end] = dateRange

      // ========== HELPER STYLES ==========

      // Style cho header
      const headerStyle = {
        fill: { fgColor: { rgb: '1890FF' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }

      // Style cho data cell
      const dataCellStyle = {
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
          left: { style: 'thin', color: { rgb: 'D9D9D9' } },
          right: { style: 'thin', color: { rgb: 'D9D9D9' } }
        }
      }

      // Style cho text cell
      const textCellStyle = {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
          left: { style: 'thin', color: { rgb: 'D9D9D9' } },
          right: { style: 'thin', color: { rgb: 'D9D9D9' } }
        }
      }

      // Style cho total row
      const totalCellStyle = {
        fill: { fgColor: { rgb: 'F0F0F0' } },
        font: { bold: true, sz: 11 },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }

      // ========== 1️⃣ SHEET "TOP KHÁCH HÀNG TÍCH ĐIỂM" ==========

      const customerHeaders = ['STT', 'Tên khách hàng', 'Số điện thoại', 'Tổng điểm', 'Điểm trong kỳ', 'Số lần ghé', 'Lần ghé gần nhất']

      const customerDataRows = topCustomers.map((c, index) => {
        const totalPoints = c.points || 0
        const pointsInPeriod = c.pointsInPeriod || 0
        const visits = c.visits || 0

        return [
          index + 1,
          c.name || 'Khách hàng ẩn danh',
          c.phone || '',
          totalPoints,
          pointsInPeriod,
          visits,
          c.lastVisit ? dayjs(c.lastVisit).format('DD/MM/YYYY HH:mm') : 'Chưa có'
        ]
      })

      // Calculate totals
      const customerTotals = [
        '',
        'Tổng cộng',
        `${customerDataRows.length} khách hàng`,
        customerDataRows.reduce((sum, row) => sum + row[3], 0),
        customerDataRows.reduce((sum, row) => sum + row[4], 0),
        customerDataRows.reduce((sum, row) => sum + row[5], 0),
        ''
      ]

      // Create worksheet data
      const customerWsData = [
        // Title row
        [{ v: `TOP ${topLimit} KHÁCH HÀNG TÍCH ĐIỂM (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
        [], // Empty row
        // Header row
        customerHeaders,
        // Data rows
        ...customerDataRows,
        // Total row
        customerTotals
      ]

      const customerWs = XLSX.utils.aoa_to_sheet(customerWsData)

      // Merge title cell
      customerWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ]

      // Apply styles - Title
      customerWs['A1'].s = {
        fill: { fgColor: { rgb: '722ED1' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      // Headers (row 3)
      const customerHeaderStyle = {
        ...headerStyle,
        fill: { fgColor: { rgb: '722ED1' } }
      }

      customerHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
        if (!customerWs[cellRef]) customerWs[cellRef] = { t: 's', v: '' }
        customerWs[cellRef].s = customerHeaderStyle
      })

      // Data cells
      customerDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
          if (!customerWs[cellRef]) customerWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

          if (colIdx === 0) {
            // STT - center align
            customerWs[cellRef].s = textCellStyle
          } else if (colIdx === 1 || colIdx === 2 || colIdx === 6) {
            // Tên, SĐT, Lần ghé gần nhất - left/center align
            customerWs[cellRef].s = {
              alignment: { horizontal: colIdx === 2 || colIdx === 6 ? 'center' : 'left', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'D9D9D9' } },
                bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
                left: { style: 'thin', color: { rgb: 'D9D9D9' } },
                right: { style: 'thin', color: { rgb: 'D9D9D9' } }
              }
            }
          } else {
            // Number columns (3,4,5) - right align
            customerWs[cellRef].s = dataCellStyle
            if (typeof val === 'number') {
              customerWs[cellRef].z = '#,##0'
            }
          }
        })
      })

      // Total row
      const customerTotalRowIdx = customerDataRows.length + 3
      customerTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: customerTotalRowIdx, c: colIdx })
        if (!customerWs[cellRef]) customerWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
        customerWs[cellRef].s = totalCellStyle
        if (typeof val === 'number') {
          customerWs[cellRef].z = '#,##0'
        }
      })

      // Set column widths
      customerWs['!cols'] = [
        { wch: 6 },  // STT
        { wch: 25 }, // Tên khách hàng
        { wch: 15 }, // Số điện thoại
        { wch: 14 }, // Tổng điểm
        { wch: 14 }, // Điểm trong kỳ
        { wch: 12 }, // Số lần ghé
        { wch: 20 }  // Lần ghé gần nhất
      ]

      // Set row heights
      customerWs['!rows'] = [
        { hpt: 30 }, // Title row
        { hpt: 5 },  // Empty row
        { hpt: 25 }  // Header row
      ]

      XLSX.utils.book_append_sheet(wb, customerWs, 'Top khách hàng')

      // ========== 2️⃣ SHEET "PHÂN BỔ ĐIỂM TÍCH LŨY" ==========

      const distributionHeaders = ['STT', 'Khoảng điểm', 'Số khách hàng', 'Tỷ lệ (%)']

      const distributionDataRows = pointDistributionData.map((item, index) => [
        index + 1,
        item.range,
        item.count || 0,
        parseFloat(item.percentage || 0)
      ])

      // Calculate totals
      const distributionTotals = [
        '',
        'Tổng cộng',
        distributionDataRows.reduce((sum, row) => sum + row[2], 0),
        100.0
      ]

      // Create worksheet data
      const distributionWsData = [
        // Title row
        [{ v: `PHÂN BỔ ĐIỂM TÍCH LŨY THEO KHOẢNG (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
        [], // Empty row
        // Header row
        distributionHeaders,
        // Data rows
        ...distributionDataRows,
        // Total row
        distributionTotals
      ]

      const distributionWs = XLSX.utils.aoa_to_sheet(distributionWsData)

      // Merge title cell
      distributionWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
      ]

      // Apply styles - Title
      distributionWs['A1'].s = {
        fill: { fgColor: { rgb: '52C41A' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      // Headers (row 3)
      const distributionHeaderStyle = {
        ...headerStyle,
        fill: { fgColor: { rgb: '52C41A' } }
      }

      distributionHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
        if (!distributionWs[cellRef]) distributionWs[cellRef] = { t: 's', v: '' }
        distributionWs[cellRef].s = distributionHeaderStyle
      })

      // Data cells
      distributionDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
          if (!distributionWs[cellRef]) distributionWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

          if (colIdx === 0 || colIdx === 1) {
            // STT, Khoảng điểm - center align
            distributionWs[cellRef].s = textCellStyle
          } else {
            // Number columns - right align
            distributionWs[cellRef].s = dataCellStyle
            if (typeof val === 'number') {
              distributionWs[cellRef].z = colIdx === 3 ? '#,##0.0' : '#,##0'
            }
          }
        })
      })

      // Total row
      const distributionTotalRowIdx = distributionDataRows.length + 3
      distributionTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: distributionTotalRowIdx, c: colIdx })
        if (!distributionWs[cellRef]) distributionWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
        distributionWs[cellRef].s = totalCellStyle
        if (typeof val === 'number') {
          distributionWs[cellRef].z = colIdx === 3 ? '#,##0.0' : '#,##0'
        }
      })

      // Set column widths
      distributionWs['!cols'] = [
        { wch: 6 },  // STT
        { wch: 18 }, // Khoảng điểm
        { wch: 18 }, // Số khách hàng
        { wch: 14 }  // Tỷ lệ
      ]

      // Set row heights
      distributionWs['!rows'] = [
        { hpt: 30 }, // Title row
        { hpt: 5 },  // Empty row
        { hpt: 25 }  // Header row
      ]

      XLSX.utils.book_append_sheet(wb, distributionWs, 'Phân bổ điểm')

      // File name
      const fileName = `BaoCaoTichDiem_${start.format('DDMMYYYY')}_${end.format('DDMMYYYY')}.xlsx`
      XLSX.writeFile(wb, fileName)

      message.success('Xuất báo cáo thành công!')
    } catch (error) {
      message.error('Có lỗi xảy ra khi xuất báo cáo')
      console.error('Export error:', error)
    }
  }

  // ====== Metric Card Component ======
  const MetricCard = ({ icon: Icon, title, value, trend, trendLabel, valueSize = 'large', suffix = '' }) => {
    const isPositive = trend >= 0
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
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp
                size={14}
                strokeWidth={2.5}
                color={isPositive ? '#52c41a' : '#ff4d4f'}
                style={{ transform: isPositive ? 'none' : 'rotate(180deg)' }}
              />
              <Text className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{trend}%
              </Text>
              {trendLabel && (
                <Text className="text-xs text-gray-400">{trendLabel}</Text>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="report_customers" />

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
                Báo Cáo Tích Điểm Khách Hàng
              </Title>
              <Text className="text-gray-500">
                Phân tích chương trình khách hàng thân thiết và tích điểm
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
          <Spin spinning={loading}>
            <Row gutter={[20, 20]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={Users}
                  title="Lượt tích điểm"
                  value={totalRegistrations.toLocaleString()}
                  trend={parseFloat(summaryMetrics.growth?.registrations || 0)}
                  trendLabel=""
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={Award}
                  title="Điểm đã cấp"
                  value={totalPointsIssued.toLocaleString()}
                  trend={parseFloat(summaryMetrics.growth?.pointsIssued || 0)}
                  trendLabel=""
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={UserCheck}
                  title="Tỷ lệ tham gia"
                  value={participationRate}
                  suffix="%"
                  trend={parseFloat(summaryMetrics.growth?.participationRate || 0)}
                  trendLabel=""
                  valueSize="large"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <MetricCard
                  icon={TrendingUp}
                  title="TB điểm/khách"
                  value={avgPointsPerCustomer}
                  suffix=" điểm"
                  valueSize="large"
                />
              </Col>
            </Row>

            {/* Charts Section */}
            <Row gutter={[20, 20]} className="mb-6">
              {/* Line/Bar Chart - Customer Trend */}
              <Col xs={24} xl={14}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <TrendingUp size={20} strokeWidth={2.5} color="#1890ff" />
                        </div>
                        <div>
                          <Text strong className="text-base text-gray-800 block leading-tight">
                            Xu Hướng Tích Điểm
                          </Text>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Segmented
                          value={viewMode}
                          onChange={setViewMode}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Lượt đăng ký</span>
                              </div>,
                              value: 'registrations'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Điểm cấp</span>
                              </div>,
                              value: 'points'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-2">
                                <span className="text-xs font-medium">Tỷ lệ %</span>
                              </div>,
                              value: 'participation'
                            }
                          ]}
                          size="middle"
                          className="bg-gray-50 rounded-lg p-0.5"
                        />

                        <Segmented
                          value={chartType}
                          onChange={setChartType}
                          options={[
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Đường</span>
                              </div>,
                              value: 'line'
                            },
                            {
                              label: <div className="flex items-center gap-1.5 py-1 px-3">
                                <span className="text-xs font-medium">Cột</span>
                              </div>,
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
                  <ResponsiveContainer width="100%" height={400}>
                    {chartType === 'line' ? (
                      <LineChart data={trendData}>
                        <defs>
                          <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1890ff" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#1890ff" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#52c41a" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#52c41a" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => dayjs(value).format('DD/MM')}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => {
                            if (viewMode === 'points') return value.toLocaleString()
                            if (viewMode === 'participation') return `${value}%`
                            return value
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                          formatter={(value, name) => {
                            if (viewMode === 'registrations') return [value.toLocaleString() + ' lượt', 'Đăng ký tích điểm']
                            if (viewMode === 'points') return [value.toLocaleString() + ' điểm', 'Điểm đã cấp']
                            if (viewMode === 'participation') return [value + '%', 'Tỷ lệ tham gia']
                            return [value, name]
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={viewMode}
                          stroke="#1890ff"
                          strokeWidth={2.5}
                          dot={{ fill: '#1890ff', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => dayjs(value).format('DD/MM')}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#8c8c8c' }}
                          stroke="#e8e8e8"
                          tickLine={false}
                          axisLine={{ stroke: '#e8e8e8' }}
                          tickFormatter={(value) => {
                            if (viewMode === 'points') return value.toLocaleString()
                            if (viewMode === 'participation') return `${value}%`
                            return value
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            padding: '16px'
                          }}
                          labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                          formatter={(value, name) => {
                            if (viewMode === 'registrations') return [value.toLocaleString() + ' lượt', 'Đăng ký tích điểm']
                            if (viewMode === 'points') return [value.toLocaleString() + ' điểm', 'Điểm đã cấp']
                            if (viewMode === 'participation') return [value + '%', 'Tỷ lệ tham gia']
                            return [value, name]
                          }}
                        />
                        <Bar
                          dataKey={viewMode}
                          fill="#1890ff"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Card>
              </Col>

              {/* Pie Chart - Customer Ratio */}
              <Col xs={24} xl={10}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center gap-2 py-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                        <Users size={20} strokeWidth={2.5} color="#52c41a" />
                      </div>
                      <div>
                        <Text strong className="text-base text-gray-800 block leading-tight">
                          Phân Bổ Điểm Tích Lũy
                        </Text>

                      </div>
                    </div>
                  }
                  bodyStyle={{ padding: '24px' }}
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        {pieData.map((_, index) => (
                          <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} />
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
                        formatter={(value, name, props) => [value.toLocaleString() + ' khách', props.payload.range]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Point Distribution Details */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 gap-3">
                      {pieData.map((item, index) => {
                        const totalCustomers = pieData.reduce((sum, p) => sum + p.value, 0)
                        const percentage = totalCustomers > 0
                          ? ((item.value / totalCustomers) * 100).toFixed(1)
                          : 0
                        return (
                          <div key={item.range} className="p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    background: COLORS[index % COLORS.length]
                                  }}
                                />
                                <Text strong className="text-sm">{item.range} điểm</Text>
                              </div>
                              <div className="flex items-center gap-3">
                                <Text className="text-xs text-gray-500">{percentage}%</Text>
                                <Text strong className="text-sm">{item.value} khách</Text>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Top Customers Section */}
            <Row gutter={[20, 20]}>
              <Col xs={24}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                          <Award size={20} strokeWidth={2.5} color="#722ed1" />
                        </div>
                        <div>
                          <Text strong className="text-base text-gray-800 block leading-tight">
                            Top Khách Hàng Tích Điểm
                          </Text>

                        </div>
                      </div>

                      <Segmented
                        value={topLimit}
                        onChange={setTopLimit}
                        options={[
                          {
                            label: <div className="flex items-center gap-1.5 py-1 px-3">
                              <span className="text-xs font-medium">Top 5</span>
                            </div>,
                            value: 5
                          },
                          {
                            label: <div className="flex items-center gap-1.5 py-1 px-3">
                              <span className="text-xs font-medium">Top 8</span>
                            </div>,
                            value: 8
                          },
                          {
                            label: <div className="flex items-center gap-1.5 py-1 px-3">
                              <span className="text-xs font-medium">Tất cả</span>
                            </div>,
                            value: 10
                          }
                        ]}
                        size="middle"
                        className="bg-gray-50 rounded-lg p-0.5"
                      />
                    </div>
                  }
                  bodyStyle={{ padding: '24px' }}
                >
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topCustomers} layout="vertical">
                      <defs>
                        <linearGradient id="topCustomerGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#722ed1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#9254de" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          padding: '16px',
                          fontSize: '12px'
                        }}
                        formatter={(value, name, props) => {
                          const customer = props.payload
                          return [
                            <div key="tooltip">
                              <div><strong>SĐT:</strong> {customer.phone}</div>
                              <div><strong>Điểm:</strong> {customer.points.toLocaleString()}</div>
                              <div><strong>Lượt ghé:</strong> {customer.visits}</div>
                              <div><strong>Ghé gần nhất:</strong> {customer.lastVisit ? dayjs(customer.lastVisit).format('DD/MM/YYYY HH:mm') : 'Chưa có'}</div>
                            </div>
                          ]
                        }}
                        cursor={{ fill: 'rgba(114, 46, 209, 0.05)' }}
                      />
                      <Bar
                        dataKey="points"
                        fill="url(#topCustomerGradient)"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  )
}

export default ReportsCustomerPage
