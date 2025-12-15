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
import XLSX from 'xlsx-js-style'

const { Content } = Layout
const { Title, Text } = Typography


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

      // Common border style
      const thinBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }

      // Create worksheet with proper cell objects for styling
      const dailyWs = {}

      // Title row (row 0) - merged across all columns
      const titleText = `BÁO CÁO DOANH THU THEO NGÀY (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
      dailyWs['A1'] = {
        v: titleText,
        t: 's',
        s: {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: thinBorder
        }
      }
      // Fill empty merged cells with border
      for (let i = 1; i < dailyHeaders.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
        dailyWs[cellRef] = {
          v: '',
          t: 's',
          s: { border: thinBorder }
        }
      }

      // Header row (row 2, index 1 in Excel = row 2)
      dailyHeaders.forEach((header, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
        dailyWs[cellRef] = {
          v: header,
          t: 's',
          s: {
            fill: { fgColor: { rgb: 'D9E8FB' } },
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder
          }
        }
      })

      // Data rows (starting from row 3, index 2)
      dailyDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

          dailyWs[cellRef] = {
            v: val,
            t: typeof val === 'number' ? 'n' : 's',
            s: {
              alignment: {
                horizontal: colIdx === 0 ? 'center' : 'right',
                vertical: 'center'
              },
              border: thinBorder
            }
          }

          // Number format with thousand separator for money columns
          if (typeof val === 'number' && colIdx >= 3 && colIdx <= 5) {
            dailyWs[cellRef].z = '#,##0'
          }
          if (typeof val === 'number' && colIdx === 7) {
            dailyWs[cellRef].z = '#,##0'
          }
        })
      })

      // Total row
      const totalRowIdx = dailyDataRows.length + 2
      dailyTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c: colIdx })
        dailyWs[cellRef] = {
          v: val,
          t: typeof val === 'number' ? 'n' : 's',
          s: {
            fill: { fgColor: { rgb: 'F5F5F5' } },
            font: { bold: true, sz: 11 },
            alignment: {
              horizontal: colIdx === 1 ? 'center' : 'right',
              vertical: 'center'
            },
            border: thinBorder
          }
        }
        if (typeof val === 'number') {
          dailyWs[cellRef].z = '#,##0'
        }
      })

      // Set range for worksheet
      dailyWs['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: totalRowIdx, c: dailyHeaders.length - 1 }
      })

      // Merge title cell across all columns
      dailyWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: dailyHeaders.length - 1 } }
      ]

      // Set column widths
      dailyWs['!cols'] = [
        { wch: 6 },   // STT
        { wch: 12 },  // Ngày
        { wch: 12 },  // Số hóa đơn
        { wch: 18 },  // Doanh thu (VNĐ)
        { wch: 22 },  // Doanh thu QR Banking
        { wch: 20 },  // Doanh thu Tiền mặt
        { wch: 12 },  // Khách hàng
        { wch: 12 }   // TB/đơn
      ]

      // Set row heights
      const rowHeights = [{ hpt: 25 }] // Title row
      for (let i = 0; i <= dailyDataRows.length; i++) {
        rowHeights.push({ hpt: 22 })
      }
      dailyWs['!rows'] = rowHeights

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

        // Create worksheet with proper cell objects for styling
        const monthlyWs = {}

        // Title row (row 0) - merged across all columns
        const monthlyTitleText = `BÁO CÁO DOANH THU THEO THÁNG (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
        monthlyWs['A1'] = {
          v: monthlyTitleText,
          t: 's',
          s: {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder
          }
        }
        // Fill empty merged cells with border
        for (let i = 1; i < monthlyHeaders.length; i++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
          monthlyWs[cellRef] = {
            v: '',
            t: 's',
            s: { border: thinBorder }
          }
        }

        // Header row (row 2, index 1)
        monthlyHeaders.forEach((header, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
          monthlyWs[cellRef] = {
            v: header,
            t: 's',
            s: {
              fill: { fgColor: { rgb: 'D9E8FB' } },
              font: { bold: true, sz: 11 },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: thinBorder
            }
          }
        })

        // Data rows (starting from row 3, index 2)
        monthlyDataRows.forEach((row, rowIdx) => {
          row.forEach((val, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

            monthlyWs[cellRef] = {
              v: val,
              t: typeof val === 'number' ? 'n' : 's',
              s: {
                alignment: {
                  horizontal: colIdx === 0 ? 'center' : 'right',
                  vertical: 'center'
                },
                border: thinBorder
              }
            }

            // Number format with thousand separator for money columns
            if (typeof val === 'number' && colIdx >= 3 && colIdx <= 5) {
              monthlyWs[cellRef].z = '#,##0'
            }
            if (typeof val === 'number' && colIdx === 7) {
              monthlyWs[cellRef].z = '#,##0'
            }
          })
        })

        // Total row
        const monthlyTotalRowIdx = monthlyDataRows.length + 2
        monthlyTotals.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: monthlyTotalRowIdx, c: colIdx })
          monthlyWs[cellRef] = {
            v: val,
            t: typeof val === 'number' ? 'n' : 's',
            s: {
              fill: { fgColor: { rgb: 'F5F5F5' } },
              font: { bold: true, sz: 11 },
              alignment: {
                horizontal: colIdx === 1 ? 'center' : 'right',
                vertical: 'center'
              },
              border: thinBorder
            }
          }
          if (typeof val === 'number') {
            monthlyWs[cellRef].z = '#,##0'
          }
        })

        // Set range for worksheet
        monthlyWs['!ref'] = XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: monthlyTotalRowIdx, c: monthlyHeaders.length - 1 }
        })

        // Merge title cell across all columns
        monthlyWs['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: monthlyHeaders.length - 1 } }
        ]

        // Set column widths
        monthlyWs['!cols'] = [
          { wch: 6 },   // STT
          { wch: 12 },  // Tháng
          { wch: 12 },  // Số hóa đơn
          { wch: 18 },  // Doanh thu (VNĐ)
          { wch: 22 },  // Doanh thu QR Banking
          { wch: 20 },  // Doanh thu Tiền mặt
          { wch: 12 },  // Khách hàng
          { wch: 12 }   // TB/đơn
        ]

        // Set row heights
        const monthlyRowHeights = [{ hpt: 25 }] // Title row
        for (let i = 0; i <= monthlyDataRows.length; i++) {
          monthlyRowHeights.push({ hpt: 22 })
        }
        monthlyWs['!rows'] = monthlyRowHeights

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

      // Create worksheet with proper cell objects for styling
      const dishWs = {}

      // Title row (row 0) - merged across all columns
      const dishTitleText = `TOP ${dishLimit} MÓN CÓ DOANH THU CAO NHẤT (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
      dishWs['A1'] = {
        v: dishTitleText,
        t: 's',
        s: {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: thinBorder
        }
      }
      // Fill empty merged cells with border
      for (let i = 1; i < dishHeaders.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
        dishWs[cellRef] = {
          v: '',
          t: 's',
          s: { border: thinBorder }
        }
      }

      // Header row (row 2, index 1)
      dishHeaders.forEach((header, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
        dishWs[cellRef] = {
          v: header,
          t: 's',
          s: {
            fill: { fgColor: { rgb: 'D9E8FB' } },
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder
          }
        }
      })

      // Data rows (starting from row 3, index 2)
      dishDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

          dishWs[cellRef] = {
            v: val,
            t: typeof val === 'number' ? 'n' : 's',
            s: {
              alignment: {
                horizontal: colIdx === 0 ? 'center' : (colIdx === 1 || colIdx === 2 ? 'left' : 'right'),
                vertical: 'center',
                wrapText: colIdx === 1 || colIdx === 2 // Tự xuống dòng cho cột Tên món và Danh mục
              },
              border: thinBorder
            }
          }

          // Number format
          if (typeof val === 'number' && colIdx === 4) {
            dishWs[cellRef].z = '#,##0'
          }
          if (typeof val === 'number' && colIdx === 5) {
            dishWs[cellRef].z = '#,##0.00'
          }
        })
      })

      // Total row
      const dishTotalRowIdx = dishDataRows.length + 2
      dishTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: dishTotalRowIdx, c: colIdx })
        dishWs[cellRef] = {
          v: val,
          t: typeof val === 'number' ? 'n' : 's',
          s: {
            fill: { fgColor: { rgb: 'F5F5F5' } },
            font: { bold: true, sz: 11 },
            alignment: {
              horizontal: colIdx === 1 ? 'center' : 'right',
              vertical: 'center'
            },
            border: thinBorder
          }
        }
        if (typeof val === 'number') {
          dishWs[cellRef].z = '#,##0'
        }
      })

      // Set range for worksheet
      dishWs['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: dishTotalRowIdx, c: dishHeaders.length - 1 }
      })

      // Merge title cell across all columns
      dishWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: dishHeaders.length - 1 } }
      ]

      // Set column widths
      dishWs['!cols'] = [
        { wch: 6 },   // STT
        { wch: 45 },  // Tên món - tăng độ rộng để hiển thị đầy đủ
        { wch: 20 },  // Danh mục
        { wch: 16 },  // Số lượng bán
        { wch: 20 },  // Doanh thu
        { wch: 16 }   // Tăng trưởng
      ]

      // Set row heights
      const dishRowHeights = [{ hpt: 25 }] // Title row
      for (let i = 0; i <= dishDataRows.length; i++) {
        dishRowHeights.push({ hpt: 22 })
      }
      dishWs['!rows'] = dishRowHeights

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

      // Create worksheet with proper cell objects for styling
      const categoryWs = {}

      // Title row (row 0) - merged across all columns
      const categoryTitleText = `DOANH THU THEO DANH MỤC (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
      categoryWs['A1'] = {
        v: categoryTitleText,
        t: 's',
        s: {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: thinBorder
        }
      }
      // Fill empty merged cells with border
      for (let i = 1; i < categoryHeaders.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
        categoryWs[cellRef] = {
          v: '',
          t: 's',
          s: { border: thinBorder }
        }
      }

      // Header row (row 2, index 1)
      categoryHeaders.forEach((header, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
        categoryWs[cellRef] = {
          v: header,
          t: 's',
          s: {
            fill: { fgColor: { rgb: 'D9E8FB' } },
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: thinBorder
          }
        }
      })

      // Data rows (starting from row 3, index 2)
      categoryDataRows.forEach((row, rowIdx) => {
        row.forEach((val, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

          categoryWs[cellRef] = {
            v: val,
            t: typeof val === 'number' ? 'n' : 's',
            s: {
              alignment: {
                horizontal: colIdx === 0 ? 'center' : (colIdx === 1 ? 'left' : 'right'),
                vertical: 'center'
              },
              border: thinBorder
            }
          }

          // Number format
          if (typeof val === 'number' && colIdx === 4) {
            categoryWs[cellRef].z = '#,##0'
          }
          if (typeof val === 'number' && colIdx === 5) {
            categoryWs[cellRef].z = '#,##0.00'
          }
        })
      })

      // Total row
      const categoryTotalRowIdx = categoryDataRows.length + 2
      categoryTotals.forEach((val, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: categoryTotalRowIdx, c: colIdx })
        categoryWs[cellRef] = {
          v: val,
          t: typeof val === 'number' ? 'n' : 's',
          s: {
            fill: { fgColor: { rgb: 'F5F5F5' } },
            font: { bold: true, sz: 11 },
            alignment: {
              horizontal: colIdx === 1 ? 'center' : 'right',
              vertical: 'center'
            },
            border: thinBorder
          }
        }
        if (typeof val === 'number') {
          categoryWs[cellRef].z = colIdx === 5 ? '#,##0.00' : '#,##0'
        }
      })

      // Set range for worksheet
      categoryWs['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: categoryTotalRowIdx, c: categoryHeaders.length - 1 }
      })

      // Merge title cell across all columns
      categoryWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: categoryHeaders.length - 1 } }
      ]

      // Set column widths
      categoryWs['!cols'] = [
        { wch: 6 },   // STT
        { wch: 25 },  // Danh mục
        { wch: 12 },  // Số món
        { wch: 16 },  // Số lượng bán
        { wch: 20 },  // Doanh thu
        { wch: 14 }   // Tỷ trọng
      ]

      // Set row heights
      const categoryRowHeights = [{ hpt: 25 }] // Title row
      for (let i = 0; i <= categoryDataRows.length; i++) {
        categoryRowHeights.push({ hpt: 22 })
      }
      categoryWs['!rows'] = categoryRowHeights

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

  // ==================== RENDER ==
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
                <Card
                  bordered={false}
                  className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-35 overflow-hidden"
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={22} strokeWidth={2} color="#226533" />
                    </div>
                    <Text className="text-gray-500 text-lg font-medium tracking-wide mt-1">
                      Tổng doanh thu
                    </Text>
                  </div>
                  <div>
                    <Title
                      level={3}
                      className="text-gray-800 text-xl font-semibold leading-none tracking-tight float-end"
                      style={{ margin: '12px 0 4px 0' }}
                    >
                      {formatCurrency(totalRevenue)}
                    </Title>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered={false}
                  className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-35 overflow-hidden"
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={22} strokeWidth={2} color="#faad14" />
                    </div>
                    <Text className="text-gray-500 text-lg font-medium tracking-wide mt-1">
                      Tổng đơn hàng
                    </Text>
                  </div>
                  <div>
                    <Title
                      level={3}
                      className="text-gray-800 text-2xl font-semibold leading-none tracking-tight float-end"
                      style={{ margin: '12px 0 4px 0' }}
                    >
                      {totalOrders.toLocaleString()}
                    </Title>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered={false}
                  className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-35 overflow-hidden"
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
                      <Users size={22} strokeWidth={2} color="#1890ff" />
                    </div>
                    <Text className="text-gray-500 text-lg font-medium tracking-wide mt-1">
                      Tổng khách hàng
                    </Text>
                  </div>
                  <div>
                    <Title
                      level={3}
                      className="text-gray-800 text-2xl font-semibold leading-none tracking-tight float-end"
                      style={{ margin: '12px 0 4px 0' }}
                    >
                      {totalCustomers.toLocaleString()}
                    </Title>
                  </div>
                </Card>
              </Col>
            </Row>            {/* 1. BIỂU ĐỒ XU HƯỚNG KINH DOANH */}
            <Row gutter={[20, 20]} className="mb-6">
              <Col xs={24}>
                <Card
                  bordered={false}
                  className="rounded-2xl border border-gray-100 shadow-sm"
                  title={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <Clock size={20} strokeWidth={2.5} color="#1890ff" />
                        </div>
                        <div>
                          <Text strong className="text-base text-gray-800 block leading-tight">
                            Xu Hướng Kinh Doanh
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Doanh thu và đơn hàng theo thời gian
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
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                          <Package size={20} strokeWidth={2.5} color="#722ed1" />
                        </div>
                        <div>
                          <Text strong className="text-base text-gray-800 block leading-tight">
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
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
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
                    <div className="flex items-center gap-2 py-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                        <Award size={20} strokeWidth={2.5} color="#fa8c16" />
                      </div>
                      <div>
                        <Text strong className="text-base text-gray-800 block leading-tight">
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
                                  background: item.color,
                                  flexShrink: 0
                                }}
                              />
                              <Text strong className="text-sm truncate">{item.category}</Text>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                              <Text className="text-xs text-gray-500 text-right" style={{ minWidth: '50px' }}>{item.dishes} món</Text>
                              <Text strong className="text-sm text-right mr-4" style={{ minWidth: '110px' }}>{formatCurrency(item.revenue)}</Text>
                              <Tag color={item.color} className="font-semibold" style={{ minWidth: '60px', textAlign: 'center', margin: 0 }}>
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
