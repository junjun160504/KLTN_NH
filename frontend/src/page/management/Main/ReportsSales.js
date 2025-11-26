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
          revenueQrBanking: item.revenueQrBanking || 0,
          revenueCash: item.revenueCash || 0,
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

  // ==================== EXPORT FUNCTION ====================
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new()
      const [start, end] = dateRange
      const rangeInDays = end.diff(start, 'day') + 1

      // ========== HELPER FUNCTIONS ==========

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

      // Style cho text cell (STT, Ngày, Tháng)
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

      // ========== 1️⃣ SHEET "DOANH THU THEO NGÀY" ==========

      const dailyHeaders = ['STT', 'Ngày', 'Số hóa đơn', 'Doanh thu (VNĐ)', 'Doanh thu QR Banking', 'Doanh thu Tiền mặt', 'Khách hàng', 'TB/đơn']

      const dailyDataRows = businessTrendData.map((item, index) => [
        index + 1,
        dayjs(item.date).format('DD/MM/YYYY'),
        item.orders || 0,
        Math.floor(item.revenue || 0),
        Math.floor(item.revenueQrBanking || 0),
        Math.floor(item.revenueCash || 0),
        item.customers || 0,
        Math.floor(item.avgOrderValue || 0)
      ])

      // Calculate totals
      const dailyTotals = [
        '',
        'Tổng cộng',
        dailyDataRows.reduce((sum, row) => sum + row[2], 0),
        dailyDataRows.reduce((sum, row) => sum + row[3], 0),
        dailyDataRows.reduce((sum, row) => sum + row[4], 0),
        dailyDataRows.reduce((sum, row) => sum + row[5], 0),
        dailyDataRows.reduce((sum, row) => sum + row[6], 0),
        ''
      ]

      // Create worksheet data
      const dailyWsData = [
        // Title row
        [{ v: `BÁO CÁO DOANH THU THEO NGÀY (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
        [], // Empty row
        // Header row
        dailyHeaders,
        // Data rows
        ...dailyDataRows,
        // Total row
        dailyTotals
      ]

      const dailyWs = XLSX.utils.aoa_to_sheet(dailyWsData)

      // Merge title cell
      dailyWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } } // Merge title across all columns
      ]

      // Apply styles
      // Title
      dailyWs['A1'].s = {
        fill: { fgColor: { rgb: '1890FF' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      // Headers (row 3)
      dailyHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
        if (!dailyWs[cellRef]) dailyWs[cellRef] = { t: 's', v: '' }
        dailyWs[cellRef].s = headerStyle
      })

      // Data cells
      dailyDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
          if (!dailyWs[cellRef]) dailyWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

          // Apply style based on column type
          if (colIdx === 0 || colIdx === 1 || colIdx === 6) {
            // STT, Ngày, Khách hàng - center align
            dailyWs[cellRef].s = textCellStyle
          } else {
            // Number columns - right align
            dailyWs[cellRef].s = dataCellStyle
            // Format as number with thousand separator
            if (typeof val === 'number') {
              dailyWs[cellRef].z = '#,##0'
            }
          }
        })
      })

      // Total row
      const totalRowIdx = dailyDataRows.length + 3
      dailyTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c: colIdx })
        if (!dailyWs[cellRef]) dailyWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
        dailyWs[cellRef].s = totalCellStyle
        if (typeof val === 'number') {
          dailyWs[cellRef].z = '#,##0'
        }
      })

      // Set column widths
      dailyWs['!cols'] = [
        { wch: 6 },  // STT
        { wch: 12 }, // Ngày
        { wch: 14 }, // Số hóa đơn
        { wch: 18 }, // Doanh thu
        { wch: 22 }, // Doanh thu QR Banking
        { wch: 20 }, // Doanh thu Tiền mặt
        { wch: 14 }, // Khách hàng
        { wch: 12 }  // TB/đơn
      ]

      // Set row heights
      dailyWs['!rows'] = [
        { hpt: 30 }, // Title row
        { hpt: 5 },  // Empty row
        { hpt: 25 }  // Header row
      ]

      XLSX.utils.book_append_sheet(wb, dailyWs, 'Doanh thu theo ngày')

      // ========== 2️⃣ SHEET "DOANH THU THEO THÁNG" ==========
      if (rangeInDays >= 30) {
        // Aggregate data by month
        const monthlyMap = {}

        businessTrendData.forEach(item => {
          const monthKey = dayjs(item.date).format('MM/YYYY')

          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = {
              orders: 0,
              revenue: 0,
              qrBanking: 0,
              cash: 0,
              customers: 0
            }
          }

          monthlyMap[monthKey].orders += item.orders || 0
          monthlyMap[monthKey].revenue += item.revenue || 0
          monthlyMap[monthKey].qrBanking += item.revenueQrBanking || 0
          monthlyMap[monthKey].cash += item.revenueCash || 0
          monthlyMap[monthKey].customers += item.customers || 0
        })

        const monthlyHeaders = ['STT', 'Tháng', 'Số hóa đơn', 'Doanh thu (VNĐ)', 'Doanh thu QR Banking', 'Doanh thu Tiền mặt', 'Khách hàng', 'TB/đơn']

        const monthlyDataRows = Object.entries(monthlyMap).map(([month, data], index) => [
          index + 1,
          month,
          data.orders,
          Math.floor(data.revenue),
          Math.floor(data.qrBanking),
          Math.floor(data.cash),
          data.customers,
          data.orders > 0 ? Math.floor(data.revenue / data.orders) : 0
        ])

        // Calculate totals
        const monthlyTotals = [
          '',
          'Tổng cộng',
          monthlyDataRows.reduce((sum, row) => sum + row[2], 0),
          monthlyDataRows.reduce((sum, row) => sum + row[3], 0),
          monthlyDataRows.reduce((sum, row) => sum + row[4], 0),
          monthlyDataRows.reduce((sum, row) => sum + row[5], 0),
          monthlyDataRows.reduce((sum, row) => sum + row[6], 0),
          ''
        ]

        // Create worksheet data
        const monthlyWsData = [
          // Title row
          [{ v: `BÁO CÁO DOANH THU THEO THÁNG (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
          [], // Empty row
          // Header row
          monthlyHeaders,
          // Data rows
          ...monthlyDataRows,
          // Total row
          monthlyTotals
        ]

        const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyWsData)

        // Merge title cell
        monthlyWs['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
        ]

        // Apply styles - Title
        monthlyWs['A1'].s = {
          fill: { fgColor: { rgb: '52C41A' } },
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' }
        }

        // Headers (row 3)
        const monthlyHeaderStyle = {
          ...headerStyle,
          fill: { fgColor: { rgb: '52C41A' } }
        }

        monthlyHeaders.forEach((_, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
          if (!monthlyWs[cellRef]) monthlyWs[cellRef] = { t: 's', v: '' }
          monthlyWs[cellRef].s = monthlyHeaderStyle
        })

        // Data cells
        monthlyDataRows.forEach((row, rowIdx) => {
          row.forEach((val, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
            if (!monthlyWs[cellRef]) monthlyWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

            if (colIdx === 0 || colIdx === 1 || colIdx === 6) {
              monthlyWs[cellRef].s = textCellStyle
            } else {
              monthlyWs[cellRef].s = dataCellStyle
              if (typeof val === 'number') {
                monthlyWs[cellRef].z = '#,##0'
              }
            }
          })
        })

        // Total row
        const monthlyTotalRowIdx = monthlyDataRows.length + 3
        monthlyTotals.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: monthlyTotalRowIdx, c: colIdx })
          if (!monthlyWs[cellRef]) monthlyWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
          monthlyWs[cellRef].s = totalCellStyle
          if (typeof val === 'number') {
            monthlyWs[cellRef].z = '#,##0'
          }
        })

        // Set column widths
        monthlyWs['!cols'] = [
          { wch: 6 },  // STT
          { wch: 12 }, // Tháng
          { wch: 14 }, // Số hóa đơn
          { wch: 18 }, // Doanh thu
          { wch: 22 }, // Doanh thu QR Banking
          { wch: 20 }, // Doanh thu Tiền mặt
          { wch: 14 }, // Khách hàng
          { wch: 12 }  // TB/đơn
        ]

        // Set row heights
        monthlyWs['!rows'] = [
          { hpt: 30 }, // Title row
          { hpt: 5 },  // Empty row
          { hpt: 25 }  // Header row
        ]

        XLSX.utils.book_append_sheet(wb, monthlyWs, 'Doanh thu theo tháng')
      }

      // ========== 3️⃣ SHEET "DOANH THU THEO MÓN" ==========

      const dishHeaders = ['STT', 'Tên món', 'Danh mục', 'Số lượng bán', 'Doanh thu (VNĐ)', 'Tăng trưởng (%)']

      const dishDataRows = dishRevenueData.map((item, index) => [
        index + 1,
        item.name,
        item.category || 'Chưa phân loại',
        item.quantity || 0,
        Math.floor(item.revenue || 0),
        item.growth || 0
      ])

      // Calculate totals for dishes
      const dishTotals = [
        '',
        'Tổng cộng',
        '',
        dishDataRows.reduce((sum, row) => sum + row[3], 0),
        dishDataRows.reduce((sum, row) => sum + row[4], 0),
        ''
      ]

      // Create worksheet data
      const dishWsData = [
        // Title row
        [{ v: `TOP ${dishLimit} MÓN CÓ DOANH THU CAO NHẤT (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
        [], // Empty row
        // Header row
        dishHeaders,
        // Data rows
        ...dishDataRows,
        // Total row
        dishTotals
      ]

      const dishWs = XLSX.utils.aoa_to_sheet(dishWsData)

      // Merge title cell
      dishWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
      ]

      // Apply styles - Title
      dishWs['A1'].s = {
        fill: { fgColor: { rgb: '722ED1' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      // Headers (row 3)
      const dishHeaderStyle = {
        fill: { fgColor: { rgb: '722ED1' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }

      dishHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
        if (!dishWs[cellRef]) dishWs[cellRef] = { t: 's', v: '' }
        dishWs[cellRef].s = dishHeaderStyle
      })

      // Data cells
      dishDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
          if (!dishWs[cellRef]) dishWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

          if (colIdx === 0 || colIdx === 1 || colIdx === 2) {
            // STT, Tên món, Danh mục - left/center align
            dishWs[cellRef].s = {
              alignment: { horizontal: colIdx === 0 ? 'center' : 'left', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'D9D9D9' } },
                bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
                left: { style: 'thin', color: { rgb: 'D9D9D9' } },
                right: { style: 'thin', color: { rgb: 'D9D9D9' } }
              }
            }
          } else {
            // Number columns - right align
            dishWs[cellRef].s = dataCellStyle
            if (typeof val === 'number') {
              dishWs[cellRef].z = colIdx === 5 ? '#,##0.0' : '#,##0' // Growth với 1 decimal
            }
          }
        })
      })

      // Total row
      const dishTotalRowIdx = dishDataRows.length + 3
      dishTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: dishTotalRowIdx, c: colIdx })
        if (!dishWs[cellRef]) dishWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
        dishWs[cellRef].s = totalCellStyle
        if (typeof val === 'number') {
          dishWs[cellRef].z = '#,##0'
        }
      })

      // Set column widths
      dishWs['!cols'] = [
        { wch: 6 },  // STT
        { wch: 30 }, // Tên món
        { wch: 18 }, // Danh mục
        { wch: 16 }, // Số lượng bán
        { wch: 20 }, // Doanh thu
        { wch: 16 }  // Tăng trưởng
      ]

      // Set row heights
      dishWs['!rows'] = [
        { hpt: 30 }, // Title row
        { hpt: 5 },  // Empty row
        { hpt: 25 }  // Header row
      ]

      XLSX.utils.book_append_sheet(wb, dishWs, 'Doanh thu theo món')

      // ========== 4️⃣ SHEET "DOANH THU THEO DANH MỤC" ==========

      const categoryHeaders = ['STT', 'Danh mục', 'Số món', 'Số lượng bán', 'Doanh thu (VNĐ)', 'Tỷ trọng (%)']

      const categoryDataRows = categoryRevenueData.map((item, index) => [
        index + 1,
        item.category || item.name,
        item.dishes || 0,
        item.quantity || 0,
        Math.floor(item.revenue || 0),
        parseFloat(item.percentOfTotal || 0)
      ])

      // Calculate totals for categories
      const categoryTotals = [
        '',
        'Tổng cộng',
        categoryDataRows.reduce((sum, row) => sum + row[2], 0),
        categoryDataRows.reduce((sum, row) => sum + row[3], 0),
        categoryDataRows.reduce((sum, row) => sum + row[4], 0),
        100.0 // Tổng tỷ trọng luôn = 100%
      ]

      // Create worksheet data
      const categoryWsData = [
        // Title row
        [{ v: `DOANH THU THEO DANH MỤC (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`, t: 's' }],
        [], // Empty row
        // Header row
        categoryHeaders,
        // Data rows
        ...categoryDataRows,
        // Total row
        categoryTotals
      ]

      const categoryWs = XLSX.utils.aoa_to_sheet(categoryWsData)

      // Merge title cell
      categoryWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
      ]

      // Apply styles - Title
      categoryWs['A1'].s = {
        fill: { fgColor: { rgb: 'FA8C16' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      // Headers (row 3)
      const categoryHeaderStyle = {
        fill: { fgColor: { rgb: 'FA8C16' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }

      categoryHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx })
        if (!categoryWs[cellRef]) categoryWs[cellRef] = { t: 's', v: '' }
        categoryWs[cellRef].s = categoryHeaderStyle
      })

      // Data cells
      categoryDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 3, c: colIdx })
          if (!categoryWs[cellRef]) categoryWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }

          if (colIdx === 0 || colIdx === 1) {
            // STT, Danh mục - center/left align
            categoryWs[cellRef].s = {
              alignment: { horizontal: colIdx === 0 ? 'center' : 'left', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'D9D9D9' } },
                bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
                left: { style: 'thin', color: { rgb: 'D9D9D9' } },
                right: { style: 'thin', color: { rgb: 'D9D9D9' } }
              }
            }
          } else {
            // Number columns - right align
            categoryWs[cellRef].s = dataCellStyle
            if (typeof val === 'number') {
              categoryWs[cellRef].z = colIdx === 5 ? '#,##0.0' : '#,##0' // Tỷ trọng với 1 decimal
            }
          }
        })
      })

      // Total row
      const categoryTotalRowIdx = categoryDataRows.length + 3
      categoryTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: categoryTotalRowIdx, c: colIdx })
        if (!categoryWs[cellRef]) categoryWs[cellRef] = { t: typeof val === 'number' ? 'n' : 's', v: val }
        categoryWs[cellRef].s = totalCellStyle
        if (typeof val === 'number') {
          categoryWs[cellRef].z = colIdx === 5 ? '#,##0.0' : '#,##0'
        }
      })

      // Set column widths
      categoryWs['!cols'] = [
        { wch: 6 },  // STT
        { wch: 25 }, // Danh mục
        { wch: 12 }, // Số món
        { wch: 16 }, // Số lượng bán
        { wch: 20 }, // Doanh thu
        { wch: 14 }  // Tỷ trọng
      ]

      // Set row heights
      categoryWs['!rows'] = [
        { hpt: 30 }, // Title row
        { hpt: 5 },  // Empty row
        { hpt: 25 }  // Header row
      ]

      XLSX.utils.book_append_sheet(wb, categoryWs, 'Doanh thu theo danh mục')

      // File name theo format: BaoCaoBanHang_DDMMYYYY_DDMMYYYY.xlsx
      const fileName = `BaoCaoBanHang_${start.format('DDMMYYYY')}_${end.format('DDMMYYYY')}.xlsx`
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
